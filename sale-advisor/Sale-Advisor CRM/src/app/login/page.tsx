"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify");
  const authError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
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
          <p>Sign in with your email</p>
        )}
      </div>

      {authError && (
        <div className="form-error" style={{ marginBottom: 16 }}>
          {authError === "AccessDenied"
            ? "Access denied. Only authorized team members can sign in."
            : "Something went wrong. Try again."}
        </div>
      )}

      {!verify && (
        <form onSubmit={handleSubmit}>
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
              placeholder="logan@saleadvisor.com"
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
