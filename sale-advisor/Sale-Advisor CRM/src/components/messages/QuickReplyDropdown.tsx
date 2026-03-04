"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_REPLIES = [
  "Hi! Thanks for reaching out to Sale Advisor. When would be a good time to schedule an in-home estimate?",
  "Great, we'll have someone out to take a look. What's the best address?",
  "Your items have been picked up and we're working on getting them listed!",
  "Good news — your item sold! We'll be scheduling delivery and your payout soon.",
  "Your payout has been sent. Thanks for choosing Sale Advisor!",
];

export default function QuickReplyDropdown({ onSelect }: { onSelect: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen(!open)}
        style={{ fontSize: 12, padding: "6px 10px", whiteSpace: "nowrap" }}
        title="Quick replies"
      >
        Templates
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "100%", right: 0, marginBottom: 4,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          width: 360, maxHeight: 300, overflowY: "auto", zIndex: 100,
        }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            Quick reply templates
          </div>
          {QUICK_REPLIES.map((text, i) => (
            <div
              key={i}
              onClick={() => { onSelect(text); setOpen(false); }}
              style={{
                padding: "10px 12px", fontSize: 12, cursor: "pointer",
                borderBottom: i < QUICK_REPLIES.length - 1 ? "1px solid var(--border)" : "none",
                color: "var(--text-primary)", lineHeight: 1.4,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
