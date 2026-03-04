import { getAllPayouts, getClientsForDropdown } from "@/lib/queries";
import PayoutsView from "./PayoutsView";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const [payouts, clients] = await Promise.all([
    getAllPayouts(),
    getClientsForDropdown(),
  ]);

  const serializedPayouts = JSON.parse(JSON.stringify(payouts));
  const serializedClients = JSON.parse(JSON.stringify(clients));

  const totalPaid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.payoutCents, 0);
  const totalPending = payouts.filter((p) => p.status !== "PAID").reduce((s, p) => s + p.payoutCents, 0);
  const totalCommission = payouts.reduce((s, p) => s + p.commissionCents, 0);

  return (
    <>
      <div className="header">
        <div>
          <h1>Payouts</h1>
          <div className="header-subtitle">
            {payouts.length} payout{payouts.length !== 1 ? "s" : ""} · ${(totalCommission / 100).toLocaleString()} commission earned
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--green)" }}>${(totalPaid / 100).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Payouts</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--yellow)" }}>${(totalPending / 100).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Our Commission</div>
          <div className="stat-value" style={{ fontSize: 24, color: "var(--accent)" }}>${(totalCommission / 100).toLocaleString()}</div>
        </div>
      </div>

      <PayoutsView payouts={serializedPayouts} clients={serializedClients} />
    </>
  );
}
