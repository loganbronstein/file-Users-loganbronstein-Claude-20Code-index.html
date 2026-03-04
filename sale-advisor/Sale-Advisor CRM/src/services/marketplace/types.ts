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
