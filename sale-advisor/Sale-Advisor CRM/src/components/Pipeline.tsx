"use client";

import { useRouter } from "next/navigation";

interface Lead {
  id: string;
  name: string;
  neighborhood: string | null;
  itemsDescription: string | null;
  source: string;
  stage: string;
  estimatedValue: number | null;
}

interface Client {
  id: string;
  name: string;
  neighborhood: string | null;
  stage: string;
  lead: { source: string };
  inventory: { estValueCents: number | null; soldPriceCents: number | null; status: string }[];
  payouts: { payoutCents: number; status: string }[];
}

interface PipelineProps {
  leads: { newLeads: Lead[]; contacted: Lead[]; booked: Lead[] };
  clients: { listing: Client[]; soldPaid: Client[] };
}

const sourceTag: Record<string, { label: string; cls: string }> = {
  FACEBOOK: { label: "Facebook", cls: "tag-fb" },
  INSTAGRAM: { label: "Instagram", cls: "tag-ig" },
  GOOGLE: { label: "Google", cls: "tag-goog" },
  NEXTDOOR: { label: "Nextdoor", cls: "tag-nd" },
  TIKTOK: { label: "TikTok", cls: "tag-tiktok" },
  REFERRAL: { label: "Referral", cls: "tag-ref" },
  LAKESHORE: { label: "Lakeshore", cls: "tag-lakeshore" },
  WEBSITE: { label: "Website", cls: "tag-fb" },
  OTHER: { label: "Other", cls: "tag-fb" },
};

const stageOptions: Record<string, { label: string; value: string }[]> = {
  lead: [
    { label: "New Lead", value: "NEW_LEAD" },
    { label: "Contacted", value: "CONTACTED" },
    { label: "Booked", value: "WALKTHROUGH_BOOKED" },
    { label: "Lost", value: "LOST" },
  ],
  client: [
    { label: "Walkthrough Scheduled", value: "WALKTHROUGH_SCHEDULED" },
    { label: "Walkthrough Done", value: "WALKTHROUGH_COMPLETED" },
    { label: "Listing Active", value: "LISTING_ACTIVE" },
    { label: "Partially Sold", value: "PARTIALLY_SOLD" },
    { label: "Sold & Paid", value: "SOLD_PAID" },
    { label: "Closed", value: "CLOSED" },
  ],
};

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString();
}

export default function Pipeline({ leads, clients }: PipelineProps) {
  const router = useRouter();

  async function updateLeadStage(id: string, stage: string) {
    if (stage === "WALKTHROUGH_BOOKED") {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });
    } else {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
    }
    router.refresh();
  }

  async function updateClientStage(id: string, stage: string) {
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    router.refresh();
  }

  function LeadCard({ lead }: { lead: Lead }) {
    const tag = sourceTag[lead.source] || sourceTag.OTHER;
    return (
      <div className="pipeline-card">
        <div className="pipeline-card-name">{lead.name}</div>
        <div className="pipeline-card-detail">
          {[lead.neighborhood, lead.itemsDescription].filter(Boolean).join(" — ") || "No details"}
        </div>
        {lead.estimatedValue && (
          <div className="pipeline-card-detail" style={{ color: "var(--green)", fontWeight: 600 }}>
            ${lead.estimatedValue.toLocaleString()} est.
          </div>
        )}
        <div className="pipeline-card-tags">
          <span className={`tag ${tag.cls}`}>{tag.label}</span>
        </div>
        <select
          style={{
            marginTop: 8, width: "100%", padding: "4px 6px", fontSize: 11,
            background: "var(--bg-primary)", color: "var(--text-secondary)",
            border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
          }}
          value={lead.stage}
          onChange={(e) => updateLeadStage(lead.id, e.target.value)}
        >
          {stageOptions.lead.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  function ClientCard({ client }: { client: Client }) {
    const tag = sourceTag[client.lead.source] || sourceTag.OTHER;
    const estTotal = client.inventory.reduce((s, i) => s + (i.estValueCents || 0), 0);
    const paidTotal = client.payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.payoutCents, 0);
    return (
      <div className="pipeline-card">
        <div className="pipeline-card-name">{client.name}</div>
        <div className="pipeline-card-detail">
          {client.neighborhood || "No location"} — {client.inventory.length} items
        </div>
        {estTotal > 0 && (
          <div className="pipeline-card-detail" style={{ color: "var(--green)", fontWeight: 600 }}>
            {fmt(estTotal)} est. value
          </div>
        )}
        {paidTotal > 0 && (
          <div className="pipeline-card-detail" style={{ color: "var(--green)", fontWeight: 600 }}>
            Paid {fmt(paidTotal)} ✓
          </div>
        )}
        <div className="pipeline-card-tags">
          <span className={`tag ${tag.cls}`}>{tag.label}</span>
        </div>
        <select
          style={{
            marginTop: 8, width: "100%", padding: "4px 6px", fontSize: 11,
            background: "var(--bg-primary)", color: "var(--text-secondary)",
            border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer",
          }}
          value={client.stage}
          onChange={(e) => updateClientStage(client.id, e.target.value)}
        >
          {stageOptions.client.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }

  const allNewContacted = [...leads.newLeads, ...leads.contacted];

  const columns = [
    { title: "New Leads", items: allNewContacted, countBg: "var(--blue-bg)", countColor: "var(--blue)", type: "lead" as const },
    { title: "Booked", items: leads.booked, countBg: "var(--yellow-bg)", countColor: "var(--yellow)", type: "lead" as const },
    { title: "Listing", items: clients.listing, countBg: "var(--green-bg)", countColor: "var(--green)", type: "client" as const },
    { title: "Sold & Paid", items: clients.soldPaid, countBg: "var(--green-bg)", countColor: "var(--green)", type: "client" as const },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Client Pipeline</div>
        <div className="card-action">View All →</div>
      </div>
      <div className="pipeline">
        {columns.map((col) => (
          <div className="pipeline-col" key={col.title}>
            <div className="pipeline-header">
              <span className="pipeline-title">{col.title}</span>
              <span className="pipeline-count" style={{ background: col.countBg, color: col.countColor }}>
                {col.items.length}
              </span>
            </div>
            {col.items.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", padding: 14, textAlign: "center" }}>
                No items yet
              </div>
            )}
            {col.type === "lead"
              ? (col.items as Lead[]).map((lead) => <LeadCard key={lead.id} lead={lead} />)
              : (col.items as Client[]).map((client) => <ClientCard key={client.id} client={client} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
