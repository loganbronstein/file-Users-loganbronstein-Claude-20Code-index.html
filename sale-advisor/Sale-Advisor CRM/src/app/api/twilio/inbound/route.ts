import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import { notifyInboundSms } from "@/lib/notify";
import {
  validateTwilioSignature,
  rateLimit,
  getClientIp,
  webhookUnauthorized,
  webhookRateLimited,
} from "@/lib/webhook-security";

/**
 * POST /api/twilio/inbound
 * Twilio webhook for incoming SMS messages.
 * Validates X-Twilio-Signature, checks MessageSid replay, rate-limits by IP.
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 30 requests per minute per IP ──────────
  const ip = getClientIp(req);
  if (!rateLimit(`twilio:${ip}`, 30, 60_000)) {
    return webhookRateLimited();
  }

  // ── Parse body ─────────────────────────────────────────
  let params: Record<string, string>;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    params = Object.fromEntries(
      Array.from(formData.entries()).map(([k, v]) => [k, String(v)]),
    );
  } else {
    params = await req.json();
  }

  // ── Twilio signature validation ────────────────────────
  // Skip in development for local testing
  if (process.env.NODE_ENV === "production") {
    if (!validateTwilioSignature(req, params)) {
      console.warn("[twilio/inbound] invalid signature from", ip);
      return webhookUnauthorized("Invalid Twilio signature");
    }
  }

  const from = params.From || params.from;
  const body = params.Body || params.body;
  const messageSid = params.MessageSid || params.messageSid;

  if (!from || !body) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 400, headers: { "Content-Type": "text/xml" } },
    );
  }

  // ── Replay protection via MessageSid ───────────────────
  if (messageSid) {
    const existing = await prisma.message.findUnique({
      where: { twilioSid: messageSid },
    });
    if (existing) {
      // Already processed — return 200 so Twilio doesn't retry
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { "Content-Type": "text/xml" } },
      );
    }
  }

  const phoneE164 = toE164(from) || from;

  // Upsert conversation by phone
  const conversation = await prisma.conversation.upsert({
    where: { phoneE164 },
    create: { phoneE164, lastMessageAt: new Date() },
    update: { lastMessageAt: new Date() },
    include: { lead: { select: { name: true } } },
  });

  // Store the inbound message
  await prisma.message.create({
    data: {
      content: body,
      direction: "INBOUND",
      conversationId: conversation.id,
      leadId: conversation.leadId,
      clientId: conversation.clientId,
      twilioSid: messageSid || null,
      status: "received",
    },
  });

  // Notify admin — never auto-reply to the customer
  const leadName = conversation.lead?.name || null;
  await notifyInboundSms(leadName, phoneE164, body).catch((err) => {
    console.error("[inbound] notification error:", err);
  });

  // Return empty TwiML — no auto-reply
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}
