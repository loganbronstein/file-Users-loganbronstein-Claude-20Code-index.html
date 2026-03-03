interface StatsData {
  activeClients: number;
  totalLeads: number;
  itemsListed: number;
  revenueCents: number;
  payoutCents: number;
}

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export default function StatsGrid({ data }: { data: StatsData }) {
  const stats = [
    {
      label: "Active Clients",
      value: String(data.activeClients),
      change: `${data.totalLeads} total leads`,
      icon: "👥",
      iconBg: "var(--accent-glow)",
    },
    {
      label: "Items Listed",
      value: String(data.itemsListed),
      change: "across all marketplaces",
      icon: "📦",
      iconBg: "var(--green-bg)",
    },
    {
      label: "Revenue (Commission)",
      value: fmt(data.revenueCents),
      change: "total earned",
      icon: "💰",
      iconBg: "var(--yellow-bg)",
    },
    {
      label: "Client Payouts",
      value: fmt(data.payoutCents),
      change: "paid to clients",
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
          <div className="stat-change up">{stat.change}</div>
        </div>
      ))}
    </div>
  );
}
