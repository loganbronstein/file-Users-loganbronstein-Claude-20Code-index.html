import PricingView from "./PricingView";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Pricing Research Tool</h1>
        <p className="subtitle">Research competitive prices for items during walkthroughs</p>
      </div>
      <PricingView />
    </div>
  );
}
