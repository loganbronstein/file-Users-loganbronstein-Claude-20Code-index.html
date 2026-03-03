"use client";

import { useRouter } from "next/navigation";

interface Delivery {
  id: string;
  description: string;
  fromAddress: string;
  toAddress: string;
  status: string;
  crewSize: number;
  scheduledAt: string | null;
  completedAt: string | null;
  client: { name: string };
}

const statusConfig: Record<string, { icon: string; iconBg: string; cls: string; progress: number; progressColor: string }> = {
  SCHEDULED: { icon: "🗓️", iconBg: "var(--blue-bg)", cls: "scheduled", progress: 10, progressColor: "var(--blue)" },
  PICKUP: { icon: "📦", iconBg: "var(--purple-bg)", cls: "pickup", progress: 25, progressColor: "var(--purple)" },
  IN_TRANSIT: { icon: "🚛", iconBg: "var(--yellow-bg)", cls: "in-transit", progress: 65, progressColor: "var(--yellow)" },
  DELIVERED: { icon: "✅", iconBg: "var(--green-bg)", cls: "delivered", progress: 100, progressColor: "var(--green)" },
  CANCELLED: { icon: "❌", iconBg: "var(--red-bg)", cls: "scheduled", progress: 0, progressColor: "var(--red)" },
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  PICKUP: "Pickup",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered ✓",
  CANCELLED: "Cancelled",
};

function fmtDate(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function DeliveryTracker({ deliveries }: { deliveries: Delivery[] }) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  if (deliveries.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header">
          <div className="card-title">🚚 Lakeshore Hauling — Delivery Tracker</div>
        </div>
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No deliveries scheduled
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="card-header">
        <div className="card-title">🚚 Lakeshore Hauling — Delivery Tracker</div>
        <div className="card-action">Schedule Delivery →</div>
      </div>
      <div className="delivery-grid">
        {deliveries.map((d) => {
          const cfg = statusConfig[d.status] || statusConfig.SCHEDULED;
          return (
            <div className="delivery-item" key={d.id}>
              <div className="delivery-icon" style={{ background: cfg.iconBg }}>{cfg.icon}</div>
              <div className="delivery-info">
                <div className="delivery-route">{d.description}</div>
                <div className="delivery-details">
                  {d.client.name} · {d.fromAddress} → {d.toAddress} · {d.crewSize}-man crew
                </div>
                <div className="delivery-progress-bar">
                  <div className="delivery-progress-fill" style={{ width: `${cfg.progress}%`, background: cfg.progressColor }} />
                </div>
              </div>
              <div className="delivery-right">
                <select
                  style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 20,
                    background: cfg.iconBg, color: cfg.progressColor, border: "none", cursor: "pointer",
                    marginBottom: 6,
                  }}
                  value={d.status}
                  onChange={(e) => updateStatus(d.id, e.target.value)}
                >
                  {Object.entries(statusLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <div className="delivery-time">{fmtDate(d.scheduledAt)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
