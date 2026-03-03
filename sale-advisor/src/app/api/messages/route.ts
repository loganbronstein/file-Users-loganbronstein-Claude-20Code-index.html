import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  const clientId = searchParams.get("clientId");

  const messages = await prisma.message.findMany({
    where: {
      ...(leadId ? { leadId } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      lead: { select: { name: true } },
      client: { select: { name: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, direction, leadId, clientId } = body;

  if (!content || !direction) {
    return NextResponse.json({ error: "content and direction are required" }, { status: 400 });
  }
  if (!leadId && !clientId) {
    return NextResponse.json({ error: "leadId or clientId is required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content,
      direction,
      leadId: leadId || null,
      clientId: clientId || null,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
