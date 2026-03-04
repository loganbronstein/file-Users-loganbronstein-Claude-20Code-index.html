import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validationError,
  pickAllowed,
  isValidEnum,
  canTransition,
  PAYOUT_PATCH_FIELDS,
  PAYOUT_STATUSES,
  PAYOUT_TRANSITIONS,
} from "@/lib/validation";
import { notifyPayoutPaid } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current state
  const existing = await prisma.payout.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Payout not found"] }, { status: 404 });
  }

  // Whitelist fields (only status can be changed on payouts)
  const data: Record<string, unknown> = pickAllowed(body, [...PAYOUT_PATCH_FIELDS]);

  // Validate status transition if changing
  if (data.status && data.status !== existing.status) {
    if (!isValidEnum(data.status as string, PAYOUT_STATUSES)) {
      return validationError([`Invalid status: ${data.status}. Must be one of: ${PAYOUT_STATUSES.join(", ")}`]);
    }
    if (!canTransition(PAYOUT_TRANSITIONS, existing.status, data.status as string)) {
      return validationError([`Cannot transition payout from ${existing.status} to ${data.status}`]);
    }
  }

  // Auto-set paidAt when marking as PAID
  if (data.status === "PAID" && !existing.paidAt) {
    data.paidAt = new Date();
  }

  const payout = await prisma.payout.update({
    where: { id },
    data,
    include: { client: { select: { name: true } } },
  });

  // Notify admin on PAID
  if (data.status === "PAID") {
    notifyPayoutPaid(payout.client.name, existing.payoutCents).catch(() => {});
  }

  // Log payment
  if (data.status === "PAID") {
    await prisma.activityLog.create({
      data: {
        action: "payout.paid",
        detail: `Payout of $${(existing.payoutCents / 100).toLocaleString()} marked as paid`,
        clientId: existing.clientId,
      },
    });
  }

  return NextResponse.json(payout);
}
