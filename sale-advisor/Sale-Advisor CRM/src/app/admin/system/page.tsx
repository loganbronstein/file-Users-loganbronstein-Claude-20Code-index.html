import { getSystemEvents } from "@/lib/system-queries";
import SystemMonitorView from "./SystemMonitorView";

export const dynamic = "force-dynamic";

export default async function SystemMonitorPage() {
  const events = await getSystemEvents();

  // Serialize dates for client component
  const serializedEvents = JSON.parse(JSON.stringify(events));

  return (
    <div>
      <div className="page-header">
        <h1>System Monitor</h1>
        <p className="subtitle">Service health and recent system events</p>
      </div>
      <SystemMonitorView events={serializedEvents} />
    </div>
  );
}
