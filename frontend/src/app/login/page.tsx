"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        window.location.href = redirect;
      }
    }
    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--base-100)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "2.75rem",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "var(--accent-3)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
            }}
          >
            NutriTrack AI
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            color: "var(--base-300)",
            marginBottom: "0.5rem",
            fontSize: "3.5rem",
          }}
        >
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h3>
        <p
          style={{
            color: "var(--base-secondary-dark)",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          {mode === "login"
            ? "Sign in to track your nutrition and activities."
            : "Join NutriTrack AI to start your health journey."}
        </p>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.85rem 1.5rem",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--base-300)",
            color: "var(--base-100)",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.82rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            transition: "all var(--transition-fast)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          ▶ Continue with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.75rem 0",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "var(--base-200)",
            }}
          />
          <span
            className="mono"
            style={{
              color: "var(--base-secondary-dark)",
              fontSize: "0.7rem",
            }}
          >
            or
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              backgroundColor: "var(--base-200)",
            }}
          />
        </div>

        {/* Email/Password Form */}
        <form
          onSubmit={handleEmailAuth}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div>
            <label
              className="mono"
              style={{
                color: "var(--base-secondary-dark)",
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label
              className="mono"
              style={{
                color: "var(--base-secondary-dark)",
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "0.5rem",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? "Processing..."
              : mode === "login"
              ? "▶ Sign In"
              : "▶ Create Account"}
          </button>
        </form>

        {/* Error / Message */}
        {error && (
          <p
            className="mono"
            style={{
              color: "var(--accent-2)",
              marginTop: "1rem",
              fontSize: "0.78rem",
            }}
          >
            {error}
          </p>
        )}
        {message && (
          <p
            className="mono"
            style={{
              color: "var(--accent-4)",
              marginTop: "1rem",
              fontSize: "0.78rem",
            }}
          >
            {message}
          </p>
        )}

        {/* Toggle mode */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.88rem",
            color: "var(--base-secondary-dark)",
            textAlign: "center",
          }}
        >
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setMessage("");
            }}
            style={{
              color: "var(--base-300)",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              cursor: "pointer",
              background: "none",
              border: "none",
              font: "inherit",
            }}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* Privacy link */}
        <p
          className="mono"
          style={{
            marginTop: "2rem",
            fontSize: "0.7rem",
            color: "var(--base-secondary-dark)",
            textAlign: "center",
          }}
        >
          By continuing, you agree to our{" "}
          <Link
            href="/privacy"
            style={{
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            }}
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}
