import type { MarketplaceListing, MarketplaceContent } from "./types";

const PRICE_FMT = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

/**
 * Generate Facebook Marketplace-optimized content.
 * Facebook has no public listing API — this produces copy-ready text for manual posting.
 */
export function generateContent(listing: MarketplaceListing): MarketplaceContent {
  const price = PRICE_FMT(listing.priceCents);
  const condition = listing.condition ? ` — ${listing.condition} condition` : "";
  const category = listing.category ? ` | ${listing.category}` : "";

  const title = `${listing.title}${condition}`.slice(0, 100);

  const description = [
    listing.description,
    "",
    `Price: ${price}`,
    listing.condition ? `Condition: ${listing.condition}` : null,
    listing.category ? `Category: ${listing.category}` : null,
    "",
    "Delivery available through Lakeshore Hauling — message for details!",
    "",
    "Listed by Sale Advisor | saleadvisor.com",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    marketplace: "facebook",
    formattedTitle: title,
    formattedDescription: description,
    priceDollars: price,
    tips: `FB tips: Use all ${Math.min(listing.images.length, 10)} photos. Set price to ${price}. Choose "${listing.category || "Home Goods"}" category. Mark as "Available". Enable shipping if possible.`,
  };
}
