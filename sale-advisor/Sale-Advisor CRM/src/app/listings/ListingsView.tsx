"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  createdAt: string;
  client: { id: string; name: string } | null;
};

const statusColors: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT:              { color: "var(--yellow)",  bg: "var(--yellow-bg)",          label: "Draft" },
  NEEDS_REVIEW:       { color: "#e67e22",        bg: "rgba(230,126,34,0.15)",    label: "Review" },
  APPROVED:           { color: "var(--blue)",    bg: "var(--blue-bg)",            label: "Approved" },
  POSTING:            { color: "var(--blue)",    bg: "var(--blue-bg)",            label: "Posting" },
  POSTED:             { color: "var(--accent)",  bg: "var(--accent-glow)",        label: "Listed" },
  SOLD:               { color: "var(--green)",   bg: "var(--green-bg)",           label: "Sold" },
  DELIVERY_SCHEDULED: { color: "#9b59b6",        bg: "rgba(155,89,182,0.15)",    label: "Delivering" },
  PAID_OUT:           { color: "var(--green)",   bg: "var(--green-bg)",           label: "Paid Out" },
};

const tabs = ["ALL", "DRAFTS", "LISTED", "SOLD"] as const;

function matchesTab(status: string, tab: (typeof tabs)[number]): boolean {
  switch (tab) {
    case "ALL":    return true;
    case "DRAFTS": return ["DRAFT", "NEEDS_REVIEW", "APPROVED"].includes(status);
    case "LISTED": return ["POSTING", "POSTED"].includes(status);
    case "SOLD":   return ["SOLD", "DELIVERY_SCHEDULED", "PAID_OUT"].includes(status);
    default:       return true;
  }
}

function fmt(cents: number) {
  if (!cents) return "—";
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
  const [listings] = useState(initial);
  const router = useRouter();

  const validInitial = initialTab && tabs.includes(initialTab as (typeof tabs)[number])
    ? initialTab as (typeof tabs)[number]
    : "ALL";
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>(validInitial);

  const filtered = listings.filter((l) => matchesTab(l.status, activeTab));

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
          No {activeTab === "ALL" ? "" : activeTab.toLowerCase() + " "}listings yet.
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={thStyle}></th>
                <th style={{ ...thStyle, textAlign: "left" }}>Title</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Category</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => {
                const sc = statusColors[listing.status] || statusColors.DRAFT;
                return (
                  <tr
                    key={listing.id}
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: "10px 12px", width: 56 }}>
                      {listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt=""
                          style={{
                            width: 44, height: 44, borderRadius: 8,
                            objectFit: "cover", display: "block",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: 8,
                          background: "var(--bg-hover)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "var(--text-muted)", fontSize: 11,
                        }}>
                          No img
                        </div>
                      )}
                    </td>

                    {/* Title + Client */}
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                        {listing.title}
                      </div>
                      {listing.client && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {listing.client.name}
                        </div>
                      )}
                    </td>

                    {/* Price */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: listing.priceCents > 0 ? "var(--green)" : "var(--text-muted)",
                      }}>
                        {fmt(listing.priceCents)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "4px 10px", borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                        background: sc.bg, color: sc.color,
                      }}>
                        {sc.label}
                      </span>
                    </td>

                    {/* Source */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {listing.source === "SMS" ? "SMS" : listing.source === "UPLOAD" ? "Upload" : "Manual"}
                        {listing.aiGenerated && (
                          <span style={{ color: "var(--blue)", marginLeft: 4 }}>AI</span>
                        )}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {listing.category || "—"}
                      </span>
                    </td>

                    {/* Created */}
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {timeAgo(listing.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  color: "var(--text-muted)",
  letterSpacing: "0.05em",
  textAlign: "center",
};
