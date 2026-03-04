"use client";

import { useState } from "react";

interface MarkSoldModalProps {
  listingId: string;
  listingTitle: string;
  priceCents: number;
  marketplaces: string[];
  clientId: string | null;
  onClose: () => void;
  onSold: (data: {
    status: string;
    soldAt: string;
    buyerName: string;
    buyerContact: string | null;
  }) => void;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  facebook: "Facebook Marketplace",
  ebay: "eBay",
  craigslist: "Craigslist",
  offerup: "OfferUp",
};

export default function MarkSoldModal({
  listingId,
  listingTitle,
  priceCents,
  marketplaces,
  clientId,
  onClose,
  onSold,
}: MarkSoldModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [priceDollars, setPriceDollars] = useState((priceCents / 100).toFixed(2));
  const [marketplace, setMarketplace] = useState(marketplaces[0] || "facebook");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const soldPriceCents = Math.round(parseFloat(priceDollars || "0") * 100);
    if (!buyerName.trim()) {
      setError("Buyer name is required");
      return;
    }
    if (soldPriceCents <= 0) {
      setError("Sale price must be greater than $0");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerContact: buyerContact.trim() || null,
          soldPriceCents,
          marketplace,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onSold({
          status: "SOLD",
          soldAt: data.listing.soldAt,
          buyerName: buyerName.trim(),
          buyerContact: buyerContact.trim() || null,
        });
        onClose();
      } else {
        setError(data.errors?.join(", ") || "Failed to mark as sold");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 480, maxWidth: "90vw", padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 4, fontSize: 16, color: "var(--text-primary)" }}>
          Mark as Sold
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {listingTitle}
        </p>

        {error && (
          <div style={{
            padding: "8px 12px", borderRadius: 6, marginBottom: 12,
            background: "rgba(231,76,60,0.1)", color: "var(--red)", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Buyer Name *</label>
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="John Smith"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div>
            <label style={labelStyle}>Buyer Contact (phone or email)</label>
            <input
              value={buyerContact}
              onChange={(e) => setBuyerContact(e.target.value)}
              placeholder="(312) 555-1234 or john@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Sale Price ($) *</label>
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
              <label style={labelStyle}>Sold On *</label>
              <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)} style={inputStyle}>
                {marketplaces.map((mp) => (
                  <option key={mp} value={mp}>{MARKETPLACE_LABELS[mp] || mp}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "10px 20px", borderRadius: 8, border: "none",
                background: "var(--green)", color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving..." : "Confirm Sale"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-card)",
                color: "var(--text-secondary)", cursor: "pointer",
                fontSize: 14, fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Quick actions after sale */}
        <div style={{
          marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)",
          fontSize: 12, color: "var(--text-muted)",
        }}>
          After confirming, you can schedule a delivery and create a payout from the listing page.
          {clientId && (
            <span> View client details for address info.</span>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg-hover)",
  color: "var(--text-primary)", fontSize: 14, boxSizing: "border-box",
};
