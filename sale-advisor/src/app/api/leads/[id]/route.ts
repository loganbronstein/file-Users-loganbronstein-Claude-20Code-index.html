import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const lead = await prisma.lead.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json(lead);
}
