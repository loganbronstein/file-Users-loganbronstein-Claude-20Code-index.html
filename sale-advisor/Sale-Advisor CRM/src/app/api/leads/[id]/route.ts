import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import {
  validationError,
  pickAllowed,
  isValidEnum,
  canTransition,
  LEAD_PATCH_FIELDS,
  LEAD_SOURCES,
  LEAD_STAGES,
  LEAD_TRANSITIONS,
} from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current state
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Lead not found"] }, { status: 404 });
  }

  // Whitelist fields
  const data = pickAllowed(body, [...LEAD_PATCH_FIELDS]);

  // Validate source enum if changing
  if (data.source && !isValidEnum(data.source as string, LEAD_SOURCES)) {
    return validationError([`Invalid source: ${data.source}. Must be one of: ${LEAD_SOURCES.join(", ")}`]);
  }

  // Validate stage transition if changing
  if (data.stage && data.stage !== existing.stage) {
    if (!isValidEnum(data.stage as string, LEAD_STAGES)) {
      return validationError([`Invalid stage: ${data.stage}. Must be one of: ${LEAD_STAGES.join(", ")}`]);
    }
    if (!canTransition(LEAD_TRANSITIONS, existing.stage, data.stage as string)) {
      return validationError([`Cannot transition lead from ${existing.stage} to ${data.stage}`]);
    }
  }

  // Block editing converted leads (they're now clients)
  if (existing.convertedAt) {
    return validationError([`Lead has been converted to a client. Edit the client record instead.`]);
  }

  // Normalize phone if changed
  if (data.phone && data.phone !== existing.phone) {
    (data as Record<string, unknown>).phoneE164 = toE164(data.phone as string);
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: data as Record<string, unknown>,
  });

  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Lead not found"] }, { status: 404 });
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json(lead);
}
