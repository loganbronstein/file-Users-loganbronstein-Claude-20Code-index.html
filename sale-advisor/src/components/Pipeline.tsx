const columns = [
  {
    title: "New Leads",
    count: "8",
    countBg: "var(--blue-bg)",
    countColor: "var(--blue)",
    cards: [
      {
        name: "Maria Gonzalez",
        detail: "Lincoln Park — furniture, electronics",
        tags: [{ label: "Facebook", cls: "tag-fb" }],
      },
      {
        name: "James Chen",
        detail: "Wicker Park — designer clothes, bags",
        tags: [{ label: "Instagram", cls: "tag-ig" }],
      },
      {
        name: "Carol Williams",
        detail: "Evanston — entire basement cleanout",
        tags: [{ label: "Nextdoor", cls: "tag-nd" }],
      },
    ],
  },
  {
    title: "Booked",
    count: "5",
    countBg: "var(--yellow-bg)",
    countColor: "var(--yellow)",
    cards: [
      {
        name: "Tom & Lisa Park",
        detail: "Logan Square — downsizing, 20+ items",
        tags: [{ label: "Referral", cls: "tag-ref" }],
      },
      {
        name: "David Okafor",
        detail: "Lakeview — gym equipment, electronics",
        tags: [{ label: "Google", cls: "tag-goog" }],
      },
    ],
  },
  {
    title: "Listing",
    count: "12",
    countBg: "var(--green-bg)",
    countColor: "var(--green)",
    cards: [
      {
        name: "Sarah Mitchell",
        detail: "Gold Coast — antiques, art, furniture",
        value: "$4,200 est. value",
        tags: [{ label: "Lakeshore", cls: "tag-lakeshore" }],
      },
      {
        name: "Mike Reeves",
        detail: "Pilsen — vintage vinyl, speakers",
        value: "$890 est. value",
        tags: [{ label: "TikTok", cls: "tag-tiktok" }],
      },
    ],
  },
  {
    title: "Sold & Paid",
    count: "22",
    countBg: "var(--green-bg)",
    countColor: "var(--green)",
    cards: [
      {
        name: "Rachel Kim",
        detail: "Hyde Park — mid-century furniture",
        value: "Paid $1,847 ✓",
        tags: [{ label: "Marketplace", cls: "tag-fb" }],
      },
      {
        name: "Anthony Russo",
        detail: "Lincoln Park — bikes, tools, grill",
        value: "Paid $620 ✓",
        tags: [{ label: "Referral", cls: "tag-ref" }],
      },
    ],
  },
];

export default function Pipeline() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Client Pipeline</div>
        <div className="card-action">View All →</div>
      </div>
      <div className="pipeline">
        {columns.map((col) => (
          <div className="pipeline-col" key={col.title}>
            <div className="pipeline-header">
              <span className="pipeline-title">{col.title}</span>
              <span
                className="pipeline-count"
                style={{ background: col.countBg, color: col.countColor }}
              >
                {col.count}
              </span>
            </div>
            {col.cards.map((card) => (
              <div className="pipeline-card" key={card.name}>
                <div className="pipeline-card-name">{card.name}</div>
                <div className="pipeline-card-detail">{card.detail}</div>
                {"value" in card && card.value && (
                  <div
                    className="pipeline-card-detail"
                    style={{ color: "var(--green)", fontWeight: 600 }}
                  >
                    {card.value}
                  </div>
                )}
                <div className="pipeline-card-tags">
                  {card.tags.map((tag) => (
                    <span className={`tag ${tag.cls}`} key={tag.label}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
