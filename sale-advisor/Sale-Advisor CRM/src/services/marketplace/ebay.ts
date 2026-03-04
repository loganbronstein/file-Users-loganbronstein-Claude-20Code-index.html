import type { MarketplaceListing, MarketplaceContent } from "./types";

const PRICE_FMT = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

/**
 * Generate eBay-optimized content.
 * eBay has an API but requires seller account setup — this produces copy-ready text for manual posting.
 */
export function generateContent(listing: MarketplaceListing): MarketplaceContent {
  const price = PRICE_FMT(listing.priceCents);
  const condition = listing.condition || "Pre-Owned";

  // eBay titles are max 80 chars, keywords matter a lot for search
  const title = `${listing.title} - ${condition}`.slice(0, 80);

  const description = [
    `<h2>${listing.title}</h2>`,
    "",
    listing.description,
    "",
    `<b>Condition:</b> ${condition}`,
    listing.category ? `<b>Category:</b> ${listing.category}` : null,
    `<b>Price:</b> ${price}`,
    "",
    "<b>Shipping & Delivery</b>",
    "Local pickup available in Chicago, IL.",
    "Delivery available through Lakeshore Hauling — contact seller for details.",
    "",
    "<i>Listed by Sale Advisor | saleadvisor.com</i>",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    marketplace: "ebay",
    formattedTitle: title,
    formattedDescription: description,
    priceDollars: price,
    tips: `eBay tips: Use "Buy It Now" at ${price}. Set condition to "${condition}". Add item specifics (brand, size, color). Offer local pickup in Chicago, IL 60614. Use all ${listing.images.length} photos.`,
  };
}
