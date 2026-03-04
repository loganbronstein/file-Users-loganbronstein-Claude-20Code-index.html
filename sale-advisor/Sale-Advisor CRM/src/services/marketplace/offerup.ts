import type { MarketplaceListing, MarketplaceContent } from "./types";

const PRICE_FMT = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;

/**
 * Generate OfferUp-optimized content.
 * OfferUp has no public API — this produces copy-ready text for manual posting.
 */
export function generateContent(listing: MarketplaceListing): MarketplaceContent {
  const price = PRICE_FMT(listing.priceCents);
  const condition = listing.condition || "Good";

  // OfferUp titles should be short and punchy
  const title = listing.title.slice(0, 50);

  const description = [
    listing.description,
    "",
    `Condition: ${condition}`,
    listing.category ? `Category: ${listing.category}` : null,
    "",
    "Delivery available — message for details!",
    "",
    "Sale Advisor | saleadvisor.com",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    marketplace: "offerup",
    formattedTitle: title,
    formattedDescription: description,
    priceDollars: price,
    tips: `OfferUp tips: Set price to ${price}. Mark condition as "${condition}". Add up to 10 photos. Enable "willing to ship" if applicable. Location: Chicago, IL.`,
  };
}
