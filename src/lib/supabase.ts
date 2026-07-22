import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auth + cloud sync are OPTIONAL. If the build has no Supabase config, the game
// must still run offline (localStorage) instead of white-screening. So we warn
// (not throw) and expose this flag; the app hides all auth UI and skips every
// Supabase call when it's false, so the placeholder client below is never used.
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase not configured — sign-in & cloud sync are disabled. Set " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (in .env locally and in your " +
      "build/hosting environment) to enable them.",
  );
}

// A placeholder URL keeps createClient from throwing when unconfigured; nothing
// calls it in that case because isSupabaseConfigured gates all usage.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
);
