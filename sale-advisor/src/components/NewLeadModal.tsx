"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const sources = [
  "FACEBOOK", "INSTAGRAM", "GOOGLE", "NEXTDOOR",
  "TIKTOK", "REFERRAL", "LAKESHORE", "WEBSITE", "OTHER",
];

export default function NewLeadModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "OTHER",
    neighborhood: "", itemsDescription: "", estimatedValue: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    router.refresh();
    onClose();
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="login-card"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>New Lead</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Source</label>
              <select className="form-input" value={form.source} onChange={(e) => set("source", e.target.value)}>
                {sources.map((s) => (
                  <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Neighborhood</label>
              <input className="form-input" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Items Description</label>
            <input className="form-input" value={form.itemsDescription} onChange={(e) => set("itemsDescription", e.target.value)} placeholder="furniture, electronics, etc." />
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Value ($)</label>
            <input className="form-input" type="number" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
