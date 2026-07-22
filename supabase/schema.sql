-- ============================================================================
-- Diabolo — Supabase Postgres schema
-- Paste into Supabase → SQL Editor and run. Idempotent-ish: safe to re-run
-- (uses IF NOT EXISTS / OR REPLACE where possible). Requires the built-in
-- `auth` schema (present in every Supabase project).
--
-- Design: a hero save is an opaque JSON blob (matches the client's SaveGame).
-- The app never queries inside it server-side, so one jsonb column per hero is
-- the right model — simple, and the cloud-sync layer (src/services/cloudSaves.ts)
-- reads/writes whole saves. RLS scopes every row to its owner.
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
-- profiles — one row per auth user (app-facing account data). Auto-created on
-- signup. Extend later with display_name, avatar, stats, etc.
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

-- ============================================================================
-- game_saves — one row per hero, per user. `save` is the full SaveGame blob.
-- Primary key (user_id, slot_id): slot_id is the client-generated save id.
-- last_played_at is the client's JS timestamp (ms) — the sync layer uses it to
-- resolve which side is newer (last-write-wins).
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
