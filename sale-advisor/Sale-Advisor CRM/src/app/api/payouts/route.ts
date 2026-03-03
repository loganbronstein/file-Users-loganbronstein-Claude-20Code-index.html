import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

export async function GET() {
  const payouts = await prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(payouts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, grossSaleCents, deliveryFeeCents, commissionPercent } = body;

  // Required fields
  const missing = checkRequired(body, ["clientId", "grossSaleCents", "commissionPercent"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ ok: false, errors: ["Client not found"] }, { status: 404 });
  }

  // Parse and validate numeric fields
  const gross = parseInt(grossSaleCents);
  const deliveryFee = parseInt(deliveryFeeCents || "0");
  const commPct = parseFloat(commissionPercent);

  const errors: string[] = [];
  if (isNaN(gross) || gross <= 0) errors.push("grossSaleCents must be a positive integer");
  if (isNaN(deliveryFee) || deliveryFee < 0) errors.push("deliveryFeeCents must be a non-negative integer");
  if (isNaN(commPct) || commPct < 0 || commPct > 100) errors.push("commissionPercent must be between 0 and 100");
  if (errors.length > 0) return validationError(errors);

  const commissionCents = Math.round(gross * (commPct / 100));
  const payoutCents = gross - commissionCents - deliveryFee;

  if (payoutCents < 0) {
    return validationError(["Payout amount would be negative — check commission and delivery fee"]);
  }

  const payout = await prisma.payout.create({
    data: {
      clientId,
      grossSaleCents: gross,
      deliveryFeeCents: deliveryFee,
      commissionPercent: commPct,
      commissionCents,
      payoutCents,
    },
  });

  return NextResponse.json(payout, { status: 201 });
}
