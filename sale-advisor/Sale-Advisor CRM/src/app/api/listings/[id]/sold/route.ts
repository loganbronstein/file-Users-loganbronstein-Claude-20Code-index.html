import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { validationError } from "@/lib/validation";
import { logStatusTransition, logListingEvent } from "@/lib/listing-events";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/listings/[id]/sold — Mark a listing as sold
 *
 * Body: {
 *   buyerName: string,
 *   buyerContact?: string,
 *   soldPriceCents: number,
 *   marketplace: string
 * }
 *
 * Transitions listing POSTED → SOLD.
 * Updates inventory item status to SOLD + soldPriceCents.
 * Creates ActivityLog entry.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { inventoryItem: true },
  });

  if (!listing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  if (listing.status !== "POSTED") {
    return validationError([`Cannot mark as sold — listing is ${listing.status}, expected POSTED`]);
  }

  const body = await req.json();

  // Validate required fields
  if (!body.buyerName || typeof body.buyerName !== "string" || body.buyerName.trim().length === 0) {
    return validationError(["Buyer name is required"]);
  }

  if (!body.soldPriceCents || typeof body.soldPriceCents !== "number" || body.soldPriceCents <= 0) {
    return validationError(["Sale price must be a positive number"]);
  }

  if (body.soldPriceCents > 10000000) { // $100,000 cap
    return validationError(["Sale price seems too high — please double check"]);
  }

  if (!body.marketplace || typeof body.marketplace !== "string") {
    return validationError(["Marketplace is required"]);
  }

  // Update listing to SOLD
  // Note: soldPriceCents and soldMarketplace fields pending schema update by Terminal A.
  // Sale price/marketplace are stored in ListingEvent metadata and InventoryItem for now.
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      status: "SOLD",
      soldAt: new Date(),
      buyerName: body.buyerName.trim(),
      buyerContact: body.buyerContact?.trim() || null,
    },
  });

  // Update inventory item if linked
  if (listing.inventoryItemId) {
    await prisma.inventoryItem.update({
      where: { id: listing.inventoryItemId },
      data: {
        status: "SOLD",
        soldPriceCents: body.soldPriceCents,
      },
    });
  }

  // Log status transition
  await logStatusTransition({
    listingId: id,
    fromStatus: "POSTED",
    toStatus: "SOLD",
    title: listing.title,
    clientId: listing.clientId,
  });

  // Log sale detail
  await logListingEvent({
    listingId: id,
    action: "sale.completed",
    detail: `Sold to ${body.buyerName.trim()} on ${body.marketplace} for $${(body.soldPriceCents / 100).toFixed(2)}`,
    metadata: {
      buyerName: body.buyerName.trim(),
      buyerContact: body.buyerContact?.trim() || null,
      soldPriceCents: body.soldPriceCents,
      marketplace: body.marketplace,
    },
  });

  return NextResponse.json({
    ok: true,
    listing: updated,
  });
}
