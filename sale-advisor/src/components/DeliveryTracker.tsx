const deliveries = [
  {
    icon: "🚛", iconBg: "var(--yellow-bg)",
    route: "Mid-Century Dresser + Bookshelf → Jake Morrison",
    details: "Sarah Mitchell's items · Gold Coast → Andersonville · 2-man crew",
    status: "In Transit", statusCls: "in-transit",
    time: "ETA 2:30 PM", progress: 65, progressColor: "var(--yellow)",
  },
  {
    icon: "📦", iconBg: "var(--purple-bg)",
    route: "Pickup: 12 items → Tom & Lisa Park",
    details: "Logan Square · Walkthrough completed · Ready for pickup",
    status: "Pickup", statusCls: "pickup",
    time: "Tomorrow 10 AM", progress: 20, progressColor: "var(--purple)",
  },
  {
    icon: "🗓️", iconBg: "var(--blue-bg)",
    route: "Vintage Speakers + Turntable → Olivia Sanders",
    details: "Mike Reeves' items · Pilsen → Wicker Park · 1-man crew",
    status: "Scheduled", statusCls: "scheduled",
    time: "Mar 3 · 1:00 PM", progress: 10, progressColor: "var(--blue)",
  },
  {
    icon: "🗓️", iconBg: "var(--blue-bg)",
    route: "Leather Sectional + Coffee Table → Marcus Webb",
    details: "Rachel Kim's items · Hyde Park → South Loop · 2-man crew",
    status: "Scheduled", statusCls: "scheduled",
    time: "Mar 4 · 11:00 AM", progress: 10, progressColor: "var(--blue)",
  },
  {
    icon: "✅", iconBg: "var(--green-bg)",
    route: "Peloton Bike → Daniel Torres",
    details: "David Okafor's items · Lakeview → Lincoln Park · 1-man crew",
    status: "Delivered ✓", statusCls: "delivered",
    time: "Today · 11:15 AM", progress: 100, progressColor: "var(--green)",
  },
];

export default function DeliveryTracker() {
  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <div className="card-header">
        <div className="card-title">🚚 Lakeshore Hauling — Delivery Tracker</div>
        <div className="card-action">Schedule Delivery →</div>
      </div>
      <div className="delivery-grid">
        {deliveries.map((d) => (
          <div className="delivery-item" key={d.route}>
            <div className="delivery-icon" style={{ background: d.iconBg }}>{d.icon}</div>
            <div className="delivery-info">
              <div className="delivery-route">{d.route}</div>
              <div className="delivery-details">{d.details}</div>
              <div className="delivery-progress-bar">
                <div className="delivery-progress-fill" style={{ width: `${d.progress}%`, background: d.progressColor }} />
              </div>
            </div>
            <div className="delivery-right">
              <div className={`delivery-status ${d.statusCls}`}>{d.status}</div>
              <div className="delivery-time">{d.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
