"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = {
  Main: [
    { icon: "📊", label: "Dashboard", href: "/" },
    { icon: "🎯", label: "Leads", href: "/leads" },
    { icon: "👥", label: "Clients", href: "/clients" },
    { icon: "💬", label: "Messages", href: "/messages" },
    { icon: "📦", label: "Listings", href: "/listings" },
    { icon: "✅", label: "Draft Approvals", href: "/listings?tab=REVIEW" },
  ],
  Marketing: [
    { icon: "📢", label: "Ad Campaigns", href: "/campaigns" },
    { icon: "📈", label: "Analytics", href: "/analytics" },
    { icon: "🔗", label: "Lead Sources", href: "/sources" },
  ],
  Operations: [
    { icon: "📅", label: "Walkthroughs", href: "/walkthroughs" },
    { icon: "🚚", label: "Deliveries", href: "/deliveries" },
    { icon: "💰", label: "Payouts", href: "/payouts" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="sidebar">
      <div className="logo">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div className="logo-icon">SA</div>
          <div>
            <div className="logo-text">
              Sale <span>Advisor</span>
            </div>
          </div>
        </Link>
      </div>

      <nav>
        {Object.entries(navItems).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive(item.href) ? " active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
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
