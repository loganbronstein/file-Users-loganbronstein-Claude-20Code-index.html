import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
