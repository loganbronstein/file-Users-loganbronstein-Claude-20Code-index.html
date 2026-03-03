import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

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

  // Required fields
  const missing = checkRequired(body, ["clientId", "title"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ ok: false, errors: ["Client not found"] }, { status: 404 });
  }

  // Validate numeric fields if provided
  const errors: string[] = [];
  if (estValueCents !== undefined && (isNaN(parseInt(estValueCents)) || parseInt(estValueCents) < 0)) {
    errors.push("estValueCents must be a non-negative integer");
  }
  if (listPriceCents !== undefined && (isNaN(parseInt(listPriceCents)) || parseInt(listPriceCents) < 0)) {
    errors.push("listPriceCents must be a non-negative integer");
  }
  if (errors.length > 0) return validationError(errors);

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
