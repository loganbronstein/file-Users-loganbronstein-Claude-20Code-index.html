import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

interface CatalogItem {
  title: string;
  category?: string;
  condition?: string;
  estValueCents?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const missing = checkRequired(body, ["clientId"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  const { clientId, notes, items } = body as {
    clientId: string;
    notes?: string;
    items?: CatalogItem[];
  };

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ ok: false, errors: ["Client not found"] }, { status: 404 });
  }

  // Transition guard — only WALKTHROUGH_SCHEDULED can move to WALKTHROUGH_COMPLETED
  if (client.stage !== "WALKTHROUGH_SCHEDULED") {
    return validationError([
      `Cannot complete walkthrough — client stage is ${client.stage}, expected WALKTHROUGH_SCHEDULED`,
    ]);
  }

  // Validate items
  const validItems = (items || []).filter((i) => i.title && i.title.trim());
  if (validItems.length === 0) {
    return validationError(["At least one item with a title is required"]);
  }

  // Update client stage + notes
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: {
      stage: "WALKTHROUGH_COMPLETED",
      walkthroughNotes: notes
        ? [client.walkthroughNotes, notes].filter(Boolean).join("\n---\n")
        : client.walkthroughNotes,
    },
  });

  // Bulk-create inventory items
  await prisma.inventoryItem.createMany({
    data: validItems.map((item) => ({
      clientId,
      title: item.title.trim(),
      category: item.category || null,
      condition: item.condition || null,
      estValueCents: item.estValueCents || null,
      status: "PENDING_PICKUP" as const,
    })),
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "walkthrough.completed",
      detail: `Walkthrough completed for ${client.name} — ${validItems.length} item(s) cataloged`,
      clientId: client.id,
    },
  });

  return NextResponse.json(
    { ...updatedClient, itemsCreated: validItems.length },
    { status: 200 }
  );
}
