"use client";

import { useState } from "react";

type AnalyticsSummary = {
  leadCount: number;
  clientCount: number;
  itemsListed: number;
  itemsSold: number;
  grossSaleCents: number;
  commissionCents: number;
  payoutCents: number;
  deliveryRevenue: number;
  deliveryCost: number;
};

type SourcePerformance = {
  source: string;
  leads: number;
  clients: number;
  conversionRate: number;
  avgItemsPerClient: number;
};

type InventoryPipeline = {
  pendingPickup: number;
  inPossession: number;
  listed: number;
  sold: number;
  delivered: number;
};

type Props = {
  initialSummary: AnalyticsSummary;
  initialSources: SourcePerformance[];
  initialPipeline: InventoryPipeline;
};

function formatMoney(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const TIME_FILTERS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "All time", value: 0 },
];

export default function AnalyticsView({ initialSummary, initialSources, initialPipeline }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [sources, setSources] = useState(initialSources);
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [activeFilter, setActiveFilter] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleFilterChange(days: number) {
    setActiveFilter(days);
    setLoading(true);
    try {
      const params = days > 0 ? `?days=${days}` : "";
      const res = await fetch(`/api/analytics${params}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setSources(data.sources);
        setPipeline(data.pipeline);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  // Conversion funnel data
  const funnelSteps = [
    { label: "Leads", count: summary.leadCount, color: "#3b82f6" },
    { label: "Clients", count: summary.clientCount, color: "#8b5cf6" },
    { label: "Items Listed", count: summary.itemsListed, color: "#eab308" },
    { label: "Items Sold", count: summary.itemsSold, color: "#22c55e" },
  ];

  const pipelineSteps = [
    { label: "Pending Pickup", count: pipeline.pendingPickup, color: "#94a3b8" },
    { label: "In Possession", count: pipeline.inPossession, color: "#3b82f6" },
    { label: "Listed", count: pipeline.listed, color: "#eab308" },
    { label: "Sold", count: pipeline.sold, color: "#22c55e" },
    { label: "Delivered", count: pipeline.delivered, color: "#8b5cf6" },
  ];
  const maxPipeline = Math.max(...pipelineSteps.map((s) => s.count), 1);

  return (
    <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
      {/* Time filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {TIME_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={f.value === activeFilter ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 13 }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Revenue cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Gross Sales", value: formatMoney(summary.grossSaleCents), color: "#22c55e" },
          { label: "Commission Earned", value: formatMoney(summary.commissionCents), color: "#eab308" },
          { label: "Payouts Sent", value: formatMoney(summary.payoutCents), color: "#3b82f6" },
          { label: "Delivery Profit", value: "$" + ((summary.deliveryRevenue - summary.deliveryCost) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }), color: "#8b5cf6" },
        ].map((card) => (
          <div className="card" key={card.label} style={{ padding: 20 }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Conversion funnel + Inventory pipeline side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Conversion funnel */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Conversion Funnel</h3>
          </div>
          <div style={{ padding: 20 }}>
            {funnelSteps.map((step, i) => {
              const rate = i > 0 && funnelSteps[i - 1].count > 0
                ? Math.round((step.count / funnelSteps[i - 1].count) * 100)
                : null;
              return (
                <div key={step.label} style={{ marginBottom: i < funnelSteps.length - 1 ? 16 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{step.label}</span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: step.color }}>{step.count}</span>
                      {rate !== null && (
                        <span style={{ fontSize: 11, color: "#888", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                          {rate}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${funnelSteps[0].count > 0 ? Math.max((step.count / funnelSteps[0].count) * 100, 2) : 0}%`,
                        background: step.color,
                        borderRadius: 4,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  {i < funnelSteps.length - 1 && (
                    <div style={{ textAlign: "center", color: "#555", fontSize: 16, margin: "4px 0 -4px" }}>↓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory pipeline */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Inventory Pipeline</h3>
          </div>
          <div style={{ padding: 20 }}>
            {pipelineSteps.map((step) => (
              <div key={step.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{step.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: step.color }}>{step.count}</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max((step.count / maxPipeline) * 100, 2)}%`,
                      background: step.color,
                      borderRadius: 4,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead source performance */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Lead Source Performance</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Source", "Leads", "Clients", "Conversion", "Avg Items/Client"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#888", borderBottom: "1px solid rgba(255,255,255,0.08)", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#888" }}>No lead data yet</td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.source}>
                    <td style={{ padding: "12px 16px", fontWeight: 500, fontSize: 14 }}>{s.source}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>{s.leads}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>{s.clients}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background: s.conversionRate >= 30 ? "rgba(34,197,94,0.15)" : s.conversionRate >= 15 ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                        color: s.conversionRate >= 30 ? "#22c55e" : s.conversionRate >= 15 ? "#eab308" : "#ef4444",
                      }}>
                        {s.conversionRate}%
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14 }}>{s.avgItemsPerClient}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
