"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ListingEvent = {
  id: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  detail: string | null;
  createdAt: string;
};

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
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string } | null;
  events: ListingEvent[];
};

const ALL_MARKETPLACES = ["facebook", "ebay", "craigslist", "offerup"] as const;
const CATEGORIES = ["Furniture", "Electronics", "Appliances", "Clothing", "Sports", "Tools", "Home Decor", "Kitchen", "Outdoor", "Toys", "Books", "Art", "Jewelry", "Collectibles", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT:              { color: "var(--yellow)",  bg: "var(--yellow-bg)",       label: "Draft" },
  NEEDS_REVIEW:       { color: "#e67e22",        bg: "rgba(230,126,34,0.15)", label: "Needs Review" },
  APPROVED:           { color: "var(--blue)",    bg: "var(--blue-bg)",         label: "Approved" },
  POSTING:            { color: "var(--blue)",    bg: "var(--blue-bg)",         label: "Posting" },
  POSTED:             { color: "var(--accent)",  bg: "var(--accent-glow)",     label: "Listed" },
  SOLD:               { color: "var(--green)",   bg: "var(--green-bg)",        label: "Sold" },
  DELIVERY_SCHEDULED: { color: "#9b59b6",        bg: "rgba(155,89,182,0.15)", label: "Delivering" },
  PAID_OUT:           { color: "var(--green)",   bg: "var(--green-bg)",        label: "Paid Out" },
};

function fmt(cents: number) {
  if (!cents) return "$0.00";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function ListingDetail({ listing: initial }: { listing: Listing }) {
  const router = useRouter();
  const [listing, setListing] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  // Edit form state
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [priceDollars, setPriceDollars] = useState((listing.priceCents / 100).toFixed(2));
  const [category, setCategory] = useState(listing.category || "");
  const [condition, setCondition] = useState(listing.condition || "");

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(
    listing.marketplaces.length > 0 ? [...listing.marketplaces] : [...ALL_MARKETPLACES],
  );

  const sc = statusColors[listing.status] || statusColors.DRAFT;
  const canEdit = ["DRAFT", "NEEDS_REVIEW"].includes(listing.status);
  const canApprove = ["DRAFT", "NEEDS_REVIEW"].includes(listing.status) && listing.priceCents > 0 && listing.title !== "SMS Photo — Pending AI Review";
  const canReject = ["NEEDS_REVIEW", "APPROVED"].includes(listing.status);

  // ── Save edits ─────────────────────────────────────────
  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priceCents: Math.round(parseFloat(priceDollars || "0") * 100),
          category: category || null,
          condition: condition || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setListing((prev) => ({ ...prev, ...data.listing }));
        setEditing(false);
      } else {
        alert(data.errors?.join(", ") || "Save failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  // ── AI regenerate ──────────────────────────────────────
  async function handleRegenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setListing((prev) => ({
          ...prev,
          title: data.details.title,
          description: data.details.description,
          priceCents: data.details.priceCents,
          category: data.details.category,
          condition: data.details.condition,
          aiGenerated: true,
        }));
        setTitle(data.details.title);
        setDescription(data.details.description);
        setPriceDollars((data.details.priceCents / 100).toFixed(2));
        setCategory(data.details.category);
        setCondition(data.details.condition);
      } else {
        alert(data.errors?.join(", ") || "AI generation failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  // ── Approve & Post ─────────────────────────────────────
  async function handleConfirmApprove() {
    setLoading(true);
    setShowApproveModal(false);
    try {
      const res = await fetch(`/api/listings/${listing.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplaces: selectedMarketplaces }),
      });
      const data = await res.json();
      if (data.ok) {
        setListing((prev) => ({ ...prev, status: data.listing.status, marketplaces: data.listing.marketplaces }));
      } else {
        alert(data.errors?.join(", ") || "Approval failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  // ── Reject (back to DRAFT) ─────────────────────────────
  async function handleReject() {
    if (!confirm("Move this listing back to Draft?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      const data = await res.json();
      if (data.ok) {
        setListing((prev) => ({ ...prev, status: "DRAFT" }));
      } else {
        alert(data.errors?.join(", ") || "Reject failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  // ── Delete ─────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm("Permanently delete this listing?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        router.push("/listings");
      } else {
        alert(data.errors?.join(", ") || "Delete failed");
      }
    } catch {
      alert("Network error");
    }
    setLoading(false);
  }

  return (
    <>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="header" style={{ alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/listings"
            style={{
              color: "var(--text-muted)", textDecoration: "none", fontSize: 14,
              padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)",
            }}
          >
            &larr; Back
          </Link>
          <div>
            <h1 style={{ fontSize: 20 }}>{listing.title}</h1>
            <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: 6,
                fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color,
              }}>
                {sc.label}
              </span>
              {listing.aiGenerated && (
                <span style={{ fontSize: 11, color: "var(--blue)", background: "var(--blue-bg)", padding: "2px 8px", borderRadius: 4 }}>
                  AI Generated
                </span>
              )}
              {listing.source === "SMS" && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 4 }}>
                  via SMS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} style={btnSecondary}>
              Edit
            </button>
          )}
          {canEdit && listing.images.length > 0 && (
            <button onClick={handleRegenerate} disabled={loading} style={{ ...btnSecondary, color: "var(--blue)", borderColor: "var(--blue)" }}>
              {loading ? "..." : "AI Regen"}
            </button>
          )}
          {canReject && (
            <button onClick={handleReject} disabled={loading} style={{ ...btnSecondary, color: "var(--red)", borderColor: "var(--red)" }}>
              Reject
            </button>
          )}
          {canApprove && (
            <button onClick={() => setShowApproveModal(true)} disabled={loading} style={btnPrimary}>
              Approve & Post
            </button>
          )}
          {listing.status === "DRAFT" && (
            <button onClick={handleDelete} disabled={loading} style={{ ...btnSecondary, color: "var(--red)", borderColor: "var(--red)" }}>
              Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* ── Left: Images ────────────────────────────────── */}
        <div>
          {listing.images.length > 0 ? (
            <div className="card" style={{ overflow: "hidden" }}>
              {/* Main image */}
              <div style={{ height: 400, background: "var(--bg-hover)" }}>
                <img
                  src={listing.images[activeImage]}
                  alt={listing.title}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>

              {/* Thumbnail strip */}
              {listing.images.length > 1 && (
                <div style={{ display: "flex", gap: 4, padding: 8, overflowX: "auto" }}>
                  {listing.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Photo ${i + 1}`}
                      onClick={() => setActiveImage(i)}
                      style={{
                        width: 64, height: 64, objectFit: "cover", borderRadius: 6,
                        cursor: "pointer", flexShrink: 0,
                        border: i === activeImage ? "2px solid var(--accent)" : "2px solid transparent",
                        opacity: i === activeImage ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{
              height: 300, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-muted)", fontSize: 14,
            }}>
              No photos
            </div>
          )}

          {/* ── Status History ─────────────────────────────── */}
          {listing.events.length > 0 && (
            <div className="card" style={{ marginTop: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
                Activity
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {listing.events.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                        {ev.action.replace(/\./g, " → ")}
                      </span>
                      {ev.detail && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                          {ev.detail}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDate(ev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Details / Edit Form ──────────────────── */}
        <div>
          <div className="card" style={{ padding: 20 }}>
            {editing ? (
              /* ── Edit Mode ────────────────────────────────── */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Edit Listing
                </div>

                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Price ($)</label>
                    <input
                      type="number"
                      value={priceDollars}
                      onChange={(e) => setPriceDollars(e.target.value)}
                      step="0.01"
                      min="0"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Condition</label>
                    <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle}>
                      <option value="">Select...</option>
                      {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditing(false); setTitle(listing.title); setDescription(listing.description); setPriceDollars((listing.priceCents / 100).toFixed(2)); setCategory(listing.category || ""); setCondition(listing.condition || ""); }} style={btnSecondary}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View Mode ────────────────────────────────── */
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Price */}
                <div style={{ fontSize: 28, fontWeight: 700, color: listing.priceCents > 0 ? "var(--green)" : "var(--text-muted)" }}>
                  {fmt(listing.priceCents)}
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {listing.category && (
                    <div>
                      <div style={metaLabel}>Category</div>
                      <div style={metaValue}>{listing.category}</div>
                    </div>
                  )}
                  {listing.condition && (
                    <div>
                      <div style={metaLabel}>Condition</div>
                      <div style={metaValue}>{listing.condition}</div>
                    </div>
                  )}
                  {listing.client && (
                    <div>
                      <div style={metaLabel}>Client</div>
                      <div style={metaValue}>{listing.client.name}</div>
                    </div>
                  )}
                  <div>
                    <div style={metaLabel}>Created</div>
                    <div style={metaValue}>{fmtDate(listing.createdAt)}</div>
                  </div>
                  {listing.postedAt && (
                    <div>
                      <div style={metaLabel}>Posted</div>
                      <div style={metaValue}>{fmtDate(listing.postedAt)}</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div style={metaLabel}>Description</div>
                  <div style={{
                    fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6,
                    whiteSpace: "pre-wrap", marginTop: 4,
                  }}>
                    {listing.description || "No description yet."}
                  </div>
                </div>

                {/* Marketplaces */}
                {listing.marketplaces.length > 0 && (
                  <div>
                    <div style={metaLabel}>Marketplaces</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      {listing.marketplaces.map((mp) => (
                        <span key={mp} style={{
                          padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                          background: "var(--bg-hover)", color: "var(--text-secondary)",
                          textTransform: "capitalize",
                        }}>
                          {mp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer info (if sold) */}
                {listing.buyerName && (
                  <div>
                    <div style={metaLabel}>Buyer</div>
                    <div style={metaValue}>
                      {listing.buyerName}
                      {listing.buyerContact && <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{listing.buyerContact}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Approve Modal ───────────────────────────────── */}
      {showApproveModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            className="card"
            style={{ width: 440, maxWidth: "90vw", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 4, fontSize: 16, color: "var(--text-primary)" }}>
              Post listing to marketplaces?
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              {listing.title} — {fmt(listing.priceCents)}
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-secondary)" }}>
                Select marketplaces:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_MARKETPLACES.map((mp) => {
                  const selected = selectedMarketplaces.includes(mp);
                  return (
                    <button
                      key={mp}
                      onClick={() => setSelectedMarketplaces((prev) =>
                        prev.includes(mp) ? prev.filter((m) => m !== mp) : [...prev, mp]
                      )}
                      style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                        cursor: "pointer", textTransform: "capitalize",
                        border: selected ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: selected ? "var(--accent-glow)" : "var(--bg-hover)",
                        color: selected ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      {mp}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleConfirmApprove}
                disabled={selectedMarketplaces.length === 0}
                style={{
                  ...btnPrimary, flex: 1,
                  opacity: selectedMarketplaces.length === 0 ? 0.5 : 1,
                  cursor: selectedMarketplaces.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                Approve & Post ({selectedMarketplaces.length})
              </button>
              <button onClick={() => setShowApproveModal(false)} style={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Shared styles ──────────────────────────────────────── */
const labelStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg-hover)",
  color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box",
};

const metaLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: "uppercase",
  letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 2,
};

const metaValue: React.CSSProperties = {
  fontSize: 14, color: "var(--text-primary)",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: "var(--green)", color: "#fff", cursor: "pointer",
  fontSize: 14, fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg-card)",
  color: "var(--text-secondary)", cursor: "pointer",
  fontSize: 14, fontWeight: 500,
};
