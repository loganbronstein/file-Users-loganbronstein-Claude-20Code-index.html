import LeadSources from "@/components/LeadSources";
import { getLeadSourceCounts, getAllLeads } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const [sources, leads] = await Promise.all([getLeadSourceCounts(), getAllLeads()]);

  return (
    <>
      <div className="header">
        <div>
          <h1>Lead Sources</h1>
          <div className="header-subtitle">{leads.length} total lead{leads.length !== 1 ? "s" : ""} across {sources.length} source{sources.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <LeadSources sources={sources} />

      {/* Lead table */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">All Leads</div>
        </div>
        {leads.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No leads yet.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {leads.map((lead) => (
              <div key={lead.id} className="message-item" style={{ alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="message-name">{lead.name}</div>
                  <div className="message-preview">
                    {lead.neighborhood || "No location"} · {lead.itemsDescription || "No items"} · {lead._count.messages} msg{lead._count.messages !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="tag tag-fb" style={{ fontSize: 11 }}>{lead.source}</span>
                  <span className="ad-status" style={{
                    background: lead.stage === "NEW_LEAD" ? "var(--blue-bg)" : "var(--yellow-bg)",
                    color: lead.stage === "NEW_LEAD" ? "var(--blue)" : "var(--yellow)",
                  }}>
                    {lead.stage.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
