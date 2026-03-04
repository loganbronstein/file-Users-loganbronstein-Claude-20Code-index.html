import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/conversations/:id/read
 * Marks all unread inbound messages in a conversation as read.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await prisma.message.updateMany({
    where: { conversationId: id, direction: "INBOUND", read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true, marked: result.count });
}
