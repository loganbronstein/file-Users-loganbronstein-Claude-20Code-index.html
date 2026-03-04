"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface Delivery {
  id: string;
  clientId: string;
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

const statusConfig: Record<string, { icon: string; iconBg: string; color: string; progress: number }> = {
  SCHEDULED: { icon: "\uD83D\uDCC5", iconBg: "var(--blue-bg)", color: "var(--blue)", progress: 10 },
  PICKUP: { icon: "\uD83D\uDCE6", iconBg: "var(--purple-bg, rgba(168,85,247,0.15))", color: "var(--purple, #a855f7)", progress: 25 },
  IN_TRANSIT: { icon: "\uD83D\uDE9B", iconBg: "var(--yellow-bg)", color: "var(--yellow)", progress: 65 },
  DELIVERED: { icon: "\u2705", iconBg: "var(--green-bg)", color: "var(--green)", progress: 100 },
  CANCELLED: { icon: "\u274C", iconBg: "var(--red-bg)", color: "var(--red)", progress: 0 },
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  PICKUP: "Pickup",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const nextStepConfig: Record<string, { label: string; next: string }> = {
  SCHEDULED: { label: "Start Pickup", next: "PICKUP" },
  PICKUP: { label: "Mark In Transit", next: "IN_TRANSIT" },
  IN_TRANSIT: { label: "Mark Delivered", next: "DELIVERED" },
};

const filterTabs = ["ALL", "SCHEDULED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

function fmtDate(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function getDateGroup(scheduledAt: string | null): string {
  if (!scheduledAt) return "Unscheduled";
  const d = new Date(scheduledAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  const deliveryDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (deliveryDay < today) return "Past";
  if (deliveryDay.getTime() === today.getTime()) return "Today";
  if (deliveryDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (deliveryDay < nextWeek) return "This Week";
  return "Later";
}

const dateGroupOrder = ["Today", "Tomorrow", "This Week", "Later", "Unscheduled", "Past"];

export default function DeliveriesView({ deliveries }: { deliveries: Delivery[] }) {
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = filter === "ALL" ? deliveries : deliveries.filter((d) => d.status === filter);

  // Group by date
  const grouped: Record<string, Delivery[]> = {};
  for (const d of filtered) {
    const group = d.status === "DELIVERED" || d.status === "CANCELLED" ? (d.status === "DELIVERED" ? "Past" : "Past") : getDateGroup(d.scheduledAt);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(d);
  }

  const scheduledCount = deliveries.filter((d) => d.status === "SCHEDULED").length;
  const inTransitCount = deliveries.filter((d) => d.status === "IN_TRANSIT" || d.status === "PICKUP").length;
  const completedCount = deliveries.filter((d) => d.status === "DELIVERED").length;

  // Revenue stats
  const totalRevenue = deliveries.reduce((s, d) => s + (d.revenueCents || 0), 0);
  const totalCost = deliveries.reduce((s, d) => s + (d.costCents || 0), 0);
  const profit = totalRevenue - totalCost;

  async function advanceStatus(id: string, nextStatus: string) {
    setLoadingId(id);
    const res = await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      toast(`Status updated to ${statusLabels[nextStatus] || nextStatus}`);
      router.refresh();
    } else {
      const data = await res.json();
      toast(data.errors?.[0] || "Failed to update status", "error");
    }
    setLoadingId(null);
  }

  return (
    <>
      {/* Revenue summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Scheduled / In Transit</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--blue)" }}>
            {scheduledCount + inTransitCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--green)" }}>{completedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue / Cost / Profit</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            <span style={{ color: "var(--green)" }}>{fmtMoney(totalRevenue)}</span>
            {" / "}
            <span style={{ color: "var(--red)" }}>{fmtMoney(totalCost)}</span>
            {" / "}
            <span style={{ color: profit >= 0 ? "var(--green)" : "var(--red)" }}>{fmtMoney(profit)}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {filterTabs.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            {s === "ALL" ? `All (${deliveries.length})` : `${statusLabels[s] || s} (${deliveries.filter((d) => d.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Delivery cards grouped by date */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No deliveries {filter !== "ALL" ? `with status "${statusLabels[filter] || filter}"` : "scheduled yet"}
        </div>
      ) : (
        dateGroupOrder.filter((g) => grouped[g]?.length).map((group) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.5px", marginBottom: 8, paddingLeft: 4,
            }}>
              {group}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {grouped[group].map((d) => {
                const cfg = statusConfig[d.status] || statusConfig.SCHEDULED;
                const step = nextStepConfig[d.status];

                return (
                  <div className="card" key={d.id} style={{ padding: 0, overflow: "hidden" }}>
                    {/* Progress bar at top */}
                    <div style={{ height: 3, background: "var(--bg-secondary)" }}>
                      <div style={{ height: "100%", width: `${cfg.progress}%`, background: cfg.color, transition: "width 0.3s" }} />
                    </div>

                    <div style={{ display: "flex", gap: 16, padding: "16px 20px", alignItems: "flex-start" }}>
                      {/* Status icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 20,
                        background: cfg.iconBg, flexShrink: 0,
                      }}>
                        {cfg.icon}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {d.description}
                          </span>
                          <span style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 4,
                            background: cfg.iconBg, color: cfg.color, fontWeight: 600,
                          }}>
                            {statusLabels[d.status] || d.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                          <Link href={`/clients/${d.clientId}`} style={{ color: "var(--accent-light)", textDecoration: "none" }}>
                            {d.client.name}
                          </Link>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
                          <div>{d.fromAddress} {"\u2192"} {d.toAddress}</div>
                          <div>
                            {d.crewSize}-man crew {"\u00b7"} {fmtDate(d.scheduledAt)}
                            {d.completedAt && <span> {"\u00b7"} Completed {fmtDate(d.completedAt)}</span>}
                          </div>
                          {(d.costCents != null || d.revenueCents != null) && (
                            <div style={{ marginTop: 2 }}>
                              {d.revenueCents != null && <span>Revenue: {fmtMoney(d.revenueCents)}</span>}
                              {d.revenueCents != null && d.costCents != null && <span> {"\u00b7"} </span>}
                              {d.costCents != null && <span>Cost: {fmtMoney(d.costCents)}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div style={{ flexShrink: 0 }}>
                        {step && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 12, padding: "6px 14px" }}
                            onClick={() => advanceStatus(d.id, step.next)}
                            disabled={loadingId === d.id}
                          >
                            {loadingId === d.id ? "..." : step.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
