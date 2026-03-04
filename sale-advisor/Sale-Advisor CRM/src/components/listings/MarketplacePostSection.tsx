"use client";

import { useState } from "react";

interface MarketplacePost {
  id: string;
  marketplace: string;
  status: string;
  externalUrl: string | null;
  formattedTitle: string | null;
  formattedDescription: string | null;
  postedAt: string | null;
  createdAt: string;
}

interface MarketplacePostSectionProps {
  listingId: string;
  posts: MarketplacePost[];
  onPostUpdated: (post: MarketplacePost) => void;
  onAllPosted: () => void;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  facebook: "Facebook Marketplace",
  ebay: "eBay",
  craigslist: "Craigslist",
  offerup: "OfferUp",
};

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: "var(--yellow)", bg: "var(--yellow-bg)", label: "Pending" },
  POSTED: { color: "var(--green)", bg: "var(--green-bg)", label: "Posted" },
  FAILED: { color: "var(--red)", bg: "rgba(231,76,60,0.15)", label: "Failed" },
  REMOVED: { color: "var(--text-muted)", bg: "var(--bg-hover)", label: "Removed" },
};

export default function MarketplacePostSection({
  listingId,
  posts,
  onPostUpdated,
  onAllPosted,
}: MarketplacePostSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pendingCount = posts.filter((p) => p.status === "PENDING").length;
  const postedCount = posts.filter((p) => p.status === "POSTED").length;

  async function handleMarkPosted(post: MarketplacePost) {
    const url = urlInputs[post.id]?.trim();
    if (!url) return;

    setLoadingId(post.id);
    try {
      const res = await fetch(`/api/listings/${listingId}/marketplace-posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "POSTED", externalUrl: url }),
      });
      const data = await res.json();
      if (data.ok) {
        onPostUpdated(data.post);
        setExpandedId(null);
        setUrlInputs((prev) => ({ ...prev, [post.id]: "" }));

        // Check if all are now posted
        const updatedPending = posts.filter(
          (p) => p.id !== post.id && p.status === "PENDING",
        ).length;
        if (updatedPending === 0) {
          onAllPosted();
        }
      }
    } catch {
      // silently fail
    }
    setLoadingId(null);
  }

  async function handleCopyContent(post: MarketplacePost) {
    const text = [
      post.formattedTitle || "",
      "",
      post.formattedDescription || "",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="card" style={{ padding: 16, marginTop: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          Marketplace Posts
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {postedCount}/{posts.length} posted
          {pendingCount > 0 && (
            <span style={{ color: "var(--yellow)", marginLeft: 6 }}>
              ({pendingCount} pending)
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, borderRadius: 2, background: "var(--bg-hover)", marginBottom: 16,
      }}>
        <div style={{
          height: "100%", borderRadius: 2, background: "var(--green)",
          width: `${posts.length > 0 ? (postedCount / posts.length) * 100 : 0}%`,
          transition: "width 0.3s ease",
        }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts.map((post) => {
          const ss = STATUS_STYLES[post.status] || STATUS_STYLES.PENDING;
          const isExpanded = expandedId === post.id;

          return (
            <div key={post.id} style={{
              border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden",
            }}>
              {/* Post row */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 4,
                    fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color,
                  }}>
                    {ss.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {MARKETPLACE_LABELS[post.marketplace] || post.marketplace}
                  </span>
                  {post.externalUrl && (
                    <a
                      href={post.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none" }}
                    >
                      View listing
                    </a>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  {post.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleCopyContent(post)}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 12,
                          border: "1px solid var(--border)", background: "var(--bg-card)",
                          color: copiedId === post.id ? "var(--green)" : "var(--text-secondary)",
                          cursor: "pointer", fontWeight: 500,
                        }}
                      >
                        {copiedId === post.id ? "Copied!" : "Copy Listing"}
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 12,
                          border: "none", background: "var(--green)",
                          color: "#fff", cursor: "pointer", fontWeight: 500,
                        }}
                      >
                        Mark Posted
                      </button>
                    </>
                  )}
                  {post.postedAt && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(post.postedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded: URL input for marking as posted */}
              {isExpanded && post.status === "PENDING" && (
                <div style={{
                  padding: "10px 14px", borderTop: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  display: "flex", gap: 8,
                }}>
                  <input
                    placeholder={`Paste ${MARKETPLACE_LABELS[post.marketplace] || post.marketplace} URL...`}
                    value={urlInputs[post.id] || ""}
                    onChange={(e) => setUrlInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: 6,
                      border: "1px solid var(--border)", background: "var(--bg-card)",
                      color: "var(--text-primary)", fontSize: 13,
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleMarkPosted(post);
                      if (e.key === "Escape") setExpandedId(null);
                    }}
                  />
                  <button
                    onClick={() => handleMarkPosted(post)}
                    disabled={!urlInputs[post.id]?.trim() || loadingId === post.id}
                    style={{
                      padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      border: "none", background: "var(--green)", color: "#fff",
                      cursor: urlInputs[post.id]?.trim() ? "pointer" : "not-allowed",
                      opacity: urlInputs[post.id]?.trim() ? 1 : 0.5,
                    }}
                  >
                    {loadingId === post.id ? "..." : "Confirm"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
