import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import {
  pickAllowed,
  validationError,
  canTransition,
  LISTING_PATCH_FIELDS,
  LISTING_TRANSITIONS,
} from "@/lib/validation";
import { logListingAudit, logStatusTransition } from "@/lib/listing-events";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/[id]
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      inventoryItem: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  return NextResponse.json({ ok: true, listing });
}

/**
 * PATCH /api/listings/[id] — Edit listing fields
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  const body = await req.json();
  const data = pickAllowed(body, [...LISTING_PATCH_FIELDS]);

  // Enforce status transitions
  if (data.status && typeof data.status === "string" && data.status !== existing.status) {
    if (!canTransition(LISTING_TRANSITIONS, existing.status, data.status)) {
      return validationError([`Cannot transition from ${existing.status} to ${data.status}`]);
    }
  }

  // Validate priceCents if provided
  if (data.priceCents !== undefined) {
    const price = Number(data.priceCents);
    if (isNaN(price) || price < 0) {
      return validationError(["priceCents must be a non-negative number"]);
    }
    data.priceCents = Math.round(price);
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: data as Record<string, unknown>,
  });

  // Audit log field changes
  const auditPromises: Promise<void>[] = [];
  for (const key of Object.keys(data)) {
    const oldVal = String((existing as Record<string, unknown>)[key] ?? "");
    const newVal = String((data as Record<string, unknown>)[key] ?? "");
    if (oldVal !== newVal) {
      auditPromises.push(
        logListingAudit({
          listingId: id,
          field: key,
          oldValue: oldVal.slice(0, 500),
          newValue: newVal.slice(0, 500),
          changedBy: typeof auth === "object" && "user" in auth ? auth.user.email : "system",
        }),
      );
    }
  }

  // Status transition logging
  if (data.status && typeof data.status === "string" && data.status !== existing.status) {
    auditPromises.push(
      logStatusTransition({
        listingId: id,
        fromStatus: existing.status,
        toStatus: data.status,
        title: listing.title,
        clientId: listing.clientId,
      }),
    );
  }

  // Fire and forget — don't block response
  Promise.all(auditPromises).catch((err) => {
    console.error("[listings/patch] audit logging error:", err);
  });

  return NextResponse.json({ ok: true, listing });
}

/**
 * DELETE /api/listings/[id] — Delete a listing (only DRAFT)
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return validationError(["Only DRAFT listings can be deleted"]);
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
