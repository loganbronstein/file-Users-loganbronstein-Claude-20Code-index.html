import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validationError,
  pickAllowed,
  isValidEnum,
  canTransition,
  DELIVERY_PATCH_FIELDS,
  DELIVERY_STATUSES,
  DELIVERY_TRANSITIONS,
} from "@/lib/validation";
import { notifyDeliveryStatus } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current state
  const existing = await prisma.delivery.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Delivery not found"] }, { status: 404 });
  }

  // Whitelist fields
  const data: Record<string, unknown> = pickAllowed(body, [...DELIVERY_PATCH_FIELDS]);

  // Validate status transition if changing
  if (data.status && data.status !== existing.status) {
    if (!isValidEnum(data.status as string, DELIVERY_STATUSES)) {
      return validationError([`Invalid status: ${data.status}. Must be one of: ${DELIVERY_STATUSES.join(", ")}`]);
    }
    if (!canTransition(DELIVERY_TRANSITIONS, existing.status, data.status as string)) {
      return validationError([`Cannot transition delivery from ${existing.status} to ${data.status}`]);
    }
  }

  // Auto-set completedAt when marking as DELIVERED
  if (data.status === "DELIVERED" && !data.completedAt) {
    data.completedAt = new Date();
  }

  // Validate crewSize if provided
  if (data.crewSize !== undefined) {
    const crew = parseInt(data.crewSize as string);
    if (isNaN(crew) || crew < 1 || crew > 10) {
      return validationError(["crewSize must be between 1 and 10"]);
    }
    data.crewSize = crew;
  }

  const delivery = await prisma.delivery.update({
    where: { id },
    data,
    include: { client: { select: { name: true } } },
  });

  // Notify admin on status change
  if (data.status && data.status !== existing.status) {
    notifyDeliveryStatus(delivery.client.name, existing.description, data.status as string).catch(() => {});
  }

  // Log completion
  if (data.status === "DELIVERED") {
    await prisma.activityLog.create({
      data: {
        action: "delivery.completed",
        detail: `Delivery completed: ${existing.description}`,
        clientId: existing.clientId,
      },
    });
  }

  return NextResponse.json(delivery);
}
