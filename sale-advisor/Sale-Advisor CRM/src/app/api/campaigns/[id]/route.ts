import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ ok: false, errors: ["Invalid request body"] }, { status: 400 });
  }

  const validStatuses = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
  const data: Record<string, unknown> = {};

  if (body.status && validStatuses.includes(body.status)) data.status = body.status;
  if (body.budgetCents !== undefined) data.budgetCents = body.budgetCents ? Number(body.budgetCents) : null;
  if (body.name) data.name = body.name.trim();
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  const campaign = await prisma.campaign.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, campaign });
}
