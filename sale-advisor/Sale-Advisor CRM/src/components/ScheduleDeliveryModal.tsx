"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface ClientOption {
  id: string;
  name: string;
}

export default function ScheduleDeliveryModal({
  clients,
  onClose,
}: {
  clients: ClientOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    description: "",
    fromAddress: "",
    toAddress: "",
    crewSize: "2",
    scheduledAt: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        description: form.description,
        fromAddress: form.fromAddress,
        toAddress: form.toAddress,
        crewSize: form.crewSize,
        scheduledAt: form.scheduledAt || null,
      }),
    });

    if (res.ok) {
      toast("Delivery scheduled");
      router.refresh();
      onClose();
    } else {
      const data = await res.json();
      toast(data.errors?.[0] || "Failed to schedule delivery", "error");
    }

    setLoading(false);
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
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Schedule Delivery</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select
              className="form-input"
              required
              value={form.clientId}
              onChange={(e) => set("clientId", e.target.value)}
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              className="form-input"
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Couch + dining table pickup"
            />
          </div>
          <div className="form-group">
            <label className="form-label">From Address *</label>
            <input
              className="form-input"
              required
              value={form.fromAddress}
              onChange={(e) => set("fromAddress", e.target.value)}
              placeholder="Pickup address"
            />
          </div>
          <div className="form-group">
            <label className="form-label">To Address *</label>
            <input
              className="form-input"
              required
              value={form.toAddress}
              onChange={(e) => set("toAddress", e.target.value)}
              placeholder="Delivery address"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Crew Size</label>
              <input
                className="form-input"
                type="number"
                min={1}
                max={10}
                value={form.crewSize}
                onChange={(e) => set("crewSize", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Scheduled Date</label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => set("scheduledAt", e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Delivery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
