import StatsGrid from "@/components/StatsGrid";
import Pipeline from "@/components/Pipeline";
import MessagesList from "@/components/MessagesList";
import LeadSources from "@/components/LeadSources";
import DeliveryTracker from "@/components/DeliveryTracker";
import ActivityFeed from "@/components/ActivityFeed";
import AdPerformance from "@/components/AdPerformance";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSummary from "@/components/DashboardSummary";
import {
  getStats,
  getLeadsByStage,
  getClientsByStage,
  getRecentMessages,
  getLeadSourceCounts,
  getDeliveries,
  getRecentActivity,
  getDashboardSummary,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, leads, clients, messages, sources, deliveries, activities, summary] =
    await Promise.all([
      getStats(),
      getLeadsByStage(),
      getClientsByStage(),
      getRecentMessages(),
      getLeadSourceCounts(),
      getDeliveries(),
      getRecentActivity(),
      getDashboardSummary(),
    ]);

  const s = JSON.parse(JSON.stringify({ messages, deliveries, activities, leads, clients }));

  return (
    <>
      <DashboardHeader />
      <DashboardSummary data={summary} />
      <StatsGrid data={stats} />

      <div className="content-grid">
        <Pipeline leads={s.leads} clients={s.clients} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <MessagesList messages={s.messages} />
          <LeadSources sources={sources} />
        </div>
      </div>

      <DeliveryTracker deliveries={s.deliveries} />

      <div className="bottom-grid">
        <ActivityFeed activities={s.activities} />
        <AdPerformance />
      </div>
    </>
  );
}
