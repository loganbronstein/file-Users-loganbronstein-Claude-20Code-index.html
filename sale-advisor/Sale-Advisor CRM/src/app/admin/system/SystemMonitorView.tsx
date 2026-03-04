"use client";

import { useEffect, useState, useCallback } from "react";

type ServiceStatus = {
  status: "green" | "yellow" | "red";
  label: string;
  detail?: string;
  latencyMs?: number;
};

type StatusResponse = {
  ok: boolean;
  overall: "green" | "yellow" | "red";
  services: Record<string, ServiceStatus>;
  timestamp: string;
};

type SystemEvent = {
  id: string;
  type: "sms" | "ai_listing" | "approval";
  title: string;
  detail: string;
  time: string;
  color: string;
};

const STATUS_LABELS: Record<string, string> = {
  green: "Healthy",
  yellow: "Degraded",
  red: "Down",
};

const OVERALL_LABELS: Record<string, string> = {
  green: "All Systems Operational",
  yellow: "Partial Degradation",
  red: "Service Disruption",
};

const TYPE_BADGES: Record<string, { label: string; bg: string }> = {
  sms: { label: "SMS", bg: "#3b82f6" },
  ai_listing: { label: "AI", bg: "#8b5cf6" },
  approval: { label: "OK", bg: "#22c55e" },
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SystemMonitorView({ events }: { events: SystemEvent[] }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/system/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setLastChecked(new Date());
      }
    } catch {
      // Network error — leave previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div>
      {/* Overall banner */}
      {status && (
        <div
          style={{
            padding: "16px 24px",
            borderRadius: 12,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              status.overall === "green"
                ? "rgba(34,197,94,0.1)"
                : status.overall === "yellow"
                  ? "rgba(234,179,8,0.1)"
                  : "rgba(239,68,68,0.1)",
            border: `1px solid ${
              status.overall === "green"
                ? "rgba(34,197,94,0.3)"
                : status.overall === "yellow"
                  ? "rgba(234,179,8,0.3)"
                  : "rgba(239,68,68,0.3)"
            }`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background:
                  status.overall === "green" ? "#22c55e" : status.overall === "yellow" ? "#eab308" : "#ef4444",
                boxShadow: `0 0 8px ${
                  status.overall === "green" ? "#22c55e" : status.overall === "yellow" ? "#eab308" : "#ef4444"
                }`,
              }}
            />
            <strong>{OVERALL_LABELS[status.overall]}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#888" }}>
            {lastChecked && <span>Last checked: {lastChecked.toLocaleTimeString()}</span>}
            <button
              onClick={fetchStatus}
              disabled={loading}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#ccc",
                cursor: loading ? "wait" : "pointer",
                fontSize: 13,
              }}
            >
              {loading ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* Status cards grid */}
      {status && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {Object.values(status.services).map((svc) => (
            <div className="card" key={svc.label} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      svc.status === "green" ? "#22c55e" : svc.status === "yellow" ? "#eab308" : "#ef4444",
                    boxShadow: `0 0 6px ${
                      svc.status === "green" ? "#22c55e" : svc.status === "yellow" ? "#eab308" : "#ef4444"
                    }`,
                  }}
                />
                <strong style={{ fontSize: 15 }}>{svc.label}</strong>
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    svc.status === "green"
                      ? "rgba(34,197,94,0.15)"
                      : svc.status === "yellow"
                        ? "rgba(234,179,8,0.15)"
                        : "rgba(239,68,68,0.15)",
                  color: svc.status === "green" ? "#22c55e" : svc.status === "yellow" ? "#eab308" : "#ef4444",
                  marginBottom: 8,
                }}
              >
                {STATUS_LABELS[svc.status]}
              </div>
              {svc.detail && (
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{svc.detail}</div>
              )}
              {svc.latencyMs !== undefined && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{svc.latencyMs}ms</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {!status && loading && (
        <div style={{ textAlign: "center", padding: 48, color: "#888" }}>Loading service status…</div>
      )}

      {/* Event log */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Recent System Events</h3>
        </div>
        <div style={{ maxHeight: 600, overflowY: "auto" }}>
          {events.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
              No system events recorded yet.
            </div>
          ) : (
            events.map((evt) => {
              const badge = TYPE_BADGES[evt.type];
              return (
                <div
                  key={evt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: badge.bg,
                      color: "#fff",
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    {badge.label}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{evt.title}</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#888",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {evt.detail}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap" }}>
                    {timeAgo(evt.time)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
