import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

export async function GET() {
  const deliveries = await prisma.delivery.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(deliveries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, description, fromAddress, toAddress, crewSize, scheduledAt, idempotencyKey } = body;

  // Required fields
  const missing = checkRequired(body, ["clientId", "description", "fromAddress", "toAddress"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ ok: false, errors: ["Client not found"] }, { status: 404 });
  }

  // ── Idempotency check ──────────────────────────────────
  if (idempotencyKey) {
    const existing = await prisma.delivery.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json(existing); // Return existing, don't create duplicate
    }
  }

  // Validate crewSize bounds
  const parsedCrewSize = crewSize ? parseInt(crewSize) : 1;
  if (parsedCrewSize < 1 || parsedCrewSize > 10) {
    return validationError(["crewSize must be between 1 and 10"]);
  }

  const delivery = await prisma.delivery.create({
    data: {
      clientId,
      description,
      fromAddress,
      toAddress,
      crewSize: parsedCrewSize,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      idempotencyKey: idempotencyKey || null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "delivery.scheduled",
      detail: `Delivery scheduled: ${description} for ${client.name}`,
      clientId: client.id,
    },
  });

  return NextResponse.json(delivery, { status: 201 });
}
