import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.client.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { source: true } },
      _count: { select: { inventory: true, messages: true, deliveries: true, payouts: true } },
    },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId } = body;

  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const client = await prisma.client.create({
    data: {
      leadId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      neighborhood: lead.neighborhood,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { stage: "WALKTHROUGH_BOOKED", convertedAt: new Date() },
  });

  return NextResponse.json(client, { status: 201 });
}
