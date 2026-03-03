import DeliveryTracker from "@/components/DeliveryTracker";
import { getDeliveries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();
  const serialized = JSON.parse(JSON.stringify(deliveries));

  return (
    <>
      <div className="header">
        <div>
          <h1>Deliveries</h1>
          <div className="header-subtitle">{deliveries.length} delivery{deliveries.length !== 1 ? "ies" : ""}</div>
        </div>
      </div>
      <DeliveryTracker deliveries={serialized} />
    </>
  );
}
