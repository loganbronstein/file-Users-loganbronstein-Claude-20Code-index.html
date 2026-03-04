import DeliveriesView from "./DeliveriesView";
import { getDeliveries, getClientsForDropdown } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const [deliveries, clients] = await Promise.all([
    getDeliveries(),
    getClientsForDropdown(),
  ]);

  const serializedDeliveries = JSON.parse(JSON.stringify(deliveries));
  const serializedClients = JSON.parse(JSON.stringify(clients));

  return (
    <>
      <div className="header">
        <div>
          <h1>Deliveries</h1>
          <div className="header-subtitle">{deliveries.length} delivery{deliveries.length !== 1 ? "ies" : ""}</div>
        </div>
      </div>
      <DeliveriesView deliveries={serializedDeliveries} clients={serializedClients} />
    </>
  );
}
