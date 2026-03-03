import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deliveries = await prisma.delivery.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(deliveries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, description, fromAddress, toAddress, crewSize, scheduledAt } = body;

  if (!clientId || !description || !fromAddress || !toAddress) {
    return NextResponse.json({ error: "clientId, description, fromAddress, toAddress are required" }, { status: 400 });
  }

  const delivery = await prisma.delivery.create({
    data: {
      clientId,
      description,
      fromAddress,
      toAddress,
      crewSize: crewSize ? parseInt(crewSize) : 1,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json(delivery, { status: 201 });
}
