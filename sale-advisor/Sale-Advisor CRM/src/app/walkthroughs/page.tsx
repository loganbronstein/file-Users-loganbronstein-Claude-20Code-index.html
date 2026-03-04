import { getWalkthroughs } from "@/lib/queries";
import WalkthroughsView from "./WalkthroughsView";

export const dynamic = "force-dynamic";

export default async function WalkthroughsPage() {
  const { bookedLeads, walkthroughClients } = await getWalkthroughs();

  const serialized = JSON.parse(JSON.stringify({ bookedLeads, walkthroughClients }));

  return (
    <WalkthroughsView
      bookedLeads={serialized.bookedLeads}
      walkthroughClients={serialized.walkthroughClients}
    />
  );
}
