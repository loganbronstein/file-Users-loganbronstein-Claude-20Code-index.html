import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.status === "DELIVERED" && !body.completedAt) {
    body.completedAt = new Date();
  }

  const delivery = await prisma.delivery.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(delivery);
}
