"use client";

import { useState } from "react";

const NEIGHBORHOODS = [
  "Lincoln Park", "Lakeview", "Wicker Park", "Logan Square", "Bucktown",
  "Roscoe Village", "West Loop", "South Loop", "Gold Coast", "River North",
  "Evanston", "Oak Park", "Other",
];

const ITEM_COUNTS = ["1-5", "6-15", "16-30", "30+"];

const SOURCES = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "GOOGLE", label: "Google" },
  { value: "NEXTDOOR", label: "Nextdoor" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "REFERRAL", label: "Referral" },
  { value: "LAKESHORE", label: "Lakeshore Hauling" },
  { value: "WEBSITE", label: "Website" },
  { value: "OTHER", label: "Other" },
];

export default function IntakeForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    neighborhood: "",
    itemsDescription: "",
    estimatedItems: "",
    source: "",
    smsConsent: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: false }));
  }

  function validate(): boolean {
    const errs: string[] = [];
    const fErrs: Record<string, boolean> = {};

    if (!form.name.trim()) { errs.push("Name is required"); fErrs.name = true; }
    if (!form.phone.trim()) { errs.push("Phone number is required"); fErrs.phone = true; }
    else if (form.phone.replace(/\D/g, "").length < 10) { errs.push("Please enter a valid phone number"); fErrs.phone = true; }
    if (!form.itemsDescription.trim()) { errs.push("Please tell us what you'd like to sell"); fErrs.itemsDescription = true; }
    if (!form.smsConsent) { errs.push("SMS consent is required to proceed"); fErrs.smsConsent = true; }

    setErrors(errs);
    setFieldErrors(fErrs);
    return errs.length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors([]);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmittedName(data.name);
        setSuccess(true);
      } else {
        setErrors(data.errors || ["Something went wrong. Please try again."]);
      }
    } catch {
      setErrors(["Network error. Please check your connection and try again."]);
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
            <h1 style={{ ...styles.heading, fontSize: 28, marginBottom: 12 }}>
              Thanks, {submittedName}!
            </h1>
            <p style={{ fontSize: 18, color: "#555", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
              We'll text you within 24 hours to schedule your free in-home estimate. Keep an eye on your phone!
            </p>
            <div style={{ marginTop: 32, padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
              <p style={{ fontSize: 14, color: "#166534", margin: 0 }}>
                No upfront costs. No obligation. We handle everything.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>SA</div>
            <span style={styles.logoText}>Sale Advisor</span>
          </div>
          <h1 style={styles.heading}>Get Paid for What You're Not Using</h1>
          <p style={styles.subheading}>
            We come to you, catalog everything, list it everywhere, deliver it, and get you paid. No upfront cost.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div style={styles.errorBox}>
              {errors.map((err, i) => (
                <div key={i} style={{ marginBottom: i < errors.length - 1 ? 4 : 0 }}>{err}</div>
              ))}
            </div>
          )}

          {/* Name */}
          <div style={styles.field}>
            <label style={styles.label}>Your Name <span style={styles.required}>*</span></label>
            <input
              style={{ ...styles.input, ...(fieldErrors.name ? styles.inputError : {}) }}
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>Phone Number <span style={styles.required}>*</span></label>
            <input
              style={{ ...styles.input, ...(fieldErrors.phone ? styles.inputError : {}) }}
              type="tel"
              placeholder="(312) 555-1234"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email <span style={styles.optional}>(optional)</span></label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          {/* Neighborhood */}
          <div style={styles.field}>
            <label style={styles.label}>Neighborhood / Area <span style={styles.optional}>(optional)</span></label>
            <select
              style={styles.input}
              value={form.neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
            >
              <option value="">Select your area</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* What to sell */}
          <div style={styles.field}>
            <label style={styles.label}>What are you looking to sell? <span style={styles.required}>*</span></label>
            <textarea
              style={{ ...styles.input, ...styles.textarea, ...(fieldErrors.itemsDescription ? styles.inputError : {}) }}
              placeholder="Tell us about the items — furniture, electronics, appliances, art, etc."
              value={form.itemsDescription}
              onChange={(e) => update("itemsDescription", e.target.value)}
              rows={4}
            />
          </div>

          {/* Estimated items */}
          <div style={styles.field}>
            <label style={styles.label}>Estimated Number of Items</label>
            <select
              style={styles.input}
              value={form.estimatedItems}
              onChange={(e) => update("estimatedItems", e.target.value)}
            >
              <option value="">Select</option>
              {ITEM_COUNTS.map((c) => (
                <option key={c} value={c}>{c} items</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div style={styles.field}>
            <label style={styles.label}>How did you hear about us?</label>
            <select
              style={styles.input}
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
            >
              <option value="">Select</option>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* SMS Consent */}
          <div style={{ ...styles.field, ...styles.checkboxField }}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.smsConsent}
                onChange={(e) => update("smsConsent", e.target.checked)}
                style={styles.checkbox}
              />
              <span style={{ ...(fieldErrors.smsConsent ? { color: "#dc2626" } : {}) }}>
                I agree to receive text messages from Sale Advisor about my consignment inquiry. Message & data rates may apply.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submit, ...(loading ? styles.submitDisabled : {}) }}
          >
            {loading ? "Submitting…" : "Get My Free Estimate"}
          </button>

          {/* Trust signals */}
          <div style={styles.trust}>
            <div style={styles.trustItem}>✓ No upfront costs</div>
            <div style={styles.trustItem}>✓ Free in-home estimate</div>
            <div style={styles.trustItem}>✓ We handle everything</div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Sale Advisor · Chicago, IL</p>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 560,
    background: "#ffffff",
    borderRadius: 16,
    padding: "40px 32px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 40,
    height: 40,
    background: "linear-gradient(135deg, #1B2A4A, #2D6A4F)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800 as const,
    color: "#C9A84C",
  },
  logoText: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: "#1B2A4A",
  },
  heading: {
    fontSize: 24,
    fontWeight: 700 as const,
    color: "#1B2A4A",
    margin: "0 0 8px",
    lineHeight: 1.3,
  },
  subheading: {
    fontSize: 15,
    color: "#64748b",
    margin: 0,
    lineHeight: 1.5,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 500 as const,
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: "#dc2626",
  },
  optional: {
    color: "#94a3b8",
    fontWeight: 400 as const,
    fontSize: 13,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 16,
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    outline: "none",
    transition: "border-color 0.2s",
    background: "#fafafa",
    color: "#1a1a1a",
    boxSizing: "border-box" as const,
  },
  inputError: {
    borderColor: "#dc2626",
    background: "#fef2f2",
  },
  textarea: {
    resize: "vertical" as const,
    minHeight: 100,
  },
  checkboxField: {
    marginTop: 4,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
    cursor: "pointer",
  },
  checkbox: {
    marginTop: 3,
    width: 18,
    height: 18,
    flexShrink: 0,
    accentColor: "#2D6A4F",
  },
  submit: {
    width: "100%",
    padding: "16px 24px",
    fontSize: 17,
    fontWeight: 600 as const,
    color: "#ffffff",
    background: "linear-gradient(135deg, #1B2A4A, #2D6A4F)",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 8,
    transition: "opacity 0.2s",
  },
  submitDisabled: {
    opacity: 0.7,
    cursor: "wait",
  },
  trust: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
    flexWrap: "wrap" as const,
  },
  trustItem: {
    fontSize: 13,
    color: "#2D6A4F",
    fontWeight: 500 as const,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 20,
    fontSize: 14,
    color: "#dc2626",
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    color: "#94a3b8",
  },
};
