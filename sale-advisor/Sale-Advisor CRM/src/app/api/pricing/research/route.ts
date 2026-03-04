import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

// ── Pricing reference data ─────────────────────────────────

type PriceRange = { low: number; high: number };

const CATEGORY_PRICES: Record<string, Record<string, PriceRange>> = {
  furniture: {
    "sofa/couch": { low: 150, high: 800 },
    "dining table": { low: 100, high: 600 },
    dresser: { low: 75, high: 400 },
    "bed frame": { low: 100, high: 500 },
    desk: { low: 50, high: 350 },
    bookshelf: { low: 30, high: 200 },
    "coffee table": { low: 40, high: 250 },
    nightstand: { low: 25, high: 150 },
    "tv stand": { low: 30, high: 200 },
    "accent chair": { low: 50, high: 300 },
  },
  electronics: {
    'tv (55"+)': { low: 150, high: 500 },
    'tv (under 55")': { low: 50, high: 250 },
    "gaming console": { low: 100, high: 400 },
    laptop: { low: 100, high: 600 },
    "desktop computer": { low: 75, high: 400 },
    "speakers/sound system": { low: 30, high: 300 },
    "smart home devices": { low: 15, high: 100 },
  },
  appliances: {
    washer: { low: 150, high: 400 },
    dryer: { low: 150, high: 400 },
    refrigerator: { low: 200, high: 600 },
    dishwasher: { low: 100, high: 300 },
    microwave: { low: 20, high: 80 },
  },
  "art/antiques": {
    "prints/posters": { low: 10, high: 100 },
    "original paintings": { low: 50, high: 2000 },
    sculptures: { low: 30, high: 500 },
    "vintage furniture": { low: 150, high: 1200 },
    collectibles: { low: 20, high: 500 },
  },
  "sporting goods": {
    "exercise equipment": { low: 50, high: 500 },
    bikes: { low: 50, high: 400 },
    "golf clubs": { low: 50, high: 300 },
  },
};

// Condition multipliers (applied to high end of range)
const CONDITION_MULTIPLIER: Record<string, number> = {
  like_new: 0.85,
  good: 0.65,
  fair: 0.45,
  worn: 0.25,
};

// Category tips
const CATEGORY_TIPS: Record<string, string[]> = {
  furniture: [
    "Furniture sells best with delivery included in price — Sale Advisor handles this via Lakeshore Hauling.",
    "Brand name furniture (Crate & Barrel, Pottery Barn, West Elm, RH) commands 30-50% premium.",
    "Photos from multiple angles significantly increase sale price.",
    "Measurements in the listing reduce buyer questions and speed up sales.",
  ],
  electronics: [
    "Electronics depreciate fast — check the model year and adjust accordingly.",
    "Include the original box and accessories for 15-20% price boost.",
    "Smart TVs and recent-model gaming consoles hold value better.",
    "Always factory reset devices before listing.",
  ],
  appliances: [
    "Brand (Samsung, LG, Whirlpool) and age are the primary pricing factors.",
    "Working condition is non-negotiable — non-working appliances are essentially worthless in resale.",
    "Stainless steel finishes command a small premium over white/black.",
    "Energy-efficient models sell faster and at higher prices.",
  ],
  "art/antiques": [
    "Research the artist/maker — even minor names can have niche followings.",
    "Age + condition + provenance drive value for antiques.",
    "Vintage furniture (20-100 years) can command 1.5-3x standard furniture prices.",
    "Get clear photos of signatures, stamps, or maker's marks.",
  ],
  "sporting goods": [
    "Season matters — list bikes in spring, ski equipment in fall.",
    "Brand matters enormously for golf clubs and exercise equipment.",
    "Pelotons and similar connected equipment: check current subscription requirements.",
  ],
};

// Marketplace-specific notes
const MARKETPLACE_NOTES: Record<string, { name: string; note: string }> = {
  facebook: { name: "Facebook Marketplace", note: "Best for furniture and local pickup items. Tends to sell 10-15% below eBay." },
  ebay: { name: "eBay", note: "Best for collectibles, electronics, and brand-name items. Higher prices but shipping complexity." },
  craigslist: { name: "Craigslist", note: "Good for large items and appliances. Buyers expect lower prices." },
  offerup: { name: "OfferUp", note: "Growing platform. Good for electronics and sporting goods. Similar pricing to FB Marketplace." },
};

function findBestMatch(title: string, category: string): PriceRange | null {
  const catPrices = CATEGORY_PRICES[category];
  if (!catPrices) return null;

  const titleLower = title.toLowerCase();

  // Exact match first
  for (const [item, range] of Object.entries(catPrices)) {
    if (titleLower.includes(item) || item.includes(titleLower)) {
      return range;
    }
  }

  // Partial word match
  const titleWords = titleLower.split(/\s+/);
  for (const [item, range] of Object.entries(catPrices)) {
    const itemWords = item.split(/\s+/);
    if (titleWords.some((w) => itemWords.some((iw) => iw.includes(w) || w.includes(iw)))) {
      return range;
    }
  }

  // Return category midpoint if no item match
  const ranges = Object.values(catPrices);
  const avgLow = Math.round(ranges.reduce((s, r) => s + r.low, 0) / ranges.length);
  const avgHigh = Math.round(ranges.reduce((s, r) => s + r.high, 0) / ranges.length);
  return { low: avgLow, high: avgHigh };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.category || !body?.condition) {
    return NextResponse.json(
      { ok: false, errors: ["title, category, and condition are required"] },
      { status: 400 },
    );
  }

  const { title, category, condition } = body as {
    title: string;
    category: string;
    condition: string;
  };

  const baseRange = findBestMatch(title, category);
  if (!baseRange) {
    return NextResponse.json(
      { ok: false, errors: [`Unknown category: ${category}`] },
      { status: 400 },
    );
  }

  const multiplier = CONDITION_MULTIPLIER[condition] ?? 0.65;

  // Calculate suggested prices
  const suggestedHigh = Math.round(baseRange.high * multiplier);
  const suggestedLow = Math.round(baseRange.low * multiplier);
  const suggestedMid = Math.round((suggestedLow + suggestedHigh) / 2);

  // Marketplace recommendations
  const marketplaces = Object.entries(MARKETPLACE_NOTES).map(([key, info]) => {
    let adjustment = 0;
    if (key === "ebay" && (category === "electronics" || category === "art/antiques")) adjustment = 10;
    if (key === "craigslist") adjustment = -10;
    if (key === "facebook" && category === "furniture") adjustment = 5;

    const mpPrice = Math.round(suggestedMid * (1 + adjustment / 100));
    return { marketplace: key, name: info.name, suggestedPrice: mpPrice, note: info.note };
  });

  const tips = CATEGORY_TIPS[category] || ["Take clear, well-lit photos from multiple angles.", "Be honest about condition — it builds trust and reduces returns."];

  return NextResponse.json({
    ok: true,
    title,
    category,
    condition,
    suggestedLow,
    suggestedMid,
    suggestedHigh,
    baseRange,
    multiplier,
    marketplaces,
    tips,
  });
}
