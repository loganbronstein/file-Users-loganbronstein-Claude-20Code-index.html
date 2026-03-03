const activities = [
  {
    color: "var(--green)",
    text: <><strong>Rachel Kim</strong> was paid <strong>$1,847</strong> — 8 items sold via Facebook Marketplace</>,
    time: "1 hour ago",
  },
  {
    color: "var(--blue)",
    text: <><strong>Mid-century dresser</strong> listed on eBay for <strong>$450</strong> — Sarah Mitchell&apos;s collection</>,
    time: "2 hours ago",
  },
  {
    color: "var(--accent)",
    text: <><strong>Maria Gonzalez</strong> — new lead from Facebook Ad &ldquo;Lazy Person&apos;s Garage Sale&rdquo; campaign</>,
    time: "3 hours ago",
  },
  {
    color: "var(--yellow)",
    text: <><strong>Lakeshore crew</strong> referred <strong>Carol Williams</strong> from an Evanston junk removal job</>,
    time: "5 hours ago",
  },
  {
    color: "var(--green)",
    text: <><strong>Vintage Schwinn bike</strong> sold for <strong>$280</strong> on Craigslist — Anthony Russo&apos;s listing</>,
    time: "Yesterday",
  },
];

export default function ActivityFeed() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Activity Feed</div>
        <div className="card-action">View All →</div>
      </div>
      <div className="activity-list">
        {activities.map((a, i) => (
          <div className="activity-item" key={i}>
            <div className="activity-dot" style={{ background: a.color }} />
            <div>
              <div className="activity-text">{a.text}</div>
              <div className="activity-time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
