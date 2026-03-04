import type { MarketplaceListing, PostResult } from "./types";

/**
 * OfferUp adapter.
 * Currently logs the payload — will be replaced with actual API integration.
 */
export async function postListing(listing: MarketplaceListing): Promise<PostResult> {
  console.log("[marketplace:offerup] Would post listing:", {
    id: listing.id,
    title: listing.title,
    price: `$${(listing.priceCents / 100).toFixed(2)}`,
    images: listing.images.length,
  });

  return {
    marketplace: "offerup",
    success: true,
    externalId: `ou-placeholder-${listing.id}`,
  };
}
