import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail loud and clear if the build didn't get its Supabase config — otherwise
// createClient throws a cryptic "supabaseUrl is required" and the app is blank.
// These must be set in .env locally AND in the host's build environment.
if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
      "in .env (local dev) and in your hosting provider's build settings.",
  );
}

export const supabase = createClient(url, anonKey);
