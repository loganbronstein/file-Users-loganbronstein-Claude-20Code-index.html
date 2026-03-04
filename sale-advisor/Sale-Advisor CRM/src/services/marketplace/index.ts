import type { MarketplaceListing, MarketplaceContent } from "./types";
import { generateContent as genFacebook } from "./facebookMarketplace";
import { generateContent as genEbay } from "./ebay";
import { generateContent as genCraigslist } from "./craigslist";
import { generateContent as genOfferup } from "./offerup";

const generators: Record<string, (listing: MarketplaceListing) => MarketplaceContent> = {
  facebook: genFacebook,
  ebay: genEbay,
  craigslist: genCraigslist,
  offerup: genOfferup,
};

export const VALID_MARKETPLACES = ["facebook", "ebay", "craigslist", "offerup"] as const;

export const MARKETPLACE_LABELS: Record<string, string> = {
  facebook: "Facebook Marketplace",
  ebay: "eBay",
  craigslist: "Craigslist",
  offerup: "OfferUp",
};

/**
 * Generate marketplace-ready content for each selected marketplace.
 * Returns formatted title, description, price, and posting tips per marketplace.
 */
export function generateMarketplaceContent(
  listing: MarketplaceListing,
  marketplaces: string[],
): MarketplaceContent[] {
  return marketplaces.map((mp) => {
    const gen = generators[mp];
    if (!gen) {
      return {
        marketplace: mp,
        formattedTitle: listing.title,
        formattedDescription: listing.description,
        priceDollars: `$${(listing.priceCents / 100).toFixed(2)}`,
        tips: `Unknown marketplace: ${mp}`,
      };
    }
    return gen(listing);
  });
}

export type { MarketplaceListing, MarketplaceContent, MarketplacePostRecord } from "./types";
