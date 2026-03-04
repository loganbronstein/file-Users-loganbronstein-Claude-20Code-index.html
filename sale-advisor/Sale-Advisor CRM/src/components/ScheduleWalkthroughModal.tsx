"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  name: string;
  neighborhood: string | null;
  phone: string | null;
}

interface Props {
  leadId?: string;
  leadName?: string;
  onClose: () => void;
}

export default function ScheduleWalkthroughModal({ leadId: preselectedLeadId, leadName, onClose }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState(preselectedLeadId || "");

  useEffect(() => {
    if (!preselectedLeadId) {
      fetch("/api/leads?unconverted=true")
        .then((r) => r.json())
        .then((data) => {
          // Filter to unconverted leads
          const unconverted = (Array.isArray(data) ? data : []).filter(
            (l: Lead & { convertedAt?: string }) => !l.convertedAt
          );
          setLeads(unconverted);
        })
        .catch(() => {});
    }
  }, [preselectedLeadId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const leadIdToUse = selectedLeadId || preselectedLeadId;
    if (!leadIdToUse) {
      toast("Select a lead", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/walkthroughs/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: leadIdToUse,
        walkthroughDate: form.get("walkthroughDate") as string,
        walkthroughAddress: form.get("walkthroughAddress") as string,
        walkthroughNotes: form.get("walkthroughNotes") as string || undefined,
      }),
    });

    if (res.ok) {
      toast("Walkthrough scheduled");
      onClose();
      router.refresh();
    } else {
      const err = await res.json();
      toast(err.errors?.[0] || "Failed to schedule", "error");
    }
    setSaving(false);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, padding: 32, width: "100%", maxWidth: 520,
        border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--text-primary)" }}>
          Schedule Walkthrough
        </div>

        <form onSubmit={handleSubmit}>
          {/* Lead selector — only shown when no leadId pre-selected */}
          {!preselectedLeadId && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Lead *
              </label>
              <select
                className="form-input"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                required
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}{lead.neighborhood ? ` — ${lead.neighborhood}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {preselectedLeadId && leadName && (
            <div style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)", fontSize: 13 }}>
              Lead: <strong>{leadName}</strong>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Date &amp; Time *
              </label>
              <input name="walkthroughDate" type="datetime-local" className="form-input" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Address *
              </label>
              <input name="walkthroughAddress" className="form-input" placeholder="123 Main St, Chicago IL" required />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Notes (optional)
            </label>
            <textarea name="walkthroughNotes" className="form-input" rows={3} placeholder="Gate code, parking info, items mentioned..." style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Scheduling..." : "Schedule Walkthrough"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
