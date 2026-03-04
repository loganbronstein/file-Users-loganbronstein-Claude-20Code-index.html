import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { validationError } from "@/lib/validation";
import { postToMarketplaces } from "@/services/marketplace";
import { logStatusTransition, logListingEvent } from "@/lib/listing-events";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/approve — Approve a listing and trigger marketplace posting
 *
 * Body (optional):
 *   { marketplaces?: string[] }   — which marketplaces to post to
 *
 * Transitions: DRAFT/NEEDS_REVIEW → APPROVED → POSTING → POSTED
 * Stores per-marketplace results in a ListingEvent metadata JSON.
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

  // Step 2: POSTING
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

  // Step 3: Post to marketplace adapters
  const results = await postToMarketplaces(
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

  // Step 4: POSTED if all succeeded
  const allSuccess = results.every((r) => r.success);
  let finalStatus = "POSTING";

  if (allSuccess) {
    await prisma.listing.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date() },
    });
    finalStatus = "POSTED";
    await logStatusTransition({
      listingId: id,
      fromStatus: "POSTING",
      toStatus: "POSTED",
      title: listing.title,
      clientId: listing.clientId,
    });
  }

  // Log marketplace results with per-marketplace detail
  await logListingEvent({
    listingId: id,
    action: "marketplace.posted",
    detail: `Posted to: ${selectedMarketplaces.join(", ")}`,
    metadata: {
      marketplaces: selectedMarketplaces,
      results: results.map((r) => ({
        marketplace: r.marketplace,
        success: r.success,
        externalId: r.externalId || null,
        error: r.error || null,
      })),
    },
  });

  return NextResponse.json({
    ok: true,
    listing: { ...listing, status: finalStatus, marketplaces: selectedMarketplaces },
    marketplaceResults: results,
  });
}
