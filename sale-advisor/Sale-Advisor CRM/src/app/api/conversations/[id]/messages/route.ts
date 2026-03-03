import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/conversations/:id/messages
 * Fetch all messages for a conversation, oldest first.
 * Also marks inbound messages as read.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  // Mark unread inbound messages as read
  await prisma.message.updateMany({
    where: { conversationId: id, direction: "INBOUND", read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}
