import { getWalkthroughs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function WalkthroughsPage() {
  const { bookedLeads, walkthroughClients } = await getWalkthroughs();
  const total = bookedLeads.length + walkthroughClients.length;

  return (
    <>
      <div className="header">
        <div>
          <h1>Walkthroughs</h1>
          <div className="header-subtitle">{total} walkthrough{total !== 1 ? "s" : ""} scheduled or completed</div>
        </div>
      </div>

      {/* Booked leads waiting for walkthrough */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Booked — Awaiting Walkthrough ({bookedLeads.length})</div>
        </div>
        {bookedLeads.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No walkthroughs booked right now.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {bookedLeads.map((lead) => (
              <div key={lead.id} className="message-item" style={{ alignItems: "center" }}>
                <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--yellow), var(--orange))" }}>
                  {lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="message-name">{lead.name}</div>
                  <div className="message-preview">
                    {lead.neighborhood || "No location"} · {lead.itemsDescription || "No items listed"} · {lead.phone || lead.email || "No contact"}
                  </div>
                </div>
                <span className="ad-status" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>
                  Booked
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clients with walkthrough completed/scheduled */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Client Walkthroughs ({walkthroughClients.length})</div>
        </div>
        {walkthroughClients.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No client walkthroughs yet.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {walkthroughClients.map((client) => (
              <div key={client.id} className="message-item" style={{ alignItems: "center" }}>
                <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--green), var(--accent))" }}>
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="message-name">{client.name}</div>
                  <div className="message-preview">
                    {client.neighborhood || "No location"} · {client.lead?.phone || client.lead?.email || "No contact"}
                  </div>
                </div>
                <span className="ad-status" style={{
                  background: client.stage === "WALKTHROUGH_COMPLETED" ? "var(--green-bg)" : "var(--blue-bg)",
                  color: client.stage === "WALKTHROUGH_COMPLETED" ? "var(--green)" : "var(--blue)",
                }}>
                  {client.stage === "WALKTHROUGH_COMPLETED" ? "Completed" : "Scheduled"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
