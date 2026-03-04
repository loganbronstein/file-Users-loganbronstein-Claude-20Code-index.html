import type { MarketplaceListing, PostResult } from "./types";

/**
 * Craigslist adapter.
 * Currently logs the payload — will be replaced with actual posting integration.
 */
export async function postListing(listing: MarketplaceListing): Promise<PostResult> {
  console.log("[marketplace:craigslist] Would post listing:", {
    id: listing.id,
    title: listing.title,
    price: `$${(listing.priceCents / 100).toFixed(2)}`,
    images: listing.images.length,
  });

  return {
    marketplace: "craigslist",
    success: true,
    externalId: `cl-placeholder-${listing.id}`,
  };
}
