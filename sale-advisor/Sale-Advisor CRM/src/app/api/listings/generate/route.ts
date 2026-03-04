import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { generateListing } from "@/lib/ai-listing";
import { validationError } from "@/lib/validation";

/**
 * POST /api/listings/generate — Generate listing details from images using AI
 * Body: { listingId } or { imageUrls: string[] }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();

  let imageUrls: string[] = [];
  let listingId: string | null = null;

  if (body.listingId) {
    listingId = body.listingId;
    const listing = await prisma.listing.findUnique({ where: { id: listingId! } });
    if (!listing) {
      return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
    }
    imageUrls = listing.images;
  } else if (Array.isArray(body.imageUrls) && body.imageUrls.length > 0) {
    imageUrls = body.imageUrls.filter((u: unknown) => typeof u === "string");
  }

  if (imageUrls.length === 0) {
    return validationError(["No images provided — need either listingId or imageUrls"]);
  }

  try {
    const details = await generateListing(imageUrls);

    // If we have a listingId, update the listing
    if (listingId) {
      const existing = await prisma.listing.findUnique({ where: { id: listingId } });
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          title: details.title,
          description: details.description,
          priceCents: details.priceCents,
          category: details.category,
          condition: details.condition,
          aiGenerated: true,
          status: existing?.status === "DRAFT" ? "NEEDS_REVIEW" : undefined,
        },
      });
    }

    return NextResponse.json({ ok: true, details, listingId });
  } catch (err) {
    console.error("[listings/generate] AI generation failed:", err);
    return NextResponse.json(
      { ok: false, errors: [err instanceof Error ? err.message : "AI generation failed"] },
      { status: 500 },
    );
  }
}
