import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio";
import { validationError, checkRequired } from "@/lib/validation";

const twilioConfigured = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM_NUMBER
);

/**
 * POST /api/messages/send
 * Send an outbound SMS via Twilio and store the message.
 * If Twilio is not configured, stores as "simulated".
 * Body: { conversationId, content, idempotencyKey? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId, content, idempotencyKey } = body;

  // Required fields
  const missing = checkRequired(body, ["conversationId", "content"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  if (!content?.trim()) {
    return validationError(["Message content cannot be empty"]);
  }

  // Content length limit (SMS max is 1600 chars)
  if (content.trim().length > 1600) {
    return validationError(["Message content cannot exceed 1600 characters"]);
  }

  // ── Idempotency check ──────────────────────────────────
  if (idempotencyKey) {
    const existing = await prisma.message.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json(existing); // Return existing, don't send again
    }
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return NextResponse.json({ ok: false, errors: ["Conversation not found"] }, { status: 404 });
  }

  let sid: string | null = null;
  let status = "simulated";
  let error: string | null = null;

  if (twilioConfigured) {
    const result = await sendSms(conversation.phoneE164, content.trim());
    sid = result.sid || null;
    status = result.success ? (result.status || "sent") : "failed";
    error = result.error || null;
  }

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      direction: "OUTBOUND",
      conversationId: conversation.id,
      leadId: conversation.leadId,
      clientId: conversation.clientId,
      twilioSid: sid,
      status,
      error,
      idempotencyKey: idempotencyKey || null,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
