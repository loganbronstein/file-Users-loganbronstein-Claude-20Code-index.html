import { getAllInventory } from "@/lib/queries";

export const dynamic = "force-dynamic";

function fmt(cents: number | null) {
  if (!cents) return "—";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const statusColors: Record<string, { color: string; bg: string }> = {
  PENDING_PICKUP: { color: "var(--yellow)", bg: "var(--yellow-bg)" },
  IN_POSSESSION: { color: "var(--blue)", bg: "var(--blue-bg)" },
  LISTED: { color: "var(--accent)", bg: "var(--accent-glow)" },
  SOLD: { color: "var(--green)", bg: "var(--green-bg)" },
  DELIVERED_TO_BUYER: { color: "var(--green)", bg: "var(--green-bg)" },
  RETURNED: { color: "var(--red)", bg: "var(--red-bg)" },
  CANCELLED: { color: "var(--text-muted)", bg: "var(--bg-hover)" },
};

export default async function ListingsPage() {
  const items = await getAllInventory();

  return (
    <>
      <div className="header">
        <div>
          <h1>Listings</h1>
          <div className="header-subtitle">{items.length} inventory item{items.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Inventory</div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No inventory items yet. Add items from a client profile.
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {items.map((item) => {
              const sc = statusColors[item.status] || statusColors.PENDING_PICKUP;
              return (
                <div key={item.id} className="message-item" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">{item.title}</div>
                    <div className="message-preview">
                      {item.client.name} · {[item.category, item.condition, item.marketplace].filter(Boolean).join(" · ") || "No details"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(item.listPriceCents)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>list price</div>
                    </div>
                    <span className="ad-status" style={{ background: sc.bg, color: sc.color }}>
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
