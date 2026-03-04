import type { MarketplaceListing, PostResult } from "./types";
import { postListing as postFacebook } from "./facebookMarketplace";
import { postListing as postEbay } from "./ebay";
import { postListing as postCraigslist } from "./craigslist";
import { postListing as postOfferup } from "./offerup";

const adapters: Record<string, (listing: MarketplaceListing) => Promise<PostResult>> = {
  facebook: postFacebook,
  ebay: postEbay,
  craigslist: postCraigslist,
  offerup: postOfferup,
};

export const VALID_MARKETPLACES = ["facebook", "ebay", "craigslist", "offerup"] as const;

/**
 * Post a listing to the specified marketplaces.
 * Returns results for each marketplace attempted.
 */
export async function postToMarketplaces(
  listing: MarketplaceListing,
  marketplaces: string[],
): Promise<PostResult[]> {
  const results: PostResult[] = [];

  for (const mp of marketplaces) {
    const adapter = adapters[mp];
    if (!adapter) {
      results.push({ marketplace: mp, success: false, error: `Unknown marketplace: ${mp}` });
      continue;
    }

    try {
      const result = await adapter(listing);
      results.push(result);
    } catch (err) {
      results.push({
        marketplace: mp,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return results;
}

export type { MarketplaceListing, PostResult };
