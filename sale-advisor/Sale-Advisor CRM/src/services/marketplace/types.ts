export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  category: string | null;
  condition: string | null;
  images: string[];
}

export interface PostResult {
  marketplace: string;
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface MarketplaceContent {
  marketplace: string;
  formattedTitle: string;
  formattedDescription: string;
  priceDollars: string;
  tips: string;
}

/** Temporary type matching the MarketplacePost Prisma model (until Terminal A applies schema) */
export interface MarketplacePostRecord {
  id: string;
  listingId: string;
  marketplace: string;
  status: string;
  externalUrl: string | null;
  externalId: string | null;
  formattedTitle: string | null;
  formattedDescription: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
