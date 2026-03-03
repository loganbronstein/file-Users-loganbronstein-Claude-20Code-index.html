interface SourceCount {
  source: string;
  count: number;
}

const sourceConfig: Record<string, { icon: string; name: string; color: string; iconBg: string }> = {
  FACEBOOK: { icon: "📘", name: "Facebook / Meta", color: "var(--blue)", iconBg: "var(--blue-bg)" },
  NEXTDOOR: { icon: "🏡", name: "Nextdoor", color: "var(--green)", iconBg: "var(--green-bg)" },
  GOOGLE: { icon: "🔍", name: "Google Ads", color: "var(--red)", iconBg: "var(--red-bg)" },
  REFERRAL: { icon: "🤝", name: "Referrals", color: "var(--purple)", iconBg: "var(--purple-bg)" },
  INSTAGRAM: { icon: "📸", name: "Instagram", color: "var(--orange)", iconBg: "var(--orange-bg)" },
  LAKESHORE: { icon: "🚚", name: "Lakeshore Hauling", color: "var(--yellow)", iconBg: "var(--yellow-bg)" },
  TIKTOK: { icon: "🎵", name: "TikTok", color: "var(--pink)", iconBg: "var(--pink-bg)" },
  WEBSITE: { icon: "🌐", name: "Website", color: "var(--accent)", iconBg: "var(--accent-glow)" },
  OTHER: { icon: "📌", name: "Other", color: "var(--text-muted)", iconBg: "var(--bg-hover)" },
};

export default function LeadSources({ sources }: { sources: SourceCount[] }) {
  const max = Math.max(...sources.map((s) => s.count), 1);

  if (sources.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Lead Sources</div>
        </div>
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No leads yet
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Lead Sources</div>
        <div className="card-action">Details →</div>
      </div>
      <div className="sources-grid">
        {sources.map((s) => {
          const cfg = sourceConfig[s.source] || sourceConfig.OTHER;
          const pct = Math.round((s.count / max) * 100);
          return (
            <div className="source-item" key={s.source}>
              <div className="source-icon" style={{ background: cfg.iconBg }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="source-name">{cfg.name}</div>
                <div className="source-count">{s.count} lead{s.count !== 1 ? "s" : ""}</div>
                <div className="source-bar">
                  <div className="source-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
