import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/conversations
 * List all conversations ordered by most recent message.
 */
export async function GET() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, source: true } },
      client: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, direction: true, createdAt: true },
      },
      _count: {
        select: { messages: { where: { direction: "INBOUND", read: false } } },
      },
    },
  });

  return NextResponse.json(conversations);
}
