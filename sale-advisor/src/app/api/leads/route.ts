import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const source = searchParams.get("source");

  const leads = await prisma.lead.findMany({
    where: {
      archivedAt: null,
      ...(stage ? { stage: stage as never } : {}),
      ...(source ? { source: source as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      client: { select: { id: true } },
    },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, source, neighborhood, itemsDescription, estimatedValue } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const lead = await prisma.lead.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      source: source || "OTHER",
      neighborhood: neighborhood || null,
      itemsDescription: itemsDescription || null,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
