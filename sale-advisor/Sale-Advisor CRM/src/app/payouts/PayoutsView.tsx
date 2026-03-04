"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";

interface Payout {
  id: string;
  clientId: string;
  grossSaleCents: number;
  deliveryFeeCents: number;
  commissionPercent: number;
  commissionCents: number;
  payoutCents: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  client: { id: string; name: string };
}

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const statusBadge: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "var(--yellow-bg)", color: "var(--yellow)" },
  PROCESSING: { bg: "var(--blue-bg)", color: "var(--blue)" },
  PAID: { bg: "var(--green-bg)", color: "var(--green)" },
  FAILED: { bg: "var(--red-bg)", color: "var(--red)" },
};

export default function PayoutsView({ payouts }: { payouts: Payout[] }) {
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = filter === "ALL" ? payouts : payouts.filter((p) => p.status === filter);

  // Summary stats
  const totalPaid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.payoutCents, 0);
  const totalPending = payouts.filter((p) => p.status !== "PAID" && p.status !== "FAILED").reduce((s, p) => s + p.payoutCents, 0);
  const totalCommission = payouts.reduce((s, p) => s + p.commissionCents, 0);
  const avgCommission = payouts.length > 0
    ? (payouts.reduce((s, p) => s + p.commissionPercent, 0) / payouts.length).toFixed(1)
    : "0";

  async function markPaid(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    if (res.ok) {
      toast("Payout marked as paid");
      setConfirmId(null);
      router.refresh();
    } else {
      toast("Failed to update payout", "error");
    }
    setLoadingId(null);
  }

  return (
    <>
      {/* Summary cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{fmt(totalPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Payouts</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--yellow)" }}>{fmt(totalPending)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Commission Earned</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>{fmt(totalCommission)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Commission</div>
          <div className="stat-value" style={{ fontSize: 22, color: "var(--text-primary)" }}>{avgCommission}%</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["ALL", "PENDING", "PROCESSING", "PAID", "FAILED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            {s === "ALL" ? `All (${payouts.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${payouts.filter((p) => p.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Client", "Gross Sale", "Commission", "Delivery Fee", "Client Payout", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                    No payouts {filter !== "ALL" ? `with status "${filter.toLowerCase()}"` : "yet"}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const badge = statusBadge[p.status] || statusBadge.PENDING;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/clients/${p.clientId}`} style={{ color: "var(--accent-light)", textDecoration: "none" }}>
                          {p.client.name}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(p.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmt(p.grossSaleCents)}</td>
                      <td style={{ padding: "12px 16px", color: "var(--accent)" }}>
                        {p.commissionPercent}% ({fmt(p.commissionCents)})
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmt(p.deliveryFeeCents)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--green)" }}>{fmt(p.payoutCents)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, padding: "3px 8px", borderRadius: 6,
                          background: badge.bg, color: badge.color,
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {p.status !== "PAID" && p.status !== "FAILED" && confirmId !== p.id && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => setConfirmId(p.id)}
                            disabled={loadingId === p.id}
                          >
                            Mark Paid
                          </button>
                        )}
                        {confirmId === p.id && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-primary"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              onClick={() => markPaid(p.id)}
                              disabled={loadingId === p.id}
                            >
                              {loadingId === p.id ? "..." : "Confirm"}
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: 11, padding: "4px 10px" }}
                              onClick={() => setConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {p.paidAt && p.status === "PAID" && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Paid {new Date(p.paidAt).toLocaleDateString()}
                          </span>
                        )}
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
