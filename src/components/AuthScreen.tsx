import { useState } from "react";
import { signIn, signUp, signInWithGoogle } from "../services/auths";

interface Props {
  onAuthed: () => void;
  onBack?: () => void;
}

type Mode = "login" | "signup";

export function AuthScreen({ onAuthed, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setError(error.message);
          return;
        }
        onAuthed();
      } else {
        const { data, error } = await signUp(email.trim(), password);
        if (error) {
          setError(error.message);
          return;
        }
        // With email confirmation enabled there's no session yet — the user must
        // confirm via the emailed link before they can sign in.
        if (data.session) {
          onAuthed();
        } else {
          setInfo("Account created. Check your email to confirm, then sign in.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    // On success the browser redirects away; we only land here on failure.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="screen auth-screen">
      <div className="game-title">DIABOLO</div>
      <p className="subtitle">
        {mode === "login" ? "Sign in to your account" : "Create an account"}
      </p>

      <form className="auth-panel" onSubmit={handleSubmit}>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === "login" ? " active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab${mode === "signup" ? " active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <label className="auth-label">
          Email
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="auth-label">
          Password
          <input
            className="auth-input"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="auth-google-button"
          type="button"
          onClick={handleGoogle}
          disabled={loading}
        >
          Continue with Google
        </button>

        {onBack && (
          <button className="auth-back-button" type="button" onClick={onBack}>
            Back
          </button>
        )}
      </form>
    </div>
  );
}
