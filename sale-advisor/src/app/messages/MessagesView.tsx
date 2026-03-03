"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  direction: string;
  read: boolean;
  createdAt: string;
  leadId: string | null;
  clientId: string | null;
}

interface Thread {
  id: string;
  name: string;
  phone: string | null;
  type: "lead" | "client";
  messages: Message[];
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const colors = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #ec4899, #a855f7)",
];

export default function MessagesView({ threads }: { threads: Thread[] }) {
  const [selected, setSelected] = useState<Thread | null>(threads[0] || null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  async function sendMessage() {
    if (!draft.trim() || !selected) return;
    setSending(true);

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: draft,
        direction: "OUTBOUND",
        ...(selected.type === "lead" ? { leadId: selected.id } : { clientId: selected.id }),
      }),
    });

    setDraft("");
    setSending(false);
    router.refresh();
  }

  if (threads.length === 0) {
    return (
      <div className="card">
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          No conversations yet. Messages will appear here when leads or clients are messaged.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, height: "calc(100vh - 160px)" }}>
      {/* Thread list */}
      <div className="card" style={{ overflowY: "auto" }}>
        <div style={{ padding: 8 }}>
          {threads.map((t, i) => (
            <div
              key={`${t.type}-${t.id}`}
              className={`message-item${t.unreadCount > 0 ? " message-unread" : ""}`}
              style={{ background: selected?.id === t.id && selected?.type === t.type ? "var(--bg-hover)" : undefined }}
              onClick={() => setSelected(t)}
            >
              <div className="message-avatar" style={{ background: colors[i % colors.length] }}>
                {initials(t.name)}
              </div>
              <div className="message-content">
                <div className="message-top">
                  <span className="message-name">{t.name}</span>
                  <span className="message-time">{timeAgo(t.lastTime)}</span>
                </div>
                <div className="message-preview">{t.lastMessage}</div>
              </div>
              {t.unreadCount > 0 && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="card" style={{ display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            <div className="card-header">
              <div>
                <div className="card-title">{selected.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {selected.phone || "No phone"} · {selected.type}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {[...selected.messages].reverse().map((msg) => (
                <div key={msg.id} style={{
                  padding: "10px 14px", borderRadius: 12, fontSize: 13, maxWidth: "70%",
                  background: msg.direction === "OUTBOUND" ? "var(--accent)" : "var(--bg-secondary)",
                  color: msg.direction === "OUTBOUND" ? "white" : "var(--text-primary)",
                  alignSelf: msg.direction === "OUTBOUND" ? "flex-end" : "flex-start",
                }}>
                  {msg.content}
                  <div style={{
                    fontSize: 10, marginTop: 4, opacity: 0.7,
                    color: msg.direction === "OUTBOUND" ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                  }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <input
                className="form-input"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={sendMessage} disabled={sending || !draft.trim()}>
                {sending ? "..." : "Send"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
