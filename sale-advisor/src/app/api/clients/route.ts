import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.lead.findMany({
    where: {
      stage: { in: ["WALKTHROUGH_BOOKED", "LISTING_ACTIVE", "SOLD_PAID"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true, deliveries: true } },
    },
  });

  return NextResponse.json(clients);
}
