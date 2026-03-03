interface Activity {
  type: string;
  text: string;
  time: string;
  color: string;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Activity Feed</div>
        </div>
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No activity yet — create your first lead to get started
        </div>
      </div>
    );
  }

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
              <div className="activity-time">{timeAgo(a.time)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
