import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import { notifyAdmin } from "@/lib/notify";
import { downloadAndUpload } from "@/lib/supabase-storage";
import { logListingEvent } from "@/lib/listing-events";
import {
  validateTwilioSignature,
  rateLimit,
  getClientIp,
  webhookUnauthorized,
  webhookRateLimited,
} from "@/lib/webhook-security";

/**
 * POST /api/sms/inbound
 * Dedicated SMS/MMS ingestion endpoint for the text-to-listing pipeline.
 * Validates Twilio signature, saves images to Supabase, creates DRAFT listing,
 * triggers AI generation via /my-listing skill pattern.
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 30 req/min per IP ──────────────────────
  const ip = getClientIp(req);
  if (!rateLimit(`sms-inbound:${ip}`, 30, 60_000)) {
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
  if (process.env.NODE_ENV === "production") {
    if (!validateTwilioSignature(req, params)) {
      console.warn("[sms/inbound] invalid Twilio signature from", ip);
      return webhookUnauthorized("Invalid Twilio signature");
    }
  }

  const from = params.From || params.from;
  const body = params.Body || params.body || "";
  const messageSid = params.MessageSid || params.messageSid;
  const numMedia = parseInt(params.NumMedia || params.numMedia || "0", 10);

  if (!from) {
    return twiml(400);
  }

  // ── Replay protection ─────────────────────────────────
  if (messageSid) {
    const existing = await prisma.message.findUnique({
      where: { twilioSid: messageSid },
    });
    if (existing) {
      return twiml(200);
    }
  }

  const phoneE164 = toE164(from) || from;

  // Upsert conversation
  const conversation = await prisma.conversation.upsert({
    where: { phoneE164 },
    create: { phoneE164, lastMessageAt: new Date() },
    update: { lastMessageAt: new Date() },
    include: {
      lead: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  // Store the inbound message
  await prisma.message.create({
    data: {
      content: body || (numMedia > 0 ? "(Photo message)" : ""),
      direction: "INBOUND",
      conversationId: conversation.id,
      leadId: conversation.leadId,
      clientId: conversation.clientId,
      twilioSid: messageSid || null,
      status: "received",
    },
  });

  // ── MMS image processing ──────────────────────────────
  if (numMedia > 0) {
    const imageUrls: string[] = [];

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = params[`MediaUrl${i}`] || params[`mediaUrl${i}`];
      const mediaType = params[`MediaContentType${i}`] || params[`mediaContentType${i}`] || "";

      if (!mediaUrl) continue;
      if (!mediaType.startsWith("image/")) continue;

      try {
        const permanentUrl = await downloadAndUpload(mediaUrl, i);
        imageUrls.push(permanentUrl);
      } catch (err) {
        console.error(`[sms/inbound] Failed to download media ${i}:`, err);
      }
    }

    if (imageUrls.length > 0) {
      try {
        // Create DRAFT listing
        const listing = await prisma.listing.create({
          data: {
            title: "SMS Photo — Pending AI Review",
            description: body || "",
            priceCents: 0,
            images: imageUrls,
            status: "DRAFT",
            source: "SMS",
            aiGenerated: false,
            clientId: conversation.clientId || null,
          },
        });

        // Create ListingImage records for each image
        await prisma.listingImage.createMany({
          data: imageUrls.map((url, idx) => ({
            listingId: listing.id,
            url,
            filename: `mms-${idx}.jpg`,
            sortOrder: idx,
          })),
        });

        // Log listing event
        await logListingEvent({
          listingId: listing.id,
          action: "sms.received",
          toStatus: "DRAFT",
          detail: `${imageUrls.length} photo(s) received via MMS from ${phoneE164}`,
          metadata: { phone: phoneE164, messageBody: body.slice(0, 200) },
        });

        // Log activity
        await prisma.activityLog.create({
          data: {
            action: "listing.sms_received",
            detail: `${imageUrls.length} photo(s) received via MMS — draft listing created`,
            clientId: conversation.clientId || null,
          },
        });

        // Trigger AI listing generation in background
        generateListingInBackground(listing.id, imageUrls).catch((err) => {
          console.error("[sms/inbound] AI generation failed:", err);
        });
      } catch (err) {
        console.error("[sms/inbound] Listing creation error:", err);
      }
    }
  }

  // Notify admin
  const who = conversation.lead?.name || conversation.client?.name || phoneE164;
  const preview = numMedia > 0
    ? `${body || "(photo)"} [+${numMedia} image(s)]`
    : body;
  await notifyAdmin(`SMS from ${who}: "${preview.slice(0, 60)}" — Open CRM > Listings.`).catch((err) => {
    console.error("[sms/inbound] notification error:", err);
  });

  return twiml(200);
}

/** Return empty TwiML response — no auto-reply to customers */
function twiml(status: number) {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status, headers: { "Content-Type": "text/xml" } },
  );
}

/**
 * Background AI listing generation.
 * Uses the same AI listing lib — doesn't block the webhook response.
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

    await logListingEvent({
      listingId,
      action: "ai.generated",
      fromStatus: "DRAFT",
      toStatus: "NEEDS_REVIEW",
      detail: `AI generated listing: "${details.title}" — $${(details.priceCents / 100).toFixed(2)}`,
      metadata: { ...details },
    });

    console.log(`[sms/inbound] AI listing generated for ${listingId}: "${details.title}"`);
  } catch (err) {
    console.error(`[sms/inbound] AI generation failed for ${listingId}:`, err);
    // Listing stays as DRAFT with placeholder — user can fill manually
  }
}
