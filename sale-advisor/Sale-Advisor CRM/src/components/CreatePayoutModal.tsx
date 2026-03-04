"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface ClientOption {
  id: string;
  name: string;
}

export default function CreatePayoutModal({
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
    grossSale: "",
    commissionPercent: "25",
    deliveryFee: "0",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Live calculation
  const gross = parseFloat(form.grossSale) || 0;
  const commPct = parseFloat(form.commissionPercent) || 0;
  const deliveryFee = parseFloat(form.deliveryFee) || 0;
  const commissionDollars = gross * (commPct / 100);
  const netPayout = gross - commissionDollars - deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        grossSaleCents: Math.round(gross * 100),
        commissionPercent: commPct,
        deliveryFeeCents: Math.round(deliveryFee * 100),
      }),
    });

    if (res.ok) {
      toast("Payout created");
      router.refresh();
      onClose();
    } else {
      const data = await res.json();
      toast(data.errors?.[0] || "Failed to create payout", "error");
    }

    setLoading(false);
  }

  const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Create Payout</h1>
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
            <label className="form-label">Gross Sale ($) *</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.grossSale}
              onChange={(e) => set("grossSale", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Commission %</label>
              <input
                className="form-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.commissionPercent}
                onChange={(e) => set("commissionPercent", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Fee ($)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.deliveryFee}
                onChange={(e) => set("deliveryFee", e.target.value)}
              />
            </div>
          </div>

          {/* Live calculation preview */}
          {gross > 0 && (
            <div style={{
              background: "var(--bg-secondary)", borderRadius: 8, padding: 14,
              marginBottom: 16, fontSize: 13,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>Gross Sale</span>
                <span>{fmtUsd(gross)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "var(--text-muted)" }}>Commission ({commPct}%)</span>
                <span style={{ color: "var(--accent)" }}>-{fmtUsd(commissionDollars)}</span>
              </div>
              {deliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--text-muted)" }}>Delivery Fee</span>
                  <span style={{ color: "var(--text-secondary)" }}>-{fmtUsd(deliveryFee)}</span>
                </div>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4,
                fontWeight: 700,
              }}>
                <span>Client Payout</span>
                <span style={{ color: netPayout >= 0 ? "var(--green)" : "var(--red)" }}>
                  {fmtUsd(netPayout)}
                </span>
              </div>
              {netPayout < 0 && (
                <div style={{ color: "var(--red)", fontSize: 11, marginTop: 6 }}>
                  Payout cannot be negative — adjust commission or delivery fee.
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading || netPayout < 0}
            >
              {loading ? "Creating..." : "Create Payout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
