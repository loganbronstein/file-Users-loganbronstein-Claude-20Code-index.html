import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { client: true, listing: true },
  });

  if (!item) {
    return NextResponse.json({ ok: false, errors: ["Inventory item not found"] }, { status: 404 });
  }

  if (item.listing) {
    return NextResponse.json({ ok: false, errors: ["This item already has a listing"] }, { status: 400 });
  }

  // Create a DRAFT listing linked to this inventory item
  const listing = await prisma.listing.create({
    data: {
      clientId: item.clientId,
      inventoryItemId: item.id,
      title: item.title,
      description: `${item.title}${item.condition ? ` — ${item.condition} condition` : ""}`,
      priceCents: item.estValueCents || 0,
      category: item.category,
      condition: item.condition,
      status: "DRAFT",
      source: "MANUAL",
    },
  });

  // Transition inventory status to LISTED
  await prisma.inventoryItem.update({
    where: { id },
    data: { status: "LISTED", listedAt: new Date() },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "listing.created_from_inventory",
      detail: `Draft listing created for "${item.title}" from inventory`,
      clientId: item.clientId,
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
