interface Message {
  id: string;
  content: string;
  read: boolean;
  createdAt: string;
  lead: { name: string } | null;
  client: { name: string } | null;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const colors = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #ec4899, #a855f7)",
];

export default function MessagesList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Messages</div>
        </div>
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No messages yet
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Recent Messages</div>
        <div className="card-action">View All →</div>
      </div>
      <div className="messages-list">
        {messages.map((msg, i) => {
          const name = msg.lead?.name || msg.client?.name || "Unknown";
          return (
            <div className={`message-item${!msg.read ? " message-unread" : ""}`} key={msg.id}>
              <div className="message-avatar" style={{ background: colors[i % colors.length] }}>
                {initials(name)}
              </div>
              <div className="message-content">
                <div className="message-top">
                  <span className="message-name">{name}</span>
                  <span className="message-time">{timeAgo(msg.createdAt)}</span>
                </div>
                <div className="message-preview">{msg.content}</div>
              </div>
              {!msg.read && <div className="unread-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
