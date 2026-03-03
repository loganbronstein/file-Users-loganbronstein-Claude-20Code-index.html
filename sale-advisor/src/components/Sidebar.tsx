"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = {
  Main: [
    { icon: "📊", label: "Dashboard", href: "/", badge: null },
    { icon: "👥", label: "Clients", href: "/clients", badge: "47" },
    { icon: "💬", label: "Messages", href: "/messages", badge: "12" },
    { icon: "📦", label: "Listings", href: "/listings", badge: null },
  ],
  Marketing: [
    { icon: "📢", label: "Ad Campaigns", href: "/campaigns", badge: null },
    { icon: "📈", label: "Analytics", href: "/analytics", badge: null },
    { icon: "🔗", label: "Lead Sources", href: "/sources", badge: null },
  ],
  Operations: [
    { icon: "📅", label: "Walkthroughs", href: "/walkthroughs", badge: null },
    { icon: "🚚", label: "Deliveries", href: "/deliveries", badge: null },
    { icon: "💰", label: "Payouts", href: "/payouts", badge: null },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">SA</div>
        <div>
          <div className="logo-text">
            Sale <span>Advisor</span>
          </div>
        </div>
      </div>

      <nav>
        {Object.entries(navItems).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${pathname === item.href ? " active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">LB</div>
          <div>
            <div className="user-name">Logan Bronstein</div>
            <div className="user-role">Founder &amp; CEO</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
