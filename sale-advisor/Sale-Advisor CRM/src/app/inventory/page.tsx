import { getAllInventory } from "@/lib/queries";
import InventoryView from "./InventoryView";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await getAllInventory();
  const serialized = JSON.parse(JSON.stringify(items));

  return <InventoryView items={serialized} />;
}
