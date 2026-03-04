import type { MarketplaceListing, MarketplaceContent } from "./types";

const PRICE_FMT = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

/**
 * Generate Craigslist-optimized content.
 * Craigslist has no API at all — this produces copy-ready plain-text content.
 */
export function generateContent(listing: MarketplaceListing): MarketplaceContent {
  const price = PRICE_FMT(listing.priceCents);
  const condition = listing.condition || "Good";

  const title = `${listing.title} - ${price} (Chicago)`.slice(0, 70);

  const description = [
    listing.title,
    "=".repeat(listing.title.length),
    "",
    listing.description,
    "",
    `Price: ${price} (firm)`,
    `Condition: ${condition}`,
    listing.category ? `Category: ${listing.category}` : null,
    "",
    "Delivery available through Lakeshore Hauling — message for a quote.",
    "Cash, Venmo, or Zelle accepted.",
    "",
    "Listed by Sale Advisor | saleadvisor.com",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    marketplace: "craigslist",
    formattedTitle: title,
    formattedDescription: description,
    priceDollars: price,
    tips: `CL tips: Post in "for sale > ${listing.category?.toLowerCase() || "general"}". Set price to ${price}. Add all ${listing.images.length} photos. Select "by dealer" if posting from business account. Chicago area.`,
  };
}
