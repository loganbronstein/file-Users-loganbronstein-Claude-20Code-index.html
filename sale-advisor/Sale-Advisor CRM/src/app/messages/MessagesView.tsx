"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ConversationPreview {
  id: string;
  phoneE164: string;
  lastMessageAt: string;
  lead: { id: string; name: string; source: string; stage: string } | null;
  client: { id: string; name: string; stage: string } | null;
  messages: { content: string; direction: string; createdAt: string }[];
  _count: { messages: number };
}

interface MessageItem {
  id: string;
  content: string;
  direction: string;
  read: boolean;
  twilioSid: string | null;
  status: string | null;
  error: string | null;
  createdAt: string;
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
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const national = digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return e164;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

function formatDateSeparator(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const avatarColors = [
  "linear-gradient(135deg, #6366f1, #a855f7)",
  "linear-gradient(135deg, #f97316, #ef4444)",
  "linear-gradient(135deg, #22c55e, #16a34a)",
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #ec4899, #a855f7)",
];

export default function MessagesView({ conversations }: { conversations: ConversationPreview[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id || null);
  const [threadMessages, setThreadMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setSendError(null);
    fetch(`/api/conversations/${selectedId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setThreadMessages(data);
        setLoading(false);
      })
      .catch(() => {
        setThreadMessages([]);
        setLoading(false);
      });
  }, [selectedId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      fetch(`/api/conversations/${selectedId}/messages`)
        .then((res) => res.json())
        .then((data) => {
          setThreadMessages((prev) => {
            if (data.length !== prev.length) return data;
            return prev;
          });
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  // Filter conversations by search
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conv) => {
        const q = searchQuery.toLowerCase();
        const name = (conv.lead?.name || conv.client?.name || "").toLowerCase();
        const phone = formatPhone(conv.phoneE164).toLowerCase();
        const rawPhone = conv.phoneE164.toLowerCase();
        return name.includes(q) || phone.includes(q) || rawPhone.includes(q);
      })
    : conversations;

  async function handleSend() {
    if (!draft.trim() || !selectedId) return;
    setSending(true);
    setSendError(null);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          content: draft.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Failed to send");
        // Still add the message to the thread if it was saved
        if (data.message) {
          setThreadMessages((prev) => [...prev, data.message]);
        }
      } else {
        setThreadMessages((prev) => [...prev, data]);
        setDraft("");
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }

      router.refresh();
    } catch {
      setSendError("Network error — could not send");
    }

    setSending(false);
  }

  function getDisplayName(conv: ConversationPreview): string {
    return conv.lead?.name || conv.client?.name || formatPhone(conv.phoneE164);
  }

  function getSubtext(conv: ConversationPreview): string {
    const parts: string[] = [];
    if (conv.lead?.name || conv.client?.name) {
      parts.push(formatPhone(conv.phoneE164));
    }
    if (conv.lead) parts.push(conv.lead.source.toLowerCase().replace("_", " "));
    if (conv.client) parts.push("client");
    return parts.join(" · ");
  }

  if (conversations.length === 0) {
    return (
      <div className="card">
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>No conversations yet</div>
          <div style={{ fontSize: 13 }}>
            Conversations appear when you create a lead with a phone number or receive an inbound SMS.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, height: "calc(100vh - 160px)" }}>
      {/* Conversation list */}
      <div className="card" style={{ overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </div>
        {/* Search bar */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
          <input
            className="form-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontSize: 12, padding: "6px 10px" }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredConversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
              No conversations match &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredConversations.map((conv, i) => {
              const name = getDisplayName(conv);
              const preview = conv.messages[0]?.content || "No messages";
              const unread = conv._count.messages;
              const isSelected = conv.id === selectedId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    background: isSelected ? "var(--bg-hover)" : "transparent",
                    borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 13,
                    fontWeight: 600, color: "white", flexShrink: 0,
                    background: avatarColors[i % avatarColors.length],
                  }}>
                    {initials(name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 500, color: "var(--text-primary)" }}>
                        {name}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-muted)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {preview.length > 50 ? preview.slice(0, 47) + "..." : preview}
                    </div>
                  </div>
                  {unread > 0 && (
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0,
                    }}>
                      {unread}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Thread view */}
      <div className="card" style={{ display: "flex", flexDirection: "column" }}>
        {selected ? (
          <>
            {/* Header */}
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                  {getDisplayName(selected)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {getSubtext(selected)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {selected.lead && (
                  <span style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 6,
                    background: "var(--accent-glow)", color: "var(--accent-light)",
                  }}>
                    {selected.lead.stage.replace(/_/g, " ").toLowerCase()}
                  </span>
                )}
                {selected.client && (
                  <span style={{
                    fontSize: 11, padding: "3px 8px", borderRadius: 6,
                    background: "var(--green-bg)", color: "var(--green)",
                  }}>
                    {selected.client.stage.replace(/_/g, " ").toLowerCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: 20,
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                  Loading...
                </div>
              ) : threadMessages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 24, fontSize: 13 }}>
                  No messages yet. Send the first text below.
                </div>
              ) : (
                threadMessages.map((msg, idx) => {
                  const msgDate = new Date(msg.createdAt);
                  const prevDate = idx > 0 ? new Date(threadMessages[idx - 1].createdAt) : null;
                  const showDateSep = !prevDate || !isSameDay(msgDate, prevDate);

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div style={{
                          textAlign: "center", fontSize: 11, color: "var(--text-muted)",
                          padding: "8px 0", margin: idx > 0 ? "8px 0" : "0 0 8px 0",
                        }}>
                          <span style={{
                            background: "var(--bg-secondary)", padding: "3px 10px",
                            borderRadius: 10,
                          }}>
                            {formatDateSeparator(msgDate)}
                          </span>
                        </div>
                      )}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: msg.direction === "OUTBOUND" ? "flex-end" : "flex-start" }}>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: msg.direction === "OUTBOUND" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            fontSize: 13,
                            maxWidth: "75%",
                            background: msg.direction === "OUTBOUND" ? "var(--accent)" : "var(--bg-secondary)",
                            color: msg.direction === "OUTBOUND" ? "white" : "var(--text-primary)",
                            lineHeight: 1.45,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {msg.content}
                        </div>
                        <div style={{
                          fontSize: 10, marginTop: 3, display: "flex", gap: 6, alignItems: "center",
                          color: "var(--text-muted)",
                        }}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {msg.direction === "OUTBOUND" && msg.status && (
                            <span style={{
                              color: msg.status === "failed" ? "var(--red)" : "var(--text-muted)",
                            }}>
                              {msg.status === "failed" ? "failed" : msg.status === "delivered" ? "delivered" : "sent"}
                            </span>
                          )}
                          {msg.error && (
                            <span style={{ color: "var(--red)", fontSize: 10 }}>
                              {msg.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send box */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              {sendError && (
                <div style={{
                  fontSize: 12, color: "var(--red)", marginBottom: 8,
                  padding: "6px 10px", background: "var(--red-bg)", borderRadius: 6,
                }}>
                  {sendError}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  ref={textareaRef}
                  className="form-input"
                  placeholder="Type a message..."
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    autoResize();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  style={{ flex: 1, resize: "none", lineHeight: 1.4 }}
                  disabled={sending}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  style={{ minWidth: 72 }}
                >
                  {sending ? "Sending..." : "Send SMS"}
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  Messages are sent via Twilio to {formatPhone(selected.phoneE164)}
                </div>
                {draft.length > 100 && (
                  <div style={{ fontSize: 11, color: draft.length > 1500 ? "var(--red)" : "var(--text-muted)" }}>
                    {draft.length}/1600
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
