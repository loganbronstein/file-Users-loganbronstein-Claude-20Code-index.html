import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validationError,
  pickAllowed,
  isValidEnum,
  canTransition,
  INVENTORY_PATCH_FIELDS,
  INVENTORY_STATUSES,
  INVENTORY_TRANSITIONS,
} from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current state
  const existing = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Inventory item not found"] }, { status: 404 });
  }

  // Whitelist fields
  const data: Record<string, unknown> = pickAllowed(body, [...INVENTORY_PATCH_FIELDS]);

  // Validate status transition if changing
  if (data.status && data.status !== existing.status) {
    if (!isValidEnum(data.status as string, INVENTORY_STATUSES)) {
      return validationError([`Invalid status: ${data.status}. Must be one of: ${INVENTORY_STATUSES.join(", ")}`]);
    }
    if (!canTransition(INVENTORY_TRANSITIONS, existing.status, data.status as string)) {
      return validationError([`Cannot transition item from ${existing.status} to ${data.status}`]);
    }
  }

  // Auto-set soldAt when status becomes SOLD
  if (data.status === "SOLD" && !existing.soldAt) {
    data.soldAt = new Date();
  }

  // Auto-set listedAt when status becomes LISTED
  if (data.status === "LISTED" && !existing.listedAt) {
    data.listedAt = new Date();
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data,
  });

  return NextResponse.json(item);
}
