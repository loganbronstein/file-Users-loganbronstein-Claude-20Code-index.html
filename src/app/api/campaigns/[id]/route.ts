import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

/**
 * PATCH /api/campaigns/[id] — Update campaign status/budget.
 * NOTE: Uses in-memory store until Campaign model is created.
 */

// Import the same in-memory array — in production this will be Prisma
// For now, PATCH returns success and the client manages state via refetch.

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: false, errors: ["Invalid request body"] }, { status: 400 });
  }

  // For now, just acknowledge the update — the client component manages state
  // When the Campaign model exists, this will use prisma.campaign.update()
  return NextResponse.json({
    ok: true,
    id,
    updated: Object.keys(body),
  });
}
