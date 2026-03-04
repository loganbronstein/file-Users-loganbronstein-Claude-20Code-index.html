"use client";

import { useState, useEffect } from "react";
import GlobalSearch from "./GlobalSearch";

/**
 * Search trigger button + keyboard shortcut (Cmd+K).
 * Renders the GlobalSearch modal when activated.
 * Terminal A should add this to the sidebar or layout.
 */
export default function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8,
          color: "#888",
          cursor: "pointer",
          fontSize: 13,
          marginBottom: 16,
        }}
      >
        <span>🔍</span>
        <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
        <span style={{
          fontSize: 11,
          background: "rgba(255,255,255,0.08)",
          padding: "2px 6px",
          borderRadius: 4,
        }}>
          ⌘K
        </span>
      </button>
      {open && <GlobalSearch onClose={() => setOpen(false)} />}
    </>
  );
}
