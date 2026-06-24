import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { api } from "../../lib/api/client";
import { getToken, getUser, redirectByRole, setSession } from "../../lib/auth/storage";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
}

export function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (token && user) {
      redirectByRole(user.role);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      }, true);

      const token = data?.access_token;
      if (!token) {
        throw new Error("Invalid response from server.");
      }

      let user = data.user
        ? { ...data.user, role: (data.user.role || "").toUpperCase() }
        : null;

      if (!user) {
        const claimedUser = decodeJwt(token);
        if (!claimedUser) {
          throw new Error("Could not read token. Please contact support.");
        }

        user = {
          id: claimedUser.id || claimedUser.userId || "",
          email: claimedUser.email || form.email.trim(),
          full_name: claimedUser.full_name || claimedUser.name || form.email.trim(),
          role: (claimedUser.role || claimedUser.roles?.[0] || "").toUpperCase(),
        };
      }

      if (!user.role) {
        throw new Error("Your account has no role assigned. Please contact an administrator.");
      }

      setSession(token, user);
      redirectByRole(user.role);
    } catch (submitError) {
      setError(submitError.message || "Sign-in failed. Please check your credentials.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to access your dashboard."
      brandTitle={"Knowledge<br />starts here."}
      brandText="A unified platform for students, teachers, and administrators to manage every part of the learning journey."
      features={[
        "Browse and enroll in courses",
        "Track grades and progress",
        "Manage schedules and rosters",
        "Review enrollment requests",
      ]}
      footer={
        <p className="auth-link">
          New student? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email address <span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password <span className="req">*</span>
          </label>
          <input
            className="form-input"
            type="password"
            id="password"
            name="password"
            placeholder="At least 8 characters"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </div>

        {error ? (
          <div className="rejection-note" role="alert">
            {error}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
