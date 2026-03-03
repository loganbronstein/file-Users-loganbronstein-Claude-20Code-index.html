import Sidebar from "@/components/Sidebar";
import StatsGrid from "@/components/StatsGrid";
import Pipeline from "@/components/Pipeline";
import MessagesList from "@/components/MessagesList";
import LeadSources from "@/components/LeadSources";
import DeliveryTracker from "@/components/DeliveryTracker";
import ActivityFeed from "@/components/ActivityFeed";
import AdPerformance from "@/components/AdPerformance";

export default function DashboardPage() {
  return (
    <>
      <Sidebar />
      <main className="main">
        {/* Header */}
        <div className="header">
          <div>
            <h1>Welcome back, Logan 👋</h1>
            <div className="header-subtitle">
              Here&apos;s what&apos;s happening with Sale Advisor today
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary">Export Report</button>
            <button className="btn btn-primary">+ New Client</button>
          </div>
        </div>

        <StatsGrid />

        {/* Pipeline + Messages */}
        <div className="content-grid">
          <Pipeline />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <MessagesList />
            <LeadSources />
          </div>
        </div>

        <DeliveryTracker />

        {/* Bottom Section */}
        <div className="bottom-grid">
          <ActivityFeed />
          <AdPerformance />
        </div>
      </main>
    </>
  );
}
