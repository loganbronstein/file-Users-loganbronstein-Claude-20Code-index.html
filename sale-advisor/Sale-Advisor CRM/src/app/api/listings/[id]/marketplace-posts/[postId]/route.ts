import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { findMarketplacePost, updateMarketplacePost, allMarketplacePostsPosted } from "@/services/marketplace/db";
import { logListingEvent, logStatusTransition } from "@/lib/listing-events";

type Params = { params: Promise<{ id: string; postId: string }> };

/**
 * PATCH /api/listings/[id]/marketplace-posts/[postId] — Update a marketplace post
 *
 * Body: { status?: "POSTED" | "FAILED" | "REMOVED", externalUrl?: string, externalId?: string }
 *
 * When status is set to "POSTED" and externalUrl is provided, marks the post as live.
 * If ALL marketplace posts for this listing are POSTED, auto-transitions listing to POSTED.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id, postId } = await params;

  const post = await findMarketplacePost(postId, id);

  if (!post) {
    return NextResponse.json({ ok: false, errors: ["Marketplace post not found"] }, { status: 404 });
  }

  const body = await req.json();
  const allowedStatuses = ["POSTED", "FAILED", "REMOVED"];

  const data: Record<string, unknown> = {};

  if (body.status && allowedStatuses.includes(body.status)) {
    data.status = body.status;
    if (body.status === "POSTED") {
      data.postedAt = new Date();
    }
  }

  if (body.externalUrl && typeof body.externalUrl === "string") {
    data.externalUrl = body.externalUrl.trim();
  }

  if (body.externalId && typeof body.externalId === "string") {
    data.externalId = body.externalId.trim();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, errors: ["No valid fields to update"] }, { status: 400 });
  }

  const updated = await updateMarketplacePost(postId, data);

  // Log the marketplace post update
  await logListingEvent({
    listingId: id,
    action: `marketplace.${post.marketplace}.${(data.status as string || post.status).toLowerCase()}`,
    detail: `${post.marketplace} marked as ${data.status || post.status}${body.externalUrl ? ` — ${body.externalUrl}` : ""}`,
  });

  // Check if all marketplace posts are now POSTED — auto-transition listing
  if (data.status === "POSTED") {
    const allPosted = await allMarketplacePostsPosted(id);

    if (allPosted) {
      const listing = await prisma.listing.findUnique({ where: { id } });
      if (listing && listing.status === "POSTING") {
        await prisma.listing.update({
          where: { id },
          data: { status: "POSTED", postedAt: new Date() },
        });
        await logStatusTransition({
          listingId: id,
          fromStatus: "POSTING",
          toStatus: "POSTED",
          title: listing.title,
          clientId: listing.clientId,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, post: updated });
}
