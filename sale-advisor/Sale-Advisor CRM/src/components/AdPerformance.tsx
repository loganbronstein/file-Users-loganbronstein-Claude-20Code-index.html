const ads = [
  {
    name: '🔥 "Lazy Person\'s Garage Sale"',
    status: "Active",
    statusCls: "active",
    metrics: [
      { label: "Spend", value: "$142" },
      { label: "Leads", value: "11" },
      { label: "CPL", value: "$12.91" },
      { label: "CTR", value: "2.4%", color: "var(--green)" },
    ],
  },
  {
    name: '💰 "$5,000 In Your House"',
    status: "Active",
    statusCls: "active",
    metrics: [
      { label: "Spend", value: "$98" },
      { label: "Leads", value: "7" },
      { label: "CPL", value: "$14.00" },
      { label: "CTR", value: "1.8%", color: "var(--green)" },
    ],
  },
  {
    name: "📍 Lincoln Park Local",
    status: "Active",
    statusCls: "active",
    metrics: [
      { label: "Spend", value: "$67" },
      { label: "Leads", value: "4" },
      { label: "CPL", value: "$16.75" },
      { label: "CTR", value: "1.2%", color: "var(--yellow)" },
    ],
  },
  {
    name: '👵 "Grandma\'s Goldmine"',
    status: "Paused",
    statusCls: "paused",
    metrics: [
      { label: "Spend", value: "$45" },
      { label: "Leads", value: "1" },
      { label: "CPL", value: "$45.00", color: "var(--red)" },
      { label: "CTR", value: "0.4%", color: "var(--red)" },
    ],
  },
];

export default function AdPerformance() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Ad Performance</div>
        <div className="card-action">Manage Ads →</div>
      </div>
      <div className="ad-list">
        {ads.map((ad) => (
          <div className="ad-item" key={ad.name}>
            <div className="ad-top">
              <div className="ad-name">{ad.name}</div>
              <span className={`ad-status ${ad.statusCls}`}>{ad.status}</span>
            </div>
            <div className="ad-metrics">
              {ad.metrics.map((m) => (
                <div key={m.label}>
                  <div className="ad-metric-label">{m.label}</div>
                  <div
                    className="ad-metric-value"
                    style={m.color ? { color: m.color } : undefined}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
