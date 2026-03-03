import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.status === "PAID" && !body.paidAt) {
    body.paidAt = new Date();
  }

  const payout = await prisma.payout.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(payout);
}
