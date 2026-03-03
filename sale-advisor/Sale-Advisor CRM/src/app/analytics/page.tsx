import { getStats, getLeadSourceCounts } from "@/lib/queries";
import StatsGrid from "@/components/StatsGrid";
import LeadSources from "@/components/LeadSources";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [stats, sources] = await Promise.all([getStats(), getLeadSourceCounts()]);

  return (
    <>
      <div className="header">
        <div>
          <h1>Analytics</h1>
          <div className="header-subtitle">Business performance overview</div>
        </div>
      </div>
      <StatsGrid data={stats} />
      <LeadSources sources={sources} />
    </>
  );
}
