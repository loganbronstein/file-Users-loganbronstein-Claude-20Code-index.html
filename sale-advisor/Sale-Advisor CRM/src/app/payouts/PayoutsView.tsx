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

export default function PayoutsView({ payouts }: { payouts: Payout[] }) {
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filtered = filter === "ALL" ? payouts : payouts.filter((p) => p.status === filter);

  async function markPaid(id: string) {
    setLoadingId(id);
    const res = await fetch(`/api/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });

    if (res.ok) {
      toast("Payout marked as paid");
      router.refresh();
    } else {
      toast("Failed to update payout", "error");
    }
    setLoadingId(null);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["ALL", "PENDING", "PROCESSING", "PAID"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`btn ${filter === s ? "btn-primary" : "btn-secondary"}`}
            style={{ fontSize: 12, padding: "6px 12px" }}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Client", "Gross Sale", "Commission", "Delivery Fee", "Payout", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No payouts found</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/clients/${p.clientId}`} style={{ color: "var(--accent-light)", textDecoration: "none" }}>
                        {p.client.name}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmt(p.grossSaleCents)}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                      {p.commissionPercent}% ({fmt(p.commissionCents)})
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{fmt(p.deliveryFeeCents)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--green)" }}>{fmt(p.payoutCents)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 6,
                        background: p.status === "PAID" ? "var(--green-bg)" : "var(--yellow-bg)",
                        color: p.status === "PAID" ? "var(--green)" : "var(--yellow)",
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.status !== "PAID" && (
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 11, padding: "4px 10px" }}
                          onClick={() => markPaid(p.id)}
                          disabled={loadingId === p.id}
                        >
                          {loadingId === p.id ? "..." : "Mark Paid"}
                        </button>
                      )}
                      {p.paidAt && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(p.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
