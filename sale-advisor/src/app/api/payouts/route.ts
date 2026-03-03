import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  if (!clientId || !grossSaleCents || commissionPercent == null) {
    return NextResponse.json({ error: "clientId, grossSaleCents, commissionPercent are required" }, { status: 400 });
  }

  const gross = parseInt(grossSaleCents);
  const deliveryFee = parseInt(deliveryFeeCents || "0");
  const commPct = parseFloat(commissionPercent);
  const commissionCents = Math.round(gross * (commPct / 100));
  const payoutCents = gross - commissionCents - deliveryFee;

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
