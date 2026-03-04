"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify");
  const authError = searchParams.get("error");

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/" });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("email", {
      email,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Sign-in failed. Make sure you're using an authorized email.");
    } else {
      window.location.href = "/login?verify=1";
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          className="logo-icon"
          style={{
            margin: "0 auto 16px",
            width: 56,
            height: 56,
            fontSize: 24,
          }}
        >
          SA
        </div>
        <h1>Sale Advisor</h1>
        {verify ? (
          <>
            <p style={{ color: "var(--green)", marginTop: 12, fontWeight: 600 }}>
              Check your email
            </p>
            <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
              We sent a magic link to your inbox. Click it to sign in.
            </p>
          </>
        ) : (
          <p>Sign in to your dashboard</p>
        )}
      </div>

      {authError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {authError === "Denied"
            ? "This account is not permitted to access the CRM."
            : authError === "WrongDomain"
            ? "Use your @saleadvisor.com Google account."
            : authError === "AccessDenied"
            ? "Access denied. Only authorized @saleadvisor.com accounts can sign in."
            : authError === "OAuthAccountNotLinked"
            ? "This email is already linked to another sign-in method."
            : "Something went wrong. Try again."}
        </div>
      )}

      {!verify && (
        <>
          {/* Google sign-in */}
          <button
            type="button"
            className="btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              width: "100%",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 500,
              cursor: googleLoading ? "not-allowed" : "pointer",
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Sign in with Google"}
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
            gap: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>or use email</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email magic link */}
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@saleadvisor.com"
                autoComplete="off"
                required
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Magic Link"}
            </button>
          </form>
        </>
      )}

      {verify && (
        <button
          className="btn btn-secondary"
          style={{ width: "100%", marginTop: 16 }}
          onClick={() => (window.location.href = "/login")}
        >
          Try a different email
        </button>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="login-container">
      <div className="login-card">
        <Suspense fallback={<div style={{ textAlign: "center", padding: 40 }}>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
