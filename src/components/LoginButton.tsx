import { supabase } from "../lib/supabase";

export function LoginButton() {
  async function login() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error(error);
    }
  }

  return <button onClick={login}>Continue with Google</button>;
}
