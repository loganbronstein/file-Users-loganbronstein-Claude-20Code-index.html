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
import { downloadAndUpload } from "@/lib/supabase-storage";

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

  const hasMedia = parseInt(params.NumMedia || params.numMedia || "0", 10) > 0;

  if (!from || (!body && !hasMedia)) {
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
      content: body || (hasMedia ? "(Photo message)" : ""),
      direction: "INBOUND",
      conversationId: conversation.id,
      leadId: conversation.leadId,
      clientId: conversation.clientId,
      twilioSid: messageSid || null,
      status: "received",
    },
  });

  // ── MMS image handling ────────────────────────────────
  const numMedia = parseInt(params.NumMedia || params.numMedia || "0", 10);
  if (numMedia > 0) {
    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = params[`MediaUrl${i}`] || params[`mediaUrl${i}`];
        const mediaType = params[`MediaContentType${i}`] || params[`mediaContentType${i}`] || "";
        if (!mediaUrl) continue;
        // Only process image types
        if (!mediaType.startsWith("image/")) continue;

        const permanentUrl = await downloadAndUpload(mediaUrl, i);
        imageUrls.push(permanentUrl);
      }

      if (imageUrls.length > 0) {
        // Create a DRAFT listing from the MMS photos
        const listing = await prisma.listing.create({
          data: {
            title: "SMS Photo — Pending AI Review",
            description: "",
            priceCents: 0,
            images: imageUrls,
            status: "DRAFT",
            source: "SMS",
            aiGenerated: false,
            clientId: conversation.clientId || null,
          },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            action: "listing.sms_received",
            detail: `${imageUrls.length} photo(s) received via MMS — draft listing created`,
            clientId: conversation.clientId || null,
          },
        });

        // Trigger AI generation in background (non-blocking)
        generateListingInBackground(listing.id, imageUrls).catch((err) => {
          console.error("[inbound] AI listing generation failed:", err);
        });
      }
    } catch (err) {
      console.error("[inbound] MMS processing error:", err);
      // Don't fail the webhook — SMS text was already saved
    }
  }

  // Notify admin — never auto-reply to the customer
  const leadName = conversation.lead?.name || null;
  const notifyBody = numMedia > 0 ? `${body || "(photo)"} [+${numMedia} image(s)]` : body;
  await notifyInboundSms(leadName, phoneE164, notifyBody).catch((err) => {
    console.error("[inbound] notification error:", err);
  });

  // Return empty TwiML — no auto-reply
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}

/**
 * Background AI listing generation — doesn't block the webhook response.
 */
async function generateListingInBackground(listingId: string, imageUrls: string[]) {
  try {
    const { generateListing } = await import("@/lib/ai-listing");
    const details = await generateListing(imageUrls);
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        title: details.title,
        description: details.description,
        priceCents: details.priceCents,
        category: details.category,
        condition: details.condition,
        aiGenerated: true,
        status: "NEEDS_REVIEW",
      },
    });
    console.log(`[inbound] AI listing generated for ${listingId}: "${details.title}"`);
  } catch (err) {
    console.error(`[inbound] AI generation failed for ${listingId}:`, err);
    // Listing stays as DRAFT with placeholder — user can fill manually
  }
}
