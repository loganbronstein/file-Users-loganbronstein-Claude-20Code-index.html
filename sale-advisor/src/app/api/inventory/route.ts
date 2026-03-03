import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const items = await prisma.inventoryItem.findMany({
    where: clientId ? { clientId } : {},
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, title, category, condition, estValueCents, listPriceCents, marketplace } = body;

  if (!clientId || !title) {
    return NextResponse.json({ error: "clientId and title are required" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      clientId,
      title,
      category: category || null,
      condition: condition || null,
      estValueCents: estValueCents ? parseInt(estValueCents) : null,
      listPriceCents: listPriceCents ? parseInt(listPriceCents) : null,
      marketplace: marketplace || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
