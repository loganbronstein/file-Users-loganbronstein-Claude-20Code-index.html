import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validationError,
  pickAllowed,
  isValidEnum,
  canTransition,
  CLIENT_PATCH_FIELDS,
  CLIENT_STAGES,
  CLIENT_TRANSITIONS,
} from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Fetch current state
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ ok: false, errors: ["Client not found"] }, { status: 404 });
  }

  // Whitelist fields
  const data = pickAllowed(body, [...CLIENT_PATCH_FIELDS]);

  // Validate stage transition if changing
  if (data.stage && data.stage !== existing.stage) {
    if (!isValidEnum(data.stage as string, CLIENT_STAGES)) {
      return validationError([`Invalid stage: ${data.stage}. Must be one of: ${CLIENT_STAGES.join(", ")}`]);
    }
    if (!canTransition(CLIENT_TRANSITIONS, existing.stage, data.stage as string)) {
      return validationError([`Cannot transition client from ${existing.stage} to ${data.stage}`]);
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: data as Record<string, unknown>,
  });

  return NextResponse.json(client);
}
