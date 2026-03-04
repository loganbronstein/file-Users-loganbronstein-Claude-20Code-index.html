import StatsGrid from "@/components/StatsGrid";
import Pipeline from "@/components/Pipeline";
import MessagesList from "@/components/MessagesList";
import LeadSources from "@/components/LeadSources";
import DeliveryTracker from "@/components/DeliveryTracker";
import ActivityFeed from "@/components/ActivityFeed";
import AdPerformance from "@/components/AdPerformance";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSummary from "@/components/DashboardSummary";
import TodayWalkthroughs from "@/components/TodayWalkthroughs";
import {
  getStats,
  getLeadsByStage,
  getClientsByStage,
  getRecentMessages,
  getLeadSourceCounts,
  getDeliveries,
  getRecentActivity,
  getDashboardSummary,
  getTodayWalkthroughs,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, leads, clients, messages, sources, deliveries, activities, summary, todayWalkthroughs] =
    await Promise.all([
      getStats(),
      getLeadsByStage(),
      getClientsByStage(),
      getRecentMessages(),
      getLeadSourceCounts(),
      getDeliveries(),
      getRecentActivity(),
      getDashboardSummary(),
      getTodayWalkthroughs(),
    ]);

  const s = JSON.parse(JSON.stringify({ messages, deliveries, activities, leads, clients, todayWalkthroughs }));

  return (
    <>
      <DashboardHeader />
      <DashboardSummary data={summary} />
      <TodayWalkthroughs walkthroughs={s.todayWalkthroughs} />
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
