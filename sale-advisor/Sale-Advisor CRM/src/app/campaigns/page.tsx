import CampaignsView from "./CampaignsView";

export const dynamic = "force-dynamic";

export default function CampaignsPage() {
  return (
    <>
      <div className="header">
        <div>
          <h1>Ad Campaigns</h1>
          <div className="header-subtitle">Track campaigns, budgets, and lead attribution across all platforms</div>
        </div>
      </div>
      <CampaignsView />
    </>
  );
}
