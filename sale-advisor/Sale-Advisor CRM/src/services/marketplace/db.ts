/**
 * Marketplace post database helpers.
 *
 * MarketplacePost model is pending schema application by Terminal A.
 * These helpers use dynamic access so the code compiles before the schema exists.
 * Once Terminal A applies the schema, replace (prisma as any) with direct prisma.marketplacePost calls.
 */

import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mpModel = () => (prisma as any).marketplacePost;

export async function createMarketplacePost(data: {
  listingId: string;
  marketplace: string;
  status: string;
  formattedTitle: string | null;
  formattedDescription: string | null;
}) {
  return mpModel().create({ data });
}

export async function findMarketplacePosts(listingId: string) {
  return mpModel().findMany({
    where: { listingId },
    orderBy: { createdAt: "asc" },
  });
}

export async function findMarketplacePost(id: string, listingId: string) {
  return mpModel().findFirst({
    where: { id, listingId },
  });
}

export async function updateMarketplacePost(id: string, data: Record<string, unknown>) {
  return mpModel().update({
    where: { id },
    data,
  });
}

export async function allMarketplacePostsPosted(listingId: string): Promise<boolean> {
  const posts = await mpModel().findMany({
    where: { listingId },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return posts.length > 0 && posts.every((p: any) => p.status === "POSTED");
}
