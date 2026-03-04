"use client";

import Link from "next/link";

interface WalkthroughClient {
  id: string;
  name: string;
  walkthroughDate: string | null;
  walkthroughAddress: string | null;
  lead: { phone: string | null } | null;
}

export default function TodayWalkthroughs({ walkthroughs }: { walkthroughs: WalkthroughClient[] }) {
  if (walkthroughs.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <div className="card-title">Today&apos;s Walkthroughs ({walkthroughs.length})</div>
        <Link href="/walkthroughs" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>View All</Link>
      </div>
      <div style={{ padding: 8 }}>
        {walkthroughs.map((wt) => (
          <Link key={wt.id} href={`/clients/${wt.id}`} style={{ textDecoration: "none" }}>
            <div className="message-item" style={{ alignItems: "center" }}>
              <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}>
                {wt.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div className="message-name">{wt.name}</div>
                <div className="message-preview">
                  {wt.walkthroughDate
                    ? new Date(wt.walkthroughDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : "No time"}{" "}
                  · {wt.walkthroughAddress || "No address"}
                  {wt.lead?.phone && ` · ${wt.lead.phone}`}
                </div>
              </div>
              <span className="ad-status" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>Today</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
