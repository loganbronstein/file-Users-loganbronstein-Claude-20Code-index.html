"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  phoneE164: string | null;
  email: string | null;
  source: string;
  stage: string;
  neighborhood: string | null;
  itemsDescription: string | null;
  estimatedValue: number | null;
  createdAt: string;
  convertedAt: string | null;
  client: { id: string; stage: string } | null;
  conversations: { id: string }[];
}

const stageLabels: Record<string, { label: string; color: string; bg: string }> = {
  NEW_LEAD: { label: "New Lead", color: "var(--blue)", bg: "var(--blue-bg)" },
  CONTACTED: { label: "Contacted", color: "var(--accent)", bg: "var(--accent-glow)" },
  WALKTHROUGH_BOOKED: { label: "Walkthrough Booked", color: "var(--green)", bg: "var(--green-bg)" },
  LOST: { label: "Lost", color: "var(--red)", bg: "var(--red-bg)" },
};

export default function LeadDetail({ lead }: { lead: Lead }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [startingConvo, setStartingConvo] = useState(false);

  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone || "");
  const [email, setEmail] = useState(lead.email || "");
  const [source, setSource] = useState(lead.source);
  const [stage, setStage] = useState(lead.stage);
  const [neighborhood, setNeighborhood] = useState(lead.neighborhood || "");
  const [items, setItems] = useState(lead.itemsDescription || "");

  async function saveChanges() {
    setSaving(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, email: email || null, source, stage, neighborhood: neighborhood || null, itemsDescription: items || null }),
    });

    if (res.ok) {
      toast("Lead updated");
      router.refresh();
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  }

  async function convertToClient() {
    if (lead.client) return;
    setConverting(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });

    if (res.ok) {
      const client = await res.json();
      toast(`Converted to client — ${client.name}`);
      router.push(`/clients/${client.id}`);
    } else {
      const err = await res.json();
      toast(err.error || "Conversion failed", "error");
    }
    setConverting(false);
  }

  async function startConversation() {
    if (lead.conversations.length > 0) {
      router.push("/messages");
      return;
    }
    if (!lead.phoneE164 && !phone) {
      toast("Phone number required to start a conversation", "error");
      return;
    }
    setStartingConvo(true);

    // Ensure phone is saved first, then the lead POST already upserts a conversation
    if (phone && !lead.phoneE164) {
      await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
    }

    // Create a conversation via a quick outbound message placeholder
    // Or just redirect — the conversation was created when the lead was created
    toast("Opening conversation...", "info");
    router.push("/messages");
    setStartingConvo(false);
  }

  const s = stageLabels[lead.stage] || stageLabels.NEW_LEAD;

  return (
    <>
      {/* Header */}
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/leads" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13 }}>Leads</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <h1 style={{ margin: 0 }}>{lead.name}</h1>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: s.bg, color: s.color }}>{s.label}</span>
          </div>
          <div className="header-subtitle" style={{ marginTop: 4 }}>
            {lead.phone || "No phone"} · {lead.source.replace(/_/g, " ")} · Created {new Date(lead.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={startConversation} disabled={startingConvo} style={{ fontSize: 13 }}>
            {lead.conversations.length > 0 ? "Open Messages" : "Start Conversation"}
          </button>
          {!lead.client ? (
            <button className="btn btn-primary" onClick={convertToClient} disabled={converting} style={{ fontSize: 13 }}>
              {converting ? "Converting..." : "Convert to Client"}
            </button>
          ) : (
            <Link href={`/clients/${lead.client.id}`} className="btn btn-primary" style={{ fontSize: 13, textDecoration: "none" }}>
              View Client
            </Link>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Phone</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Email</label>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Source</label>
            <select className="form-input" value={source} onChange={(e) => setSource(e.target.value)}>
              {["FACEBOOK", "INSTAGRAM", "GOOGLE", "NEXTDOOR", "TIKTOK", "REFERRAL", "LAKESHORE", "WEBSITE", "OTHER"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Stage</label>
            <select className="form-input" value={stage} onChange={(e) => setStage(e.target.value)}>
              {["NEW_LEAD", "CONTACTED", "WALKTHROUGH_BOOKED", "LOST"].map((s) => (
                <option key={s} value={s}>{stageLabels[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Neighborhood</label>
            <input className="form-input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Items Description</label>
            <textarea className="form-input" value={items} onChange={(e) => setItems(e.target.value)} rows={3} style={{ resize: "vertical" }} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={saveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
