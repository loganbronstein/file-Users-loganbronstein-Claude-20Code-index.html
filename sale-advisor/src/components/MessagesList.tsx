const messages = [
  {
    initials: "MG",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    name: "Maria Gonzalez",
    time: "2m ago",
    preview:
      "Hey! Is Saturday still good for the walkthrough? I found more stuff in the attic lol",
    unread: true,
  },
  {
    initials: "JC",
    gradient: "linear-gradient(135deg, #f97316, #ef4444)",
    name: "James Chen",
    time: "15m ago",
    preview:
      "Just got your quote — looks great. Let's do it. When can you pick up?",
    unread: true,
  },
  {
    initials: "RK",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
    name: "Rachel Kim",
    time: "1h ago",
    preview:
      "Got the payout! You guys are incredible. My neighbor wants to use you too",
    unread: false,
  },
  {
    initials: "TP",
    gradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    name: "Tom Park",
    time: "3h ago",
    preview:
      "Can we add the patio furniture to the list? Just decided we're replacing it",
    unread: false,
  },
];

export default function MessagesList() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Recent Messages</div>
        <div className="card-action">View All →</div>
      </div>
      <div className="messages-list">
        {messages.map((msg) => (
          <div
            className={`message-item${msg.unread ? " message-unread" : ""}`}
            key={msg.name}
          >
            <div
              className="message-avatar"
              style={{ background: msg.gradient }}
            >
              {msg.initials}
            </div>
            <div className="message-content">
              <div className="message-top">
                <span className="message-name">{msg.name}</span>
                <span className="message-time">{msg.time}</span>
              </div>
              <div className="message-preview">{msg.preview}</div>
            </div>
            {msg.unread && <div className="unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}
