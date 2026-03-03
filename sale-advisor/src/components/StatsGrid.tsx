export default function StatsGrid() {
  const stats = [
    {
      label: "Active Clients",
      value: "47",
      change: "↑ 12 this week",
      up: true,
      icon: "👥",
      iconBg: "var(--accent-glow)",
    },
    {
      label: "Items Listed",
      value: "183",
      change: "↑ 34 this week",
      up: true,
      icon: "📦",
      iconBg: "var(--green-bg)",
    },
    {
      label: "Revenue (This Month)",
      value: "$12,480",
      change: "↑ 23% vs last month",
      up: true,
      icon: "💰",
      iconBg: "var(--yellow-bg)",
    },
    {
      label: "Client Payouts",
      value: "$38,200",
      change: "↑ Happy clients = referrals",
      up: true,
      icon: "🤝",
      iconBg: "var(--orange-bg)",
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <div className="stat-header">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-icon" style={{ background: stat.iconBg }}>
              {stat.icon}
            </div>
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className={`stat-change ${stat.up ? "up" : "down"}`}>
            {stat.change}
          </div>
        </div>
      ))}
    </div>
  );
}
