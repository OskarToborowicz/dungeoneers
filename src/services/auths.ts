import { supabase } from "../lib/supabase";

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Return to this exact app URL after Google auth. BASE_URL carries the
      // Vite base (e.g. "/dungeoneers/" or "/"). This URL must also be added to
      // Supabase → Authentication → URL Configuration → Redirect URLs.
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}
