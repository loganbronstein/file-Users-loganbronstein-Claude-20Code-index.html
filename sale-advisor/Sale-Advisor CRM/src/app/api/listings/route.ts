import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { checkRequired, validationError } from "@/lib/validation";
import type { ListingStatus } from "@/generated/prisma/enums";

/**
 * GET /api/listings — List all listings, optionally filtered by status
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const status = req.nextUrl.searchParams.get("status") as ListingStatus | null;
  const where = status ? { status } : undefined;

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, listings });
}

/**
 * POST /api/listings — Create a listing manually
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const missing = checkRequired(body, ["title"]);
  if (missing.length > 0) {
    return validationError(missing.map((f) => `${f} is required`));
  }

  const listing = await prisma.listing.create({
    data: {
      title: String(body.title).slice(0, 200),
      description: String(body.description || ""),
      priceCents: Math.max(0, Math.round(Number(body.priceCents) || 0)),
      category: body.category ? String(body.category) : null,
      condition: body.condition ? String(body.condition) : null,
      images: Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === "string") : [],
      status: "DRAFT",
      source: body.source === "UPLOAD" ? "UPLOAD" : "MANUAL",
      aiGenerated: false,
      clientId: body.clientId || null,
      inventoryItemId: body.inventoryItemId || null,
      marketplaces: Array.isArray(body.marketplaces)
        ? body.marketplaces.filter((m: unknown) => typeof m === "string")
        : [],
    },
  });

  return NextResponse.json({ ok: true, listing }, { status: 201 });
}
