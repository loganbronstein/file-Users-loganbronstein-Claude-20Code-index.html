import { getAnalyticsSummary, getLeadSourcePerformance, getInventoryPipeline } from "@/lib/analytics-queries";
import AnalyticsView from "./AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [summary, sources, pipeline] = await Promise.all([
    getAnalyticsSummary(),
    getLeadSourcePerformance(),
    getInventoryPipeline(),
  ]);

  return (
    <>
      <div className="header">
        <div>
          <h1>Analytics</h1>
          <div className="header-subtitle">Business performance, conversion funnel, and lead source analysis</div>
        </div>
      </div>
      <AnalyticsView
        initialSummary={JSON.parse(JSON.stringify(summary))}
        initialSources={JSON.parse(JSON.stringify(sources))}
        initialPipeline={JSON.parse(JSON.stringify(pipeline))}
      />
    </>
  );
}
