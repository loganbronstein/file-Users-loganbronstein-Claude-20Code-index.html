const sources = [
  { icon: "📘", name: "Facebook / Meta", count: "18 leads", pct: 85, color: "var(--blue)", iconBg: "var(--blue-bg)" },
  { icon: "🏡", name: "Nextdoor", count: "9 leads", pct: 50, color: "var(--green)", iconBg: "var(--green-bg)" },
  { icon: "🔍", name: "Google Ads", count: "7 leads", pct: 38, color: "var(--red)", iconBg: "var(--red-bg)" },
  { icon: "🤝", name: "Referrals", count: "8 leads", pct: 44, color: "var(--purple)", iconBg: "var(--purple-bg)" },
  { icon: "📸", name: "Instagram", count: "3 leads", pct: 18, color: "var(--orange)", iconBg: "var(--orange-bg)" },
  { icon: "🚚", name: "Lakeshore Hauling", count: "5 leads", pct: 28, color: "var(--yellow)", iconBg: "var(--yellow-bg)" },
];

export default function LeadSources() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Lead Sources</div>
        <div className="card-action">Details →</div>
      </div>
      <div className="sources-grid">
        {sources.map((s) => (
          <div className="source-item" key={s.name}>
            <div className="source-icon" style={{ background: s.iconBg }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="source-name">{s.name}</div>
              <div className="source-count">{s.count}</div>
              <div className="source-bar">
                <div className="source-fill" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
