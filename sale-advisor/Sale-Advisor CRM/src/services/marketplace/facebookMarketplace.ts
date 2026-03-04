import type { MarketplaceListing, PostResult } from "./types";

/**
 * Facebook Marketplace adapter.
 * Currently logs the payload — will be replaced with actual API integration.
 */
export async function postListing(listing: MarketplaceListing): Promise<PostResult> {
  console.log("[marketplace:facebook] Would post listing:", {
    id: listing.id,
    title: listing.title,
    price: `$${(listing.priceCents / 100).toFixed(2)}`,
    images: listing.images.length,
  });

  return {
    marketplace: "facebook",
    success: true,
    externalId: `fb-placeholder-${listing.id}`,
  };
}
