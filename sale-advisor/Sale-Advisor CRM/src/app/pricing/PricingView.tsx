"use client";

import { useState, useEffect } from "react";

type MarketplaceRec = {
  marketplace: string;
  name: string;
  suggestedPrice: number;
  note: string;
};

type PricingResult = {
  ok: boolean;
  title: string;
  category: string;
  condition: string;
  suggestedLow: number;
  suggestedMid: number;
  suggestedHigh: number;
  baseRange: { low: number; high: number };
  multiplier: number;
  marketplaces: MarketplaceRec[];
  tips: string[];
  errors?: string[];
};

type RecentSearch = {
  title: string;
  category: string;
  condition: string;
  suggestedMid: number;
  timestamp: number;
};

const CATEGORIES = [
  { value: "furniture", label: "Furniture" },
  { value: "electronics", label: "Electronics" },
  { value: "appliances", label: "Appliances" },
  { value: "art/antiques", label: "Art / Antiques" },
  { value: "sporting goods", label: "Sporting Goods" },
];

const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Worn" },
];

const CONDITION_DESC: Record<string, string> = {
  like_new: "85% of retail — minimal use, no damage",
  good: "65% of retail — normal use, minor wear",
  fair: "45% of retail — visible wear, fully functional",
  worn: "25% of retail — significant wear or cosmetic damage",
};

function formatPrice(cents: number): string {
  return `$${cents.toLocaleString("en-US")}`;
}

export default function PricingView() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("furniture");
  const [condition, setCondition] = useState("good");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sa-pricing-recent");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveRecentSearch(r: PricingResult) {
    const entry: RecentSearch = {
      title: r.title,
      category: r.category,
      condition: r.condition,
      suggestedMid: r.suggestedMid,
      timestamp: Date.now(),
    };
    const updated = [entry, ...recentSearches.filter((s) => s.title !== r.title)].slice(0, 10);
    setRecentSearches(updated);
    try { localStorage.setItem("sa-pricing-recent", JSON.stringify(updated)); } catch { /* ignore */ }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/pricing/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category, condition }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.errors?.[0] || "Research failed");
      } else {
        setResult(data);
        saveRecentSearch(data);
      }
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(price: number) {
    navigator.clipboard.writeText(String(price));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadRecentSearch(s: RecentSearch) {
    setTitle(s.title);
    setCategory(s.category);
    setCondition(s.condition);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* Left column — Search + Recent */}
      <div>
        {/* Search form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Research Item Price</h3>
          </div>
          <form onSubmit={handleSearch} style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>
                Item Title
              </label>
              <input
                className="form-input"
                type="text"
                placeholder='e.g., "Mid-century modern dresser" or "Samsung 65" TV"'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>
                  Category
                </label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#ccc" }}>
                  Condition
                </label>
                <select className="form-input" value={condition} onChange={(e) => setCondition(e.target.value)} style={{ width: "100%" }}>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
              {CONDITION_DESC[condition]}
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading || !title.trim()} style={{ width: "100%" }}>
              {loading ? "Researching…" : "Research Price"}
            </button>

            {error && <div style={{ marginTop: 12, color: "#ef4444", fontSize: 14 }}>{error}</div>}
          </form>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ margin: 0 }}>Recent Searches</h3>
            </div>
            <div>
              {recentSearches.map((s, i) => (
                <div
                  key={i}
                  onClick={() => loadRecentSearch(s)}
                  style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      {CATEGORIES.find((c) => c.value === s.category)?.label} · {CONDITIONS.find((c) => c.value === s.condition)?.label}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: "#22c55e", fontSize: 15 }}>
                    {formatPrice(s.suggestedMid)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column — Results */}
      <div>
        {result ? (
          <>
            {/* Price recommendation */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Price Recommendation</h3>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Suggested Price</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "#22c55e" }}>
                    {formatPrice(result.suggestedMid)}
                  </div>
                  <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
                    Range: {formatPrice(result.suggestedLow)} – {formatPrice(result.suggestedHigh)}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Quick Sale", price: result.suggestedLow, color: "#3b82f6" },
                    { label: "Fair Price", price: result.suggestedMid, color: "#22c55e" },
                    { label: "Top Dollar", price: result.suggestedHigh, color: "#eab308" },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      onClick={() => handleCopy(tier.price)}
                      style={{
                        textAlign: "center",
                        padding: 12,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{tier.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: tier.color }}>{formatPrice(tier.price)}</div>
                      <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>Click to copy</div>
                    </div>
                  ))}
                </div>

                {copied && (
                  <div style={{ textAlign: "center", color: "#22c55e", fontSize: 13, marginBottom: 12 }}>
                    Price copied to clipboard!
                  </div>
                )}

                <div style={{ fontSize: 12, color: "#666" }}>
                  Base range: {formatPrice(result.baseRange.low)} – {formatPrice(result.baseRange.high)} · Condition multiplier: {(result.multiplier * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Marketplace recommendations */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 style={{ margin: 0 }}>By Marketplace</h3>
              </div>
              <div>
                {result.marketplaces.map((mp) => (
                  <div
                    key={mp.marketplace}
                    style={{
                      padding: "14px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{mp.name}</div>
                      <div style={{ fontSize: 12, color: "#888", maxWidth: 300 }}>{mp.note}</div>
                    </div>
                    <div
                      onClick={() => handleCopy(mp.suggestedPrice)}
                      style={{ fontWeight: 600, fontSize: 16, color: "#22c55e", cursor: "pointer" }}
                      title="Click to copy"
                    >
                      {formatPrice(mp.suggestedPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0 }}>Pricing Tips</h3>
              </div>
              <div style={{ padding: 20 }}>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 14, color: "#ccc" }}>
                    <span style={{ color: "#eab308" }}>•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💲</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Search for an item to get pricing</div>
            <div style={{ fontSize: 14 }}>Enter an item name, category, and condition to see competitive price recommendations across all marketplaces.</div>
          </div>
        )}
      </div>
    </div>
  );
}
