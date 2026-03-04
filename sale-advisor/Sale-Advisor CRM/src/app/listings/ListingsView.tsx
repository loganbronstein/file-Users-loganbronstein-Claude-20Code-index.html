"use client";

import { useState } from "react";

type Listing = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string | null;
  condition: string | null;
  images: string[];
  status: string;
  source: string;
  aiGenerated: boolean;
  marketplaces: string[];
  postedAt: string | null;
  soldAt: string | null;
  buyerName: string | null;
  buyerContact: string | null;
  deliveryStatus: string | null;
  deliveryDate: string | null;
  payoutStatus: string | null;
  payoutAmountCents: number | null;
  createdAt: string;
  client: { id: string; name: string } | null;
};

const statusColors: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: "var(--yellow)", bg: "var(--yellow-bg)" },
  NEEDS_REVIEW: { color: "#e67e22", bg: "rgba(230,126,34,0.15)" },
  APPROVED: { color: "var(--blue)", bg: "var(--blue-bg)" },
  POSTING: { color: "var(--blue)", bg: "var(--blue-bg)" },
  POSTED: { color: "var(--accent)", bg: "var(--accent-glow)" },
  SOLD: { color: "var(--green)", bg: "var(--green-bg)" },
  DELIVERY_SCHEDULED: { color: "#9b59b6", bg: "rgba(155,89,182,0.15)" },
  PAID_OUT: { color: "var(--green)", bg: "var(--green-bg)" },
};

const tabs = ["ALL", "DRAFTS", "REVIEW", "POSTED", "SOLD"] as const;

/** Map tab names to the listing statuses they represent */
function matchesTab(status: string, tab: (typeof tabs)[number]): boolean {
  switch (tab) {
    case "ALL": return true;
    case "DRAFTS": return status === "DRAFT" || status === "NEEDS_REVIEW";
    case "REVIEW": return status === "NEEDS_REVIEW";
    case "POSTED": return status === "APPROVED" || status === "POSTING" || status === "POSTED";
    case "SOLD": return status === "SOLD" || status === "DELIVERY_SCHEDULED" || status === "PAID_OUT";
    default: return true;
  }
}

function fmt(cents: number) {
  if (!cents) return "$0.00";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ListingsView({ listings: initial, initialTab }: { listings: Listing[]; initialTab?: string }) {
  const [listings, setListings] = useState(initial);
  const validInitial = initialTab && tabs.includes(initialTab as (typeof tabs)[number])
    ? initialTab as (typeof tabs)[number]
    : "ALL";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(validInitial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = listings.filter((l) => matchesTab(l.status, activeTab));

  async function handleApprove(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: data.listing.status, marketplaces: data.listing.marketplaces } : l)),
        );
      } else {
        alert(data.errors?.join(", ") || "Approval failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this draft listing?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert(data.errors?.join(", ") || "Delete failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(null);
  }

  async function handleSaveEdit(id: string) {
    setLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          priceCents: editForm.priceCents,
          category: editForm.category,
          condition: editForm.condition,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...data.listing } : l)));
        setEditingId(null);
      } else {
        alert(data.errors?.join(", ") || "Save failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(null);
  }

  async function handleRegenerate(id: string) {
    setLoading(id);
    try {
      const res = await fetch("/api/listings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      const data = await res.json();
      if (data.ok) {
        setListings((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, title: data.details.title, description: data.details.description, priceCents: data.details.priceCents, category: data.details.category, condition: data.details.condition, aiGenerated: true }
              : l,
          ),
        );
      } else {
        alert(data.errors?.join(", ") || "AI generation failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(null);
  }

  function startEdit(listing: Listing) {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      description: listing.description,
      priceCents: listing.priceCents,
      category: listing.category,
      condition: listing.condition,
    });
  }

  return (
    <>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((tab) => {
          const count = listings.filter((l) => matchesTab(l.status, tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: activeTab === tab ? "var(--accent)" : "var(--bg-card)",
                color: activeTab === tab ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
          No {activeTab === "ALL" ? "" : activeTab.toLowerCase()} listings yet.
        </div>
      ) : activeTab === "DRAFTS" || activeTab === "REVIEW" || activeTab === "ALL" ? (
        /* Card layout for drafts / all */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((listing) => {
            const sc = statusColors[listing.status] || statusColors.DRAFT;
            const isEditing = editingId === listing.id;
            const isLoading = loading === listing.id;

            return (
              <div key={listing.id} className="card" style={{ overflow: "hidden" }}>
                {/* Image */}
                {listing.images.length > 0 && (
                  <div style={{ height: 200, overflow: "hidden", background: "var(--bg-hover)" }}>
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                )}

                <div style={{ padding: 16 }}>
                  {/* Status + Source badges */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <span className="ad-status" style={{ background: sc.bg, color: sc.color }}>
                      {listing.status}
                    </span>
                    {listing.source === "SMS" && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 4 }}>
                        via SMS
                      </span>
                    )}
                    {listing.aiGenerated && (
                      <span style={{ fontSize: 11, color: "var(--blue)", background: "var(--blue-bg)", padding: "2px 8px", borderRadius: 4 }}>
                        AI Generated
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    /* Edit form */
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Title"
                        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 14 }}
                      />
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                        rows={3}
                        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 13, resize: "vertical" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          value={editForm.priceCents ? editForm.priceCents / 100 : ""}
                          onChange={(e) => setEditForm({ ...editForm, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                          placeholder="Price ($)"
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 13, flex: 1 }}
                        />
                        <select
                          value={editForm.condition || ""}
                          onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-primary)", fontSize: 13 }}
                        >
                          <option value="">Condition</option>
                          <option>New</option>
                          <option>Like New</option>
                          <option>Good</option>
                          <option>Fair</option>
                          <option>Poor</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleSaveEdit(listing.id)}
                          disabled={isLoading}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, opacity: isLoading ? 0.5 : 1 }}
                        >
                          {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Title + Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                          {listing.title}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {listing.priceCents > 0 ? fmt(listing.priceCents) : "—"}
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                        {[listing.category, listing.condition, listing.client?.name].filter(Boolean).join(" · ")}
                        {" · "}{timeAgo(listing.createdAt)}
                      </div>

                      {/* Description preview */}
                      {listing.description && (
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.4, maxHeight: 60, overflow: "hidden" }}>
                          {listing.description.slice(0, 150)}{listing.description.length > 150 ? "..." : ""}
                        </div>
                      )}

                      {/* Image count */}
                      {listing.images.length > 1 && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                          {listing.images.length} photos
                        </div>
                      )}

                      {/* Marketplace badges */}
                      {listing.marketplaces.length > 0 && listing.status !== "DRAFT" && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                          {listing.marketplaces.map((mp) => (
                            <span key={mp} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                              {mp}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {(listing.status === "DRAFT" || listing.status === "NEEDS_REVIEW") && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          <button
                            onClick={() => startEdit(listing)}
                            style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRegenerate(listing.id)}
                            disabled={isLoading || listing.images.length === 0}
                            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--blue)", background: "var(--blue-bg)", color: "var(--blue)", cursor: listing.images.length === 0 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, opacity: isLoading || listing.images.length === 0 ? 0.5 : 1 }}
                          >
                            {isLoading ? "..." : "AI Regen"}
                          </button>
                          <button
                            onClick={() => handleApprove(listing.id)}
                            disabled={isLoading || listing.priceCents <= 0}
                            style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "none", background: "var(--green)", color: "#fff", cursor: listing.priceCents <= 0 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: isLoading || listing.priceCents <= 0 ? 0.5 : 1 }}
                          >
                            {isLoading ? "..." : "Approve & Post"}
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            disabled={isLoading}
                            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--red)", background: "transparent", color: "var(--red)", cursor: "pointer", fontSize: 13, opacity: isLoading ? 0.5 : 1 }}
                          >
                            X
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table layout for posted/sold/approved */
        <div className="card">
          <div style={{ padding: 8 }}>
            {filtered.map((listing) => {
              const sc = statusColors[listing.status] || statusColors.DRAFT;
              return (
                <div key={listing.id} className="message-item" style={{ alignItems: "center" }}>
                  {listing.images.length > 0 && (
                    <img
                      src={listing.images[0]}
                      alt=""
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", marginRight: 12 }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="message-name">{listing.title}</div>
                    <div className="message-preview">
                      {[listing.client?.name, listing.category, listing.condition].filter(Boolean).join(" · ")}
                      {listing.marketplaces.length > 0 && ` · ${listing.marketplaces.join(", ")}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(listing.priceCents)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {listing.postedAt ? `posted ${timeAgo(listing.postedAt)}` : timeAgo(listing.createdAt)}
                      </div>
                    </div>
                    <span className="ad-status" style={{ background: sc.bg, color: sc.color }}>
                      {listing.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
