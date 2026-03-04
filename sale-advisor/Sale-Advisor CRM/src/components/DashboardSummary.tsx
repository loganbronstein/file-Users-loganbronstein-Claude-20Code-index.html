import Link from "next/link";

interface Props {
  data: {
    todayLeads: number;
    unreadMessages: number;
    upcomingDeliveries: number;
    pendingPayouts: number;
    draftListings: number;
    upcomingWalkthroughs: number;
  };
}

const cards = [
  { key: "todayLeads" as const, label: "New Leads Today", href: "/leads", color: "var(--blue)", bg: "var(--blue-bg)", icon: "🎯" },
  { key: "unreadMessages" as const, label: "Unread Messages", href: "/messages", color: "var(--accent)", bg: "var(--accent-glow)", icon: "💬" },
  { key: "upcomingWalkthroughs" as const, label: "Upcoming Walkthroughs", href: "/walkthroughs", color: "var(--purple, var(--accent))", bg: "var(--purple-bg, var(--accent-glow))", icon: "📅" },
  { key: "draftListings" as const, label: "Draft Listings", href: "/listings?tab=DRAFTS", color: "var(--yellow)", bg: "var(--yellow-bg)", icon: "📦" },
  { key: "upcomingDeliveries" as const, label: "Upcoming Deliveries", href: "/deliveries", color: "var(--yellow)", bg: "var(--yellow-bg)", icon: "🚚" },
  { key: "pendingPayouts" as const, label: "Pending Payouts", href: "/payouts", color: "var(--green)", bg: "var(--green-bg)", icon: "💰" },
];

export default function DashboardSummary({ data }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 24 }}>
      {cards.map((card) => {
        const count = data[card.key];
        return (
          <Link key={card.key} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px",
              border: count > 0 ? `1px solid ${card.color}30` : "1px solid var(--border)",
              transition: "transform 0.15s, border-color 0.15s",
              cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>{card.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: count > 0 ? card.color : "var(--text-muted)" }}>
                    {count}
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 20,
                  background: count > 0 ? card.bg : "var(--bg-hover)",
                }}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
