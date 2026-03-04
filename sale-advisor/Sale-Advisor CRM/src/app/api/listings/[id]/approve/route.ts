import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { validationError } from "@/lib/validation";
import { generateMarketplaceContent } from "@/services/marketplace";
import { createMarketplacePost } from "@/services/marketplace/db";
import { logStatusTransition, logListingEvent } from "@/lib/listing-events";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/approve — Approve a listing and create marketplace post records
 *
 * Body (optional):
 *   { marketplaces?: string[] }
 *
 * Flow: DRAFT/NEEDS_REVIEW → APPROVED → POSTING
 * Creates MarketplacePost records with pre-formatted content for each marketplace.
 * Listing stays in POSTING until all marketplace posts are manually marked as POSTED.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  if (listing.status !== "DRAFT" && listing.status !== "NEEDS_REVIEW") {
    return validationError([`Cannot approve — listing is ${listing.status}, expected DRAFT or NEEDS_REVIEW`]);
  }

  if (!listing.title || listing.title === "SMS Photo — Pending AI Review") {
    return validationError(["Listing must have a title before approval"]);
  }

  if (listing.priceCents <= 0) {
    return validationError(["Listing must have a price before approval"]);
  }

  // Accept marketplace selection from request body
  let selectedMarketplaces: string[];
  try {
    const body = await req.json().catch(() => ({}));
    selectedMarketplaces = Array.isArray(body.marketplaces) && body.marketplaces.length > 0
      ? body.marketplaces
      : listing.marketplaces.length > 0
        ? listing.marketplaces
        : ["facebook", "ebay", "craigslist", "offerup"];
  } catch {
    selectedMarketplaces = listing.marketplaces.length > 0
      ? listing.marketplaces
      : ["facebook", "ebay", "craigslist", "offerup"];
  }

  const prevStatus = listing.status;

  // Step 1: APPROVED
  await prisma.listing.update({
    where: { id },
    data: { status: "APPROVED", marketplaces: selectedMarketplaces },
  });
  await logStatusTransition({
    listingId: id,
    fromStatus: prevStatus,
    toStatus: "APPROVED",
    title: listing.title,
    clientId: listing.clientId,
  });

  // Step 2: POSTING — listing waits for manual marketplace posting
  await prisma.listing.update({
    where: { id },
    data: { status: "POSTING" },
  });
  await logStatusTransition({
    listingId: id,
    fromStatus: "APPROVED",
    toStatus: "POSTING",
    title: listing.title,
    clientId: listing.clientId,
  });

  // Step 3: Generate marketplace-ready content
  const contentList = generateMarketplaceContent(
    {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      priceCents: listing.priceCents,
      category: listing.category,
      condition: listing.condition,
      images: listing.images,
    },
    selectedMarketplaces,
  );

  // Step 4: Create MarketplacePost records
  const marketplacePosts = await Promise.all(
    contentList.map((content) =>
      createMarketplacePost({
        listingId: id,
        marketplace: content.marketplace,
        status: "PENDING",
        formattedTitle: content.formattedTitle,
        formattedDescription: content.formattedDescription,
      }),
    ),
  );

  // Log the approve event
  await logListingEvent({
    listingId: id,
    action: "marketplace.approved",
    detail: `Approved for: ${selectedMarketplaces.join(", ")}. Ready for manual posting.`,
    metadata: {
      marketplaces: selectedMarketplaces,
      postIds: marketplacePosts.map((p: { id: string }) => p.id),
    },
  });

  return NextResponse.json({
    ok: true,
    listing: { ...listing, status: "POSTING", marketplaces: selectedMarketplaces },
    marketplacePosts,
  });
}
