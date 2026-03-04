"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ScheduleDeliveryModal from "@/components/ScheduleDeliveryModal";

interface Delivery {
  id: string;
  description: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  crewSize: number;
  costCents: number | null;
  revenueCents: number | null;
  scheduledAt: string | null;
  completedAt: string | null;
  client: { name: string };
}

interface ClientOption {
  id: string;
  name: string;
}

const statusConfig: Record<string, { icon: string; iconBg: string; progress: number; progressColor: string }> = {
  SCHEDULED: { icon: "🗓️", iconBg: "var(--blue-bg)", progress: 10, progressColor: "var(--blue)" },
  PICKUP: { icon: "📦", iconBg: "var(--purple-bg)", progress: 25, progressColor: "var(--purple, #a855f7)" },
  IN_TRANSIT: { icon: "🚛", iconBg: "var(--yellow-bg)", progress: 65, progressColor: "var(--yellow)" },
  DELIVERED: { icon: "✅", iconBg: "var(--green-bg)", progress: 100, progressColor: "var(--green)" },
  CANCELLED: { icon: "❌", iconBg: "var(--red-bg)", progress: 0, progressColor: "var(--red)" },
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  PICKUP: "Pickup",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const filterTabs = ["ALL", "SCHEDULED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

function fmtDate(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export default function DeliveriesView({
  deliveries,
  clients,
}: {
  deliveries: Delivery[];
  clients: ClientOption[];
}) {
  const [filter, setFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", fromAddress: "", toAddress: "", crewSize: "", scheduledAt: "" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = filter === "ALL" ? deliveries : deliveries.filter((d) => d.status === filter);

  const scheduledCount = deliveries.filter((d) => d.status === "SCHEDULED").length;
  const inTransitCount = deliveries.filter((d) => d.status === "IN_TRANSIT").length;
  const completedCount = deliveries.filter((d) => d.status === "DELIVERED").length;

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast(`Status updated to ${statusLabels[status] || status}`);
      router.refresh();
    } else {
      const data = await res.json();
      toast(data.errors?.[0] || "Failed to update status", "error");
    }
  }

  function startEdit(d: Delivery) {
    setEditingId(d.id);
    setEditForm({
      description: d.description,
      fromAddress: d.fromAddress,
      toAddress: d.toAddress,
      crewSize: String(d.crewSize),
      scheduledAt: d.scheduledAt ? new Date(d.scheduledAt).toISOString().slice(0, 16) : "",
    });
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    const res = await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: editForm.description,
        fromAddress: editForm.fromAddress,
        toAddress: editForm.toAddress,
        crewSize: editForm.crewSize,
        scheduledAt: editForm.scheduledAt || null,
      }),
    });
    if (res.ok) {
      toast("Delivery updated");
      setEditingId(null);
      router.refresh();
    } else {
      const data = await res.json();
      toast(data.errors?.[0] || "Failed to save", "error");
    }
    setSavingId(null);
  }

  return (
    <>
      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--blue)" }}>{scheduledCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Transit</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--yellow)" }}>{inTransitCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--green)" }}>{completedCount}</div>
        </div>
      </div>

      {/* Filter tabs + Schedule button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filterTabs.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {s === "ALL" ? "All" : statusLabels[s] || s}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Schedule Delivery
        </button>
      </div>

      {/* Delivery cards */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No deliveries {filter !== "ALL" ? `with status "${statusLabels[filter] || filter}"` : "yet"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((d) => {
            const cfg = statusConfig[d.status] || statusConfig.SCHEDULED;
            const isEditing = editingId === d.id;

            return (
              <div className="card" key={d.id} style={{ padding: 0 }}>
                <div style={{ display: "flex", gap: 16, padding: "16px 20px", alignItems: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 20,
                    background: cfg.iconBg, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {d.description}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {d.client.name} · {d.fromAddress} → {d.toAddress} · {d.crewSize}-man crew
                    </div>
                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: "var(--bg-secondary)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${cfg.progress}%`, background: cfg.progressColor, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <select
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 20,
                        background: cfg.iconBg, color: cfg.progressColor, border: "none", cursor: "pointer",
                      }}
                      value={d.status}
                      onChange={(e) => updateStatus(d.id, e.target.value)}
                    >
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtDate(d.scheduledAt)}</div>
                    {(d.costCents != null || d.revenueCents != null) && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {d.costCents != null && <span>Cost: {fmt(d.costCents)}</span>}
                        {d.costCents != null && d.revenueCents != null && <span> · </span>}
                        {d.revenueCents != null && <span>Rev: {fmt(d.revenueCents)}</span>}
                      </div>
                    )}
                    {!isEditing && d.status !== "DELIVERED" && d.status !== "CANCELLED" && (
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: "3px 8px" }}
                        onClick={() => startEdit(d)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && (
                  <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Description</label>
                        <input
                          className="form-input"
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">From Address</label>
                        <input
                          className="form-input"
                          value={editForm.fromAddress}
                          onChange={(e) => setEditForm((f) => ({ ...f, fromAddress: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">To Address</label>
                        <input
                          className="form-input"
                          value={editForm.toAddress}
                          onChange={(e) => setEditForm((f) => ({ ...f, toAddress: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Crew</label>
                          <input
                            className="form-input"
                            type="number"
                            min={1}
                            max={10}
                            value={editForm.crewSize}
                            onChange={(e) => setEditForm((f) => ({ ...f, crewSize: e.target.value }))}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Date</label>
                          <input
                            className="form-input"
                            type="datetime-local"
                            value={editForm.scheduledAt}
                            onChange={(e) => setEditForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "5px 12px" }}
                        onClick={() => saveEdit(d.id)}
                        disabled={savingId === d.id}
                      >
                        {savingId === d.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && <ScheduleDeliveryModal clients={clients} onClose={() => setShowModal(false)} />}
    </>
  );
}
