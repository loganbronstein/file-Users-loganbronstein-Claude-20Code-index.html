"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type Lead = { id: string; name: string; phone: string | null; email: string | null; source: string };
type Client = { id: string; name: string; phone: string | null; email: string | null; stage: string };
type Listing = { id: string; title: string; status: string; priceCents: number };

type SearchResults = {
  leads: Lead[];
  clients: Client[];
  listings: Listing[];
};

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current === e.target) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function navigate(href: string) {
    onClose();
    router.push(href);
  }

  const hasResults = results && (results.leads.length > 0 || results.clients.length > 0 || results.listings.length > 0);
  const noResults = results && !hasResults && query.length >= 2;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        paddingTop: 120,
      }}
    >
      <div style={{
        width: "100%",
        maxWidth: 560,
        maxHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-secondary, #1a1a2e)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}>
        {/* Search input */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, color: "#888" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search leads, clients, listings…"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 16,
                color: "var(--text-primary, #fff)",
              }}
            />
            {loading && <span style={{ fontSize: 14, color: "#888" }}>…</span>}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                fontSize: 11,
                color: "#888",
                cursor: "pointer",
              }}
            >
              ESC
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {noResults && (
            <div style={{ padding: 32, textAlign: "center", color: "#888", fontSize: 14 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {hasResults && (
            <>
              {results.leads.length > 0 && (
                <ResultSection title="Leads">
                  {results.leads.map((lead) => (
                    <ResultRow
                      key={lead.id}
                      icon="🎯"
                      title={lead.name}
                      subtitle={lead.phone || lead.email || lead.source}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    />
                  ))}
                </ResultSection>
              )}

              {results.clients.length > 0 && (
                <ResultSection title="Clients">
                  {results.clients.map((client) => (
                    <ResultRow
                      key={client.id}
                      icon="👥"
                      title={client.name}
                      subtitle={client.phone || client.email || client.stage}
                      onClick={() => navigate(`/clients/${client.id}`)}
                    />
                  ))}
                </ResultSection>
              )}

              {results.listings.length > 0 && (
                <ResultSection title="Listings">
                  {results.listings.map((listing) => (
                    <ResultRow
                      key={listing.id}
                      icon="📦"
                      title={listing.title}
                      subtitle={`${listing.status} · $${(listing.priceCents / 100).toFixed(2)}`}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                    />
                  ))}
                </ResultSection>
              )}
            </>
          )}

          {!results && query.length < 2 && (
            <div style={{ padding: 32, textAlign: "center", color: "#666", fontSize: 14 }}>
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        padding: "8px 20px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        color: "#888",
        letterSpacing: 0.5,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ icon, title, subtitle, onClick }: { icon: string; title: string; subtitle: string | null; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
      </div>
      <span style={{ fontSize: 12, color: "#555" }}>→</span>
    </div>
  );
}
