import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validationError, checkRequired } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const missing = checkRequired(body, ["leadId", "walkthroughDate", "walkthroughAddress"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  const { leadId, walkthroughDate, walkthroughAddress, walkthroughNotes } = body;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { client: true },
  });

  if (!lead) {
    return NextResponse.json({ ok: false, errors: ["Lead not found"] }, { status: 404 });
  }

  const wtDate = new Date(walkthroughDate);

  let client;

  if (lead.client) {
    // Lead already converted — update existing client's walkthrough fields
    client = await prisma.client.update({
      where: { id: lead.client.id },
      data: {
        walkthroughDate: wtDate,
        walkthroughAddress,
        walkthroughNotes: walkthroughNotes || null,
        stage: "WALKTHROUGH_SCHEDULED",
      },
    });
  } else {
    // Create client from lead + set walkthrough fields
    client = await prisma.client.create({
      data: {
        leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        neighborhood: lead.neighborhood,
        walkthroughDate: wtDate,
        walkthroughAddress,
        walkthroughNotes: walkthroughNotes || null,
        stage: "WALKTHROUGH_SCHEDULED",
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { stage: "WALKTHROUGH_BOOKED", convertedAt: new Date() },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "walkthrough.scheduled",
      detail: `Walkthrough scheduled for ${lead.name} at ${walkthroughAddress} on ${wtDate.toLocaleDateString()}`,
      leadId: lead.id,
      clientId: client.id,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
