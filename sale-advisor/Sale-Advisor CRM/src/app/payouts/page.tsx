import { getAllPayouts } from "@/lib/queries";
import PayoutsView from "./PayoutsView";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const payouts = await getAllPayouts();
  const serialized = JSON.parse(JSON.stringify(payouts));

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
      <PayoutsView payouts={serialized} />
    </>
  );
}
