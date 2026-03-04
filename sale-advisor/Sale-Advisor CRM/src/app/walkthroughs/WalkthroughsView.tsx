"use client";

import { useState } from "react";
import Link from "next/link";
import ScheduleWalkthroughModal from "@/components/ScheduleWalkthroughModal";
import CompleteWalkthroughForm from "@/components/CompleteWalkthroughForm";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  neighborhood: string | null;
  itemsDescription: string | null;
}

interface WalkthroughClient {
  id: string;
  name: string;
  neighborhood: string | null;
  stage: string;
  walkthroughDate: string | null;
  walkthroughAddress: string | null;
  walkthroughNotes: string | null;
  lead: { phone: string | null; email: string | null } | null;
  _count: { inventory: number };
}

interface Props {
  bookedLeads: Lead[];
  walkthroughClients: WalkthroughClient[];
}

export default function WalkthroughsView({ bookedLeads, walkthroughClients }: Props) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const scheduled = walkthroughClients.filter((c) => c.stage === "WALKTHROUGH_SCHEDULED");
  const completed = walkthroughClients.filter((c) => c.stage === "WALKTHROUGH_COMPLETED");

  const todayWalkthroughs = scheduled.filter((c) => {
    if (!c.walkthroughDate) return false;
    const d = new Date(c.walkthroughDate);
    return d >= today && d <= todayEnd;
  });

  const upcoming = scheduled.filter((c) => {
    if (!c.walkthroughDate) return true; // no date = show in upcoming
    return new Date(c.walkthroughDate) > todayEnd;
  });

  const pastUnscheduled = scheduled.filter((c) => {
    if (!c.walkthroughDate) return false;
    return new Date(c.walkthroughDate) < today;
  });

  const total = bookedLeads.length + walkthroughClients.length;

  function formatDateTime(dt: string | null) {
    if (!dt) return "No date set";
    const d = new Date(dt);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) +
      " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <>
      <div className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>Walkthroughs</h1>
          <div className="header-subtitle">{total} total across all stages</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSchedule(true)}>
          + Schedule Walkthrough
        </button>
      </div>

      {showSchedule && <ScheduleWalkthroughModal onClose={() => setShowSchedule(false)} />}

      {/* Today's Walkthroughs */}
      {todayWalkthroughs.length > 0 && (
        <div className="card" style={{ marginBottom: 24, border: "1px solid var(--accent)30" }}>
          <div className="card-header">
            <div className="card-title" style={{ color: "var(--accent)" }}>Today ({todayWalkthroughs.length})</div>
          </div>
          <div style={{ padding: 8 }}>
            {todayWalkthroughs.map((client) => (
              <div key={client.id}>
                <div className="message-item" style={{ alignItems: "center" }}>
                  <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}>
                    {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">
                      <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>{client.name}</Link>
                    </div>
                    <div className="message-preview">
                      {formatDateTime(client.walkthroughDate)} · {client.walkthroughAddress || "No address"}
                      {client.lead?.phone && ` · ${client.lead.phone}`}
                    </div>
                  </div>
                  {completingId !== client.id ? (
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setCompletingId(client.id)}>
                      Complete
                    </button>
                  ) : null}
                </div>
                {completingId === client.id && (
                  <CompleteWalkthroughForm clientId={client.id} clientName={client.name} onDone={() => setCompletingId(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booked leads — not yet scheduled */}
      {bookedLeads.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Booked Leads — Needs Scheduling ({bookedLeads.length})</div>
          </div>
          <div style={{ padding: 8 }}>
            {bookedLeads.map((lead) => (
              <div key={lead.id} className="message-item" style={{ alignItems: "center" }}>
                <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--yellow), var(--orange))" }}>
                  {lead.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="message-name">
                    <Link href={`/leads/${lead.id}`} style={{ textDecoration: "none", color: "inherit" }}>{lead.name}</Link>
                  </div>
                  <div className="message-preview">
                    {lead.neighborhood || "No location"} · {lead.itemsDescription || "No items listed"} · {lead.phone || lead.email || "No contact"}
                  </div>
                </div>
                <span className="ad-status" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}>Booked</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue (past date, still scheduled) */}
      {pastUnscheduled.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title" style={{ color: "var(--red)" }}>Overdue ({pastUnscheduled.length})</div>
          </div>
          <div style={{ padding: 8 }}>
            {pastUnscheduled.map((client) => (
              <div key={client.id}>
                <div className="message-item" style={{ alignItems: "center" }}>
                  <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--red), var(--orange))" }}>
                    {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">
                      <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>{client.name}</Link>
                    </div>
                    <div className="message-preview">
                      {formatDateTime(client.walkthroughDate)} · {client.walkthroughAddress || "No address"}
                    </div>
                  </div>
                  {completingId !== client.id ? (
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setCompletingId(client.id)}>
                      Complete
                    </button>
                  ) : null}
                </div>
                {completingId === client.id && (
                  <CompleteWalkthroughForm clientId={client.id} clientName={client.name} onDone={() => setCompletingId(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Upcoming ({upcoming.length})</div>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No upcoming walkthroughs
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {upcoming.map((client) => (
              <div key={client.id}>
                <div className="message-item" style={{ alignItems: "center" }}>
                  <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--blue), var(--accent))" }}>
                    {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="message-name">
                      <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>{client.name}</Link>
                    </div>
                    <div className="message-preview">
                      {formatDateTime(client.walkthroughDate)} · {client.walkthroughAddress || "No address"}
                      {client.lead?.phone && ` · ${client.lead.phone}`}
                    </div>
                  </div>
                  {completingId !== client.id ? (
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => setCompletingId(client.id)}>
                      Complete
                    </button>
                  ) : null}
                </div>
                {completingId === client.id && (
                  <CompleteWalkthroughForm clientId={client.id} clientName={client.name} onDone={() => setCompletingId(null)} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Completed ({completed.length})</div>
        </div>
        {completed.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No completed walkthroughs yet
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {completed.map((client) => (
              <div key={client.id} className="message-item" style={{ alignItems: "center" }}>
                <div className="message-avatar" style={{ background: "linear-gradient(135deg, var(--green), var(--accent))" }}>
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="message-name">
                    <Link href={`/clients/${client.id}`} style={{ textDecoration: "none", color: "inherit" }}>{client.name}</Link>
                  </div>
                  <div className="message-preview">
                    {client._count.inventory} item(s) cataloged · {client.walkthroughAddress || "No address"}
                    {client.walkthroughDate && ` · ${formatDateTime(client.walkthroughDate)}`}
                  </div>
                </div>
                <span className="ad-status" style={{ background: "var(--green-bg)", color: "var(--green)" }}>Completed</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
