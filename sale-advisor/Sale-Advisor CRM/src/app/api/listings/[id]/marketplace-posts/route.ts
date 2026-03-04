import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { findMarketplacePosts } from "@/services/marketplace/db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/[id]/marketplace-posts — Get all marketplace posts for a listing
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ ok: false, errors: ["Listing not found"] }, { status: 404 });
  }

  const posts = await findMarketplacePosts(id);

  return NextResponse.json({ ok: true, posts });
}
