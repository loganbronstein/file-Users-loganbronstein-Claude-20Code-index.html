import { getAllLeads } from "@/lib/queries";
import LeadsView from "./LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getAllLeads();
  const serialized = JSON.parse(JSON.stringify(leads));

  return (
    <>
      <div className="header">
        <div>
          <h1>Leads</h1>
          <div className="header-subtitle">{leads.length} total lead{leads.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <LeadsView leads={serialized} />
    </>
  );
}
