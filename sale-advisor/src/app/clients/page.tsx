import Link from "next/link";
import { getAllClients } from "@/lib/queries";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, { label: string; color: string; bg: string }> = {
  WALKTHROUGH_SCHEDULED: { label: "Walkthrough Scheduled", color: "var(--blue)", bg: "var(--blue-bg)" },
  WALKTHROUGH_COMPLETED: { label: "Walkthrough Done", color: "var(--accent)", bg: "var(--accent-glow)" },
  LISTING_ACTIVE: { label: "Listing Active", color: "var(--green)", bg: "var(--green-bg)" },
  PARTIALLY_SOLD: { label: "Partially Sold", color: "var(--yellow)", bg: "var(--yellow-bg)" },
  SOLD_PAID: { label: "Sold & Paid", color: "var(--green)", bg: "var(--green-bg)" },
  CLOSED: { label: "Closed", color: "var(--text-muted)", bg: "var(--bg-hover)" },
};

export default async function ClientsPage() {
  const clients = await getAllClients();

  return (
    <>
      <div className="header">
        <div>
          <h1>Clients</h1>
          <div className="header-subtitle">{clients.length} active client{clients.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Clients</div>
        </div>
        {clients.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No clients yet. Convert a lead to create your first client.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {clients.map((c) => {
              const stage = stageLabels[c.stage] || stageLabels.CLOSED;
              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="message-item" style={{ alignItems: "center" }}>
                    <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--accent), var(--purple))" }}>
                      {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="message-content">
                      <div className="message-top">
                        <span className="message-name">{c.name}</span>
                        <span className="ad-status" style={{ background: stage.bg, color: stage.color }}>
                          {stage.label}
                        </span>
                      </div>
                      <div className="message-preview">
                        {c.neighborhood || "No location"} · {c._count.inventory} items · {c._count.messages} messages
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
