import AdPerformance from "@/components/AdPerformance";

export default function CampaignsPage() {
  return (
    <>
      <div className="header">
        <div>
          <h1>Ad Campaigns</h1>
          <div className="header-subtitle">Campaign tracking — will be wired to Meta/Google ad APIs</div>
        </div>
      </div>
      <AdPerformance />
    </>
  );
}
