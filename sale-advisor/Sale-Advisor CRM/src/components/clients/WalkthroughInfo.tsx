"use client";

type Props = {
  stage: string;
  walkthroughDate: string | null;
  walkthroughAddress: string | null;
  walkthroughNotes: string | null;
};

/**
 * Card component showing walkthrough scheduling info for a client.
 * Terminal A should add this to the client detail page.
 */
export default function WalkthroughInfo({ stage, walkthroughDate, walkthroughAddress, walkthroughNotes }: Props) {
  if (!walkthroughDate && !walkthroughAddress && !walkthroughNotes) {
    return null;
  }

  const isPast = walkthroughDate && new Date(walkthroughDate) < new Date();
  const isCompleted = stage === "WALKTHROUGH_COMPLETED" || stage === "LISTING_ACTIVE" || stage === "PARTIALLY_SOLD" || stage === "SOLD_PAID" || stage === "CLOSED";

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <h3 style={{ margin: 0 }}>Walkthrough</h3>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: isCompleted
              ? "rgba(34,197,94,0.15)"
              : isPast
                ? "rgba(239,68,68,0.15)"
                : "rgba(59,130,246,0.15)",
            color: isCompleted ? "#22c55e" : isPast ? "#ef4444" : "#3b82f6",
          }}
        >
          {isCompleted ? "Completed" : isPast ? "Overdue" : "Scheduled"}
        </span>
      </div>
      <div style={{ padding: 20 }}>
        {walkthroughDate && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>Date</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {new Date(walkthroughDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        {walkthroughAddress && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>Address</span>
            <span style={{ fontSize: 14 }}>{walkthroughAddress}</span>
          </div>
        )}
        {walkthroughNotes && (
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#888", minWidth: 80, fontSize: 13 }}>Notes</span>
            <span style={{ fontSize: 14, color: "#ccc" }}>{walkthroughNotes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
