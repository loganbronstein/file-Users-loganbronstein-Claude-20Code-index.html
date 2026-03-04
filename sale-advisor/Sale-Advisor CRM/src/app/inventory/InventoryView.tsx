"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

interface InventoryItem {
  id: string;
  title: string;
  category: string | null;
  condition: string | null;
  estValueCents: number | null;
  listPriceCents: number | null;
  soldPriceCents: number | null;
  status: string;
  marketplace: string | null;
  createdAt: string;
  client: { id: string; name: string };
  listing?: { id: string; status: string } | null;
}

const TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING_PICKUP", label: "Pending Pickup" },
  { key: "IN_POSSESSION", label: "In Possession" },
  { key: "LISTED", label: "Listed" },
  { key: "SOLD", label: "Sold" },
] as const;

const statusColors: Record<string, { color: string; bg: string }> = {
  PENDING_PICKUP: { color: "var(--yellow)", bg: "var(--yellow-bg)" },
  IN_POSSESSION: { color: "var(--blue)", bg: "var(--blue-bg)" },
  LISTED: { color: "var(--accent)", bg: "var(--accent-glow)" },
  SOLD: { color: "var(--green)", bg: "var(--green-bg)" },
  DELIVERED_TO_BUYER: { color: "var(--green)", bg: "var(--green-bg)" },
  RETURNED: { color: "var(--red)", bg: "var(--red-bg)" },
  CANCELLED: { color: "var(--text-muted)", bg: "var(--bg-hover)" },
};

function fmt(cents: number | null) {
  if (!cents) return "—";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export default function InventoryView({ items }: { items: InventoryItem[] }) {
  const [tab, setTab] = useState("ALL");
  const router = useRouter();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = tab === "ALL" ? items : items.filter((i) => i.status === tab);

  async function markInPossession(itemId: string) {
    setActionLoading(itemId);
    const res = await fetch(`/api/inventory/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_POSSESSION" }),
    });
    if (res.ok) {
      toast("Marked in possession");
      router.refresh();
    } else {
      toast("Failed to update", "error");
    }
    setActionLoading(null);
  }

  async function createListing(itemId: string) {
    setActionLoading(itemId);
    const res = await fetch(`/api/inventory/${itemId}/create-listing`, { method: "POST" });
    if (res.ok) {
      const listing = await res.json();
      toast("Draft listing created");
      router.push(`/listings/${listing.id}`);
    } else {
      const err = await res.json();
      toast(err.errors?.[0] || "Failed to create listing", "error");
    }
    setActionLoading(null);
  }

  return (
    <>
      <div className="header">
        <div>
          <h1>Inventory</h1>
          <div className="header-subtitle">{items.length} item{items.length !== 1 ? "s" : ""} across all clients</div>
        </div>
      </div>

      {/* Tab filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => {
          const count = t.key === "ALL" ? items.length : items.filter((i) => i.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "6px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                border: tab === t.key ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: tab === t.key ? "var(--accent-glow)" : "var(--bg-card)",
                color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: tab === t.key ? 600 : 400,
              }}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No items in this category
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Item</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Client</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Condition</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Est. Value</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>List Price</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted)", fontWeight: 500, fontSize: 11, textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const sc = statusColors[item.status] || statusColors.PENDING_PICKUP;
                  const loading = actionLoading === item.id;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-primary)" }}>{item.title}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <Link href={`/clients/${item.client.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                          {item.client.name}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{item.category || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{item.condition || "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(item.estValueCents)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(item.listPriceCents)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, background: sc.bg, color: sc.color }}>
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {item.status === "PENDING_PICKUP" && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => markInPossession(item.id)}
                            disabled={loading}
                          >
                            {loading ? "..." : "Mark In Possession"}
                          </button>
                        )}
                        {item.status === "IN_POSSESSION" && !item.listing && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => createListing(item.id)}
                            disabled={loading}
                          >
                            {loading ? "..." : "Create Listing"}
                          </button>
                        )}
                        {item.listing && (
                          <Link href={`/listings/${item.listing.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: 12 }}>
                            View Listing
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
