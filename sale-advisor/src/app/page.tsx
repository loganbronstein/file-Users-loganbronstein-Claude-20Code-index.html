import StatsGrid from "@/components/StatsGrid";
import Pipeline from "@/components/Pipeline";
import MessagesList from "@/components/MessagesList";
import LeadSources from "@/components/LeadSources";
import DeliveryTracker from "@/components/DeliveryTracker";
import ActivityFeed from "@/components/ActivityFeed";
import AdPerformance from "@/components/AdPerformance";
import DashboardHeader from "@/components/DashboardHeader";
import IngestTest from "@/components/IngestTest";
import {
  getStats,
  getLeadsByStage,
  getClientsByStage,
  getRecentMessages,
  getLeadSourceCounts,
  getDeliveries,
  getRecentActivity,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, leads, clients, messages, sources, deliveries, activities] =
    await Promise.all([
      getStats(),
      getLeadsByStage(),
      getClientsByStage(),
      getRecentMessages(),
      getLeadSourceCounts(),
      getDeliveries(),
      getRecentActivity(),
    ]);

  const s = JSON.parse(JSON.stringify({ messages, deliveries, activities, leads, clients }));

  return (
    <>
      <DashboardHeader />
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

      <IngestTest />
    </>
  );
}
