import { notFound } from "next/navigation";
import { getClientById } from "@/lib/queries";
import Link from "next/link";
import { ScheduleDeliveryForm, CreatePayoutForm, InventoryActions } from "./ClientActions";

export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const invStatusColors: Record<string, { color: string; bg: string }> = {
  PENDING_PICKUP: { color: "var(--yellow)", bg: "var(--yellow-bg)" },
  IN_POSSESSION: { color: "var(--blue)", bg: "var(--blue-bg)" },
  LISTED: { color: "var(--accent)", bg: "var(--accent-glow)" },
  SOLD: { color: "var(--green)", bg: "var(--green-bg)" },
  DELIVERED_TO_BUYER: { color: "var(--green)", bg: "var(--green-bg)" },
  RETURNED: { color: "var(--red)", bg: "var(--red-bg)" },
  CANCELLED: { color: "var(--text-muted)", bg: "var(--bg-hover)" },
};

const deliveryStatusColors: Record<string, { color: string; bg: string }> = {
  SCHEDULED: { color: "var(--blue)", bg: "var(--blue-bg)" },
  PICKUP: { color: "var(--purple)", bg: "var(--purple-bg)" },
  IN_TRANSIT: { color: "var(--yellow)", bg: "var(--yellow-bg)" },
  DELIVERED: { color: "var(--green)", bg: "var(--green-bg)" },
  CANCELLED: { color: "var(--red)", bg: "var(--red-bg)" },
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const estTotal = client.inventory.reduce((s, i) => s + (i.estValueCents || 0), 0);
  const soldTotal = client.inventory.reduce((s, i) => s + (i.soldPriceCents || 0), 0);
  const paidTotal = client.payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.payoutCents, 0);
  const pendingPayouts = client.payouts.filter((p) => p.status === "PENDING" || p.status === "PROCESSING");

  return (
    <>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/clients" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: 13 }}>Clients</Link>
            <span style={{ color: "var(--text-muted)" }}>/</span>
            <h1 style={{ margin: 0 }}>{client.name}</h1>
          </div>
          <div className="header-subtitle" style={{ marginTop: 4 }}>
            {client.neighborhood || "No location"} · {client.phone || client.email || "No contact"} · {client.stage.replace(/_/g, " ")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/messages" className="btn btn-secondary" style={{ fontSize: 13, textDecoration: "none" }}>Messages</Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card">
          <div className="stat-label">Inventory</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{client.inventory.length}</div>
          <div className="stat-change up">Est. {fmt(estTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sold</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{fmt(soldTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid Out</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{fmt(paidTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deliveries</div>
          <div className="stat-value" style={{ fontSize: 24 }}>{client.deliveries.length}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <ScheduleDeliveryForm clientId={client.id} clientName={client.name} />
        <CreatePayoutForm clientId={client.id} clientName={client.name} />
      </div>

      {/* Inventory */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Inventory ({client.inventory.length})</div>
        </div>
        {client.inventory.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No inventory items yet
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {client.inventory.map((item) => {
              const sc = invStatusColors[item.status] || invStatusColors.PENDING_PICKUP;
              const inv = item as typeof item & { listing?: { id: string; status: string } | null };
              return (
                <div key={item.id} className="message-item" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">{item.title}</div>
                    <div className="message-preview">
                      {[item.category, item.condition, item.marketplace].filter(Boolean).join(" · ") || "No details"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ad-status" style={{ background: sc.bg, color: sc.color }}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                    {item.listPriceCents && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {fmt(item.listPriceCents)}
                      </span>
                    )}
                    {inv.listing ? (
                      <Link href={`/listings/${inv.listing.id}`} style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                        View Listing
                      </Link>
                    ) : item.status === "IN_POSSESSION" ? (
                      <InventoryActions itemId={item.id} />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deliveries */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Deliveries ({client.deliveries.length})</div>
        </div>
        {client.deliveries.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No deliveries yet — schedule one above
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {client.deliveries.map((d) => {
              const dc = deliveryStatusColors[d.status] || deliveryStatusColors.SCHEDULED;
              return (
                <div key={d.id} className="message-item" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">{d.description}</div>
                    <div className="message-preview">
                      {d.fromAddress} → {d.toAddress} · {d.crewSize}-man crew
                      {d.scheduledAt && ` · ${new Date(d.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </div>
                  </div>
                  <span className="ad-status" style={{ background: dc.bg, color: dc.color }}>
                    {d.status.replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payouts */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Payouts ({client.payouts.length})</div>
          {pendingPayouts.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--yellow)", padding: "3px 8px", borderRadius: 6, background: "var(--yellow-bg)" }}>
              {pendingPayouts.length} pending
            </span>
          )}
        </div>
        {client.payouts.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No payouts yet — record one above
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {client.payouts.map((p) => (
              <div key={p.id} className="message-item" style={{ alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="message-name">Payout: {fmt(p.payoutCents)}</div>
                  <div className="message-preview">
                    Gross: {fmt(p.grossSaleCents)} · Commission: {p.commissionPercent}% ({fmt(p.commissionCents)}) · Delivery: {fmt(p.deliveryFeeCents)}
                  </div>
                </div>
                <span className="ad-status" style={{
                  background: p.status === "PAID" ? "var(--green-bg)" : "var(--yellow-bg)",
                  color: p.status === "PAID" ? "var(--green)" : "var(--yellow)",
                }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Messages ({client.messages.length})</div>
        </div>
        {client.messages.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No messages yet</div>
        ) : (
          <div style={{ padding: 16 }}>
            {client.messages.slice(0, 20).map((msg) => (
              <div key={msg.id} style={{
                padding: "8px 12px", marginBottom: 8, borderRadius: 8, fontSize: 13,
                background: msg.direction === "OUTBOUND" ? "var(--accent-glow)" : "var(--bg-secondary)",
                marginLeft: msg.direction === "OUTBOUND" ? 40 : 0,
                marginRight: msg.direction === "INBOUND" ? 40 : 0,
              }}>
                <div style={{ color: "var(--text-primary)" }}>{msg.content}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>
                  {msg.direction === "OUTBOUND" ? "You" : client.name} · {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
