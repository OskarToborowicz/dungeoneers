-- ============================================================================
-- Diabolo — Supabase Postgres schema
-- Paste into Supabase → SQL Editor and run. Safe to re-run (IF NOT EXISTS /
-- OR REPLACE / DROP ... IF EXISTS). Requires the built-in `auth` schema.
--
-- Design: a hero save is an opaque JSON blob (matches the client's SaveGame).
-- The app never queries inside it server-side, so one jsonb column per hero is
-- the right model. RLS scopes every row to its owner. See src/services/cloudSaves.ts.
--
-- ORDER MATTERS: game_saves is created FIRST and standalone. The profiles block
-- installs a trigger on auth.users, which is the only part that could fail on a
-- locked-down project — keeping it last means a failure there can't stop the
-- core saves table from being created.
-- ============================================================================

-- ── Helper: auto-touch updated_at on every UPDATE ───────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- game_saves — one row per hero, per user. `save` is the full SaveGame blob.
-- PK (user_id, slot_id): slot_id is the client-generated save id.
-- last_played_at is the client's JS timestamp (ms) — sync uses it for
-- last-write-wins conflict resolution.
-- ============================================================================
create table if not exists public.game_saves (
  user_id        uuid   not null default auth.uid()
                          references auth.users (id) on delete cascade,
  slot_id        text   not null,
  save           jsonb  not null,
  last_played_at bigint not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, slot_id),
  -- Cheap sanity guard: a valid save always carries a character object.
  constraint game_saves_has_character check (save ? 'character')
);

-- Ordering saves newest-first per user (list screen, merge).
create index if not exists game_saves_user_last_played_idx
  on public.game_saves (user_id, last_played_at desc);

alter table public.game_saves enable row level security;

drop policy if exists "game_saves: owner full access" on public.game_saves;
create policy "game_saves: owner full access"
  on public.game_saves for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists game_saves_set_updated_at on public.game_saves;
create trigger game_saves_set_updated_at
  before update on public.game_saves
  for each row execute function public.set_updated_at();

-- ============================================================================
-- spire_scores — Eternal Spire leaderboard. One row per user per mode (their
-- best floor). PUBLIC read (it's a leaderboard), owner-only write.
-- ============================================================================
create table if not exists public.spire_scores (
  user_id    uuid not null default auth.uid()
                    references auth.users (id) on delete cascade,
  mode       text not null check (mode in ('hardcore', 'softcore')),
  floor      int  not null,
  hero_name  text not null,
  class_id   text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

alter table public.spire_scores enable row level security;

drop policy if exists "spire_scores: public read"  on public.spire_scores;
drop policy if exists "spire_scores: owner writes" on public.spire_scores;

-- Anyone (including anon) may read the leaderboard.
create policy "spire_scores: public read"
  on public.spire_scores for select
  using (true);

-- Only the owner may insert/update/delete their own row.
create policy "spire_scores: owner writes"
  on public.spire_scores for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists spire_scores_set_updated_at on public.spire_scores;
create trigger spire_scores_set_updated_at
  before update on public.spire_scores
  for each row execute function public.set_updated_at();

-- ============================================================================
-- profiles — one row per auth user (app-facing account data). Auto-created on
-- signup. Extend later with display_name, avatar, stats, etc.
-- (Kept last: the auth.users trigger is the only permission-sensitive bit.)
-- ============================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: owner can read"   on public.profiles;
drop policy if exists "profiles: owner can update" on public.profiles;

create policy "profiles: owner can read"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles: owner can update"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up. SECURITY DEFINER so
-- it can insert regardless of the (not-yet-existing) session's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
