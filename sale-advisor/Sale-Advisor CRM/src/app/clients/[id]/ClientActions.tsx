"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface Props {
  clientId: string;
  clientName: string;
}

export function InventoryActions({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function createListing() {
    setLoading(true);
    const res = await fetch(`/api/inventory/${itemId}/create-listing`, { method: "POST" });
    if (res.ok) {
      const listing = await res.json();
      toast("Draft listing created");
      router.push(`/listings/${listing.id}`);
    } else {
      const err = await res.json();
      toast(err.errors?.[0] || "Failed", "error");
    }
    setLoading(false);
  }

  return (
    <button className="btn btn-primary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={createListing} disabled={loading}>
      {loading ? "..." : "Create Listing"}
    </button>
  );
}

export function ScheduleDeliveryForm({ clientId, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const data = {
      clientId,
      description: form.get("description") as string,
      fromAddress: form.get("fromAddress") as string,
      toAddress: form.get("toAddress") as string,
      crewSize: form.get("crewSize") as string,
      scheduledAt: form.get("scheduledAt") as string,
    };

    if (!data.description || !data.fromAddress || !data.toAddress) {
      toast("Description and addresses are required", "error");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast(`Delivery scheduled for ${clientName}`);
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      toast(err.error || "Failed to schedule", "error");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button className="btn btn-secondary" onClick={() => setOpen(true)} style={{ fontSize: 13 }}>
        + Schedule Delivery
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Schedule Delivery for {clientName}</div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Description *</label>
            <input name="description" className="form-input" placeholder="e.g. Couch delivery to buyer" required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>From Address *</label>
            <input name="fromAddress" className="form-input" placeholder="Pickup address" required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>To Address *</label>
            <input name="toAddress" className="form-input" placeholder="Drop-off address" required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Crew Size</label>
            <select name="crewSize" className="form-input" defaultValue="1">
              <option value="1">1-man crew</option>
              <option value="2">2-man crew</option>
              <option value="3">3-man crew</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Scheduled Date/Time</label>
            <input name="scheduledAt" type="datetime-local" className="form-input" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Scheduling..." : "Schedule Delivery"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CreatePayoutForm({ clientId, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);

    const grossDollars = parseFloat(form.get("grossSale") as string);
    const deliveryDollars = parseFloat(form.get("deliveryFee") as string) || 0;
    const commPct = parseFloat(form.get("commissionPercent") as string);

    if (!grossDollars || !commPct) {
      toast("Gross sale and commission % are required", "error");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        grossSaleCents: Math.round(grossDollars * 100),
        deliveryFeeCents: Math.round(deliveryDollars * 100),
        commissionPercent: commPct,
      }),
    });

    if (res.ok) {
      toast(`Payout recorded for ${clientName}`);
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      toast(err.error || "Failed to create payout", "error");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button className="btn btn-secondary" onClick={() => setOpen(true)} style={{ fontSize: 13 }}>
        + Record Payout
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Record Payout for {clientName}</div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Gross Sale ($) *</label>
            <input name="grossSale" type="number" step="0.01" className="form-input" placeholder="850.00" required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Delivery Fee ($)</label>
            <input name="deliveryFee" type="number" step="0.01" className="form-input" placeholder="75.00" defaultValue="0" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Commission % *</label>
            <input name="commissionPercent" type="number" step="0.1" className="form-input" placeholder="25" defaultValue="25" required />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Record Payout"}
          </button>
        </div>
      </form>
    </div>
  );
}
