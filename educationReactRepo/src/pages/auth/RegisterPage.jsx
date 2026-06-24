import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { api } from "../../lib/api/client";

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      if (form.phone.trim()) {
        body.phone = form.phone.trim();
      }

      await api.post("/students/register", body, true);
      setSuccess("Account created. Redirecting to sign in...");
      window.setTimeout(() => navigate("/login"), 1500);
    } catch (submitError) {
      setError(submitError.message || "Registration failed. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Student registration is free and instant."
      brandTitle={"Join EduCenter<br />as a student."}
      brandText="Create your account in seconds and start exploring courses offered by our expert instructors."
      features={[
        "Browse the full course catalogue",
        "Submit enrollment requests",
        "Track your grades",
      ]}
      footer={
        <p className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="full_name">
            Full name <span className="req">*</span>
          </label>
          <input
            className="form-input"
            id="full_name"
            name="full_name"
            placeholder="Ahmad Al-Rashidi"
            autoComplete="name"
            value={form.full_name}
            onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
          />
        </div>

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
          <label className="form-label" htmlFor="phone">
            Phone number
          </label>
          <input
            className="form-input"
            type="tel"
            id="phone"
            name="phone"
            placeholder="+34 600 000 000"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
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
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <p className="form-hint">Minimum 8 characters.</p>
        </div>

        {error ? (
          <div className="rejection-note" role="alert">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="info-box" role="status">
            {success}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
