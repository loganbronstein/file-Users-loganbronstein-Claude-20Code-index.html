import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

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

  const missing = checkRequired(body, ["leadId"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ ok: false, errors: ["Lead not found"] }, { status: 404 });
  }

  // ── Double-convert guard ────────────────────────────────
  if (lead.convertedAt) {
    return validationError(["This lead has already been converted to a client"]);
  }

  // Check if client already exists for this lead
  const existingClient = await prisma.client.findUnique({ where: { leadId } });
  if (existingClient) {
    return validationError(["A client record already exists for this lead"]);
  }

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

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "lead.converted",
      detail: `${lead.name} converted from lead to client`,
      leadId: lead.id,
      clientId: client.id,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
