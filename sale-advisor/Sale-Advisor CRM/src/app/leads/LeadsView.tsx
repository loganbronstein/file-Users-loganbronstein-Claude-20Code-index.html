"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  neighborhood: string | null;
  itemsDescription: string | null;
  createdAt: string;
  client: { id: string } | null;
  _count: { messages: number };
}

const stageLabels: Record<string, { label: string; color: string; bg: string }> = {
  NEW_LEAD: { label: "New", color: "var(--blue)", bg: "var(--blue-bg)" },
  CONTACTED: { label: "Contacted", color: "var(--accent)", bg: "var(--accent-glow)" },
  WALKTHROUGH_BOOKED: { label: "Booked", color: "var(--green)", bg: "var(--green-bg)" },
  LOST: { label: "Lost", color: "var(--red)", bg: "var(--red-bg)" },
};

const stages = ["ALL", "NEW_LEAD", "CONTACTED", "WALKTHROUGH_BOOKED", "LOST"];

export default function LeadsView({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = filter === "ALL" ? leads : leads.filter((l) => l.stage === filter);

  async function createLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name") as string,
      phone: form.get("phone") as string,
      source: form.get("source") as string,
    };

    if (!data.name.trim()) {
      toast("Name is required", "error");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const lead = await res.json();
      toast(`Lead "${lead.name}" created`);
      setShowForm(false);
      router.refresh();
    } else {
      const err = await res.json();
      toast(err.error || "Failed to create lead", "error");
    }
    setSaving(false);
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {s === "ALL" ? "All" : stageLabels[s]?.label || s}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: 13 }}>
          + New Lead
        </button>
      </div>

      {/* New Lead Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, padding: 20 }}>
          <form onSubmit={createLead} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Name *</label>
              <input name="name" className="form-input" placeholder="John Smith" required />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Phone</label>
              <input name="phone" className="form-input" placeholder="312-555-1234" />
            </div>
            <div style={{ minWidth: 140 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Source</label>
              <select name="source" className="form-input" defaultValue="OTHER">
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="GOOGLE">Google</option>
                <option value="NEXTDOOR">Nextdoor</option>
                <option value="REFERRAL">Referral</option>
                <option value="WEBSITE">Website</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Create Lead"}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Name", "Phone", "Source", "Status", "Items", "Created"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    No leads found
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => {
                  const s = stageLabels[lead.stage] || stageLabels.LOST;
                  return (
                    <tr key={lead.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/leads/${lead.id}`} style={{ color: "var(--accent-light)", textDecoration: "none", fontWeight: 500 }}>
                          {lead.name}
                        </Link>
                        {lead.client && (
                          <span style={{ fontSize: 10, marginLeft: 8, padding: "2px 6px", borderRadius: 4, background: "var(--green-bg)", color: "var(--green)" }}>
                            converted
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{lead.phone || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{lead.source.replace(/_/g, " ")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 12 }}>
                        {lead.itemsDescription ? (lead.itemsDescription.length > 40 ? lead.itemsDescription.slice(0, 37) + "..." : lead.itemsDescription) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
