"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/Toast";

type Campaign = {
  id: string;
  name: string;
  platform: string;
  status: string;
  budgetCents: number | null;
  startDate: string | null;
  endDate: string | null;
  targetAudience: string | null;
  notes: string | null;
  utmCampaign: string | null;
  createdAt: string;
  leadCount: number;
  costPerLead: number | null;
};

const PLATFORMS = [
  { value: "meta", label: "Meta (Facebook/Instagram)" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "nextdoor", label: "Nextdoor" },
  { value: "other", label: "Other" },
];

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
  ACTIVE: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  PAUSED: { bg: "rgba(234,179,8,0.15)", color: "#eab308" },
  COMPLETED: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
};

const PLATFORM_ICONS: Record<string, string> = {
  meta: "📘",
  google: "🔍",
  tiktok: "🎵",
  nextdoor: "🏡",
  other: "📢",
};

export default function CampaignsView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Form state
  const [form, setForm] = useState({
    name: "",
    platform: "meta",
    budgetDollars: "",
    startDate: "",
    targetAudience: "",
    utmCampaign: "",
    notes: "",
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          platform: form.platform,
          budgetCents: form.budgetDollars ? Math.round(Number(form.budgetDollars) * 100) : null,
          startDate: form.startDate || null,
          targetAudience: form.targetAudience.trim() || null,
          utmCampaign: form.utmCampaign.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast("Campaign created");
        setShowForm(false);
        setForm({ name: "", platform: "meta", budgetDollars: "", startDate: "", targetAudience: "", utmCampaign: "", notes: "" });
        fetchCampaigns();
      } else {
        toast(data.errors?.[0] || "Failed to create", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    // Optimistic update
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
    toast(`Campaign ${newStatus.toLowerCase()}`);
  }

  // Totals
  const totalBudget = campaigns.reduce((s, c) => s + (c.budgetCents || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leadCount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#888" }}>Active Campaigns</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{activeCampaigns}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#888" }}>Total Budget</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#eab308" }}>
            ${(totalBudget / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "#888" }}>Leads Generated</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{totalLeads}</div>
        </div>
      </div>

      {/* Create button / form */}
      <div style={{ marginBottom: 24 }}>
        {showForm ? (
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px" }}>New Campaign</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Campaign Name *</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Platform</label>
                  <select className="form-input" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} style={{ width: "100%" }}>
                    {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Budget ($)</label>
                  <input className="form-input" type="number" step="0.01" min="0" placeholder="0.00" value={form.budgetDollars} onChange={(e) => setForm((f) => ({ ...f, budgetDollars: e.target.value }))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Start Date</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Target Audience</label>
                  <input className="form-input" placeholder="e.g., Parents 35-55, Lincoln Park" value={form.targetAudience} onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>UTM Campaign Tag</label>
                  <input className="form-input" placeholder="e.g., spring-2026-chicago" value={form.utmCampaign} onChange={(e) => setForm((f) => ({ ...f, utmCampaign: e.target.value }))} style={{ width: "100%" }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ width: "100%", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Creating…" : "Create Campaign"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Campaign</button>
        )}
      </div>

      {/* Campaign list */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>All Campaigns</h3>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#888" }}>Loading…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
            No campaigns yet. Create your first campaign to start tracking ad performance.
          </div>
        ) : (
          <div>
            {campaigns.map((c) => {
              const sc = STATUS_COLORS[c.status] || STATUS_COLORS.DRAFT;
              return (
                <div key={c.id} style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{PLATFORM_ICONS[c.platform] || "📢"}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {PLATFORMS.find((p) => p.value === c.platform)?.label || c.platform}
                          {c.targetAudience && ` · ${c.targetAudience}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          background: sc.bg,
                          color: sc.color,
                          cursor: "pointer",
                        }}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                    {c.budgetCents != null && (
                      <div>
                        <span style={{ color: "#888" }}>Budget: </span>
                        <span style={{ fontWeight: 500 }}>${(c.budgetCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "#888" }}>Leads: </span>
                      <span style={{ fontWeight: 500, color: c.leadCount > 0 ? "#22c55e" : "#888" }}>{c.leadCount}</span>
                    </div>
                    {c.costPerLead != null && (
                      <div>
                        <span style={{ color: "#888" }}>CPL: </span>
                        <span style={{ fontWeight: 500, color: c.costPerLead < 2000 ? "#22c55e" : c.costPerLead < 3500 ? "#eab308" : "#ef4444" }}>
                          ${(c.costPerLead / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {c.startDate && (
                      <div>
                        <span style={{ color: "#888" }}>Started: </span>
                        <span>{new Date(c.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {c.utmCampaign && (
                      <div>
                        <span style={{ color: "#888" }}>UTM: </span>
                        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{c.utmCampaign}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
