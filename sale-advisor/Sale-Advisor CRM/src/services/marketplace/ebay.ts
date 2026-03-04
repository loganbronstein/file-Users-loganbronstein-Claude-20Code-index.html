import type { MarketplaceListing, PostResult } from "./types";

/**
 * eBay adapter.
 * Currently logs the payload — will be replaced with actual eBay API integration.
 */
export async function postListing(listing: MarketplaceListing): Promise<PostResult> {
  console.log("[marketplace:ebay] Would post listing:", {
    id: listing.id,
    title: listing.title,
    price: `$${(listing.priceCents / 100).toFixed(2)}`,
    images: listing.images.length,
  });

  return {
    marketplace: "ebay",
    success: true,
    externalId: `ebay-placeholder-${listing.id}`,
  };
}
