import Link from "next/link";
import { getAllPayouts } from "@/lib/queries";

export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export default async function PayoutsPage() {
  const payouts = await getAllPayouts();
  const totalPaid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.payoutCents, 0);
  const totalCommission = payouts.reduce((s, p) => s + p.commissionCents, 0);

  return (
    <>
      <div className="header">
        <div>
          <h1>Payouts</h1>
          <div className="header-subtitle">
            {payouts.length} payout{payouts.length !== 1 ? "s" : ""} · {fmt(totalPaid)} paid · {fmt(totalCommission)} commission earned
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Payouts</div>
        </div>
        {payouts.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No payouts yet.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {payouts.map((p) => (
              <div key={p.id} className="message-item" style={{ alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Link href={`/clients/${p.clientId}`} className="message-name" style={{ color: "var(--text-primary)", textDecoration: "none" }}>
                    {p.client.name}
                  </Link>
                  <div className="message-preview">
                    Gross: {fmt(p.grossSaleCents)} · Commission: {p.commissionPercent}% ({fmt(p.commissionCents)}) · Delivery: {fmt(p.deliveryFeeCents)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>{fmt(p.payoutCents)}</div>
                  <span className="ad-status" style={{
                    background: p.status === "PAID" ? "var(--green-bg)" : "var(--yellow-bg)",
                    color: p.status === "PAID" ? "var(--green)" : "var(--yellow)",
                  }}>
                    {p.status} {p.paidAt ? `· ${new Date(p.paidAt).toLocaleDateString()}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
