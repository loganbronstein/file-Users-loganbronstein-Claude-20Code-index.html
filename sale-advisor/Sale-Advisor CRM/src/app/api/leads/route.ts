import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import { notifyNewLead } from "@/lib/notify";
import {
  validationError,
  checkRequired,
  isValidEnum,
  LEAD_SOURCES,
} from "@/lib/validation";
import {
  validateHmacSignature,
  rateLimit,
  getClientIp,
  webhookUnauthorized,
  webhookRateLimited,
} from "@/lib/webhook-security";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const source = searchParams.get("source");

  const leads = await prisma.lead.findMany({
    where: {
      archivedAt: null,
      ...(stage ? { stage: stage as never } : {}),
      ...(source ? { source: source as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      client: { select: { id: true } },
    },
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 10 leads per minute per IP ─────────────
  const ip = getClientIp(req);
  if (!rateLimit(`leads:${ip}`, 10, 60_000)) {
    return webhookRateLimited();
  }

  // ── HMAC verification for external submissions ─────────
  // If X-Webhook-Signature header is present, validate it.
  // Internal CRM calls (from dashboard) don't send this header — they're
  // protected by NextAuth session instead. External sources (website form,
  // Zapier) must include the signature.
  const signature = req.headers.get("x-webhook-signature");
  const rawBody = await req.text();

  if (signature) {
    if (!validateHmacSignature(signature, rawBody)) {
      console.warn("[leads] invalid HMAC signature from", ip);
      return webhookUnauthorized("Invalid webhook signature");
    }
  }

  const body = JSON.parse(rawBody);
  const { name, email, phone, source, neighborhood, itemsDescription, estimatedValue } = body;

  // Required field check
  const missing = checkRequired(body, ["name"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  // Validate source enum if provided
  if (source && !isValidEnum(source, LEAD_SOURCES)) {
    return validationError([`Invalid source: ${source}. Must be one of: ${LEAD_SOURCES.join(", ")}`]);
  }

  const phoneE164 = toE164(phone);

  // ── Duplicate lead protection ──────────────────────────
  // If a lead with this phone already exists, update instead of creating
  if (phoneE164) {
    const existing = await prisma.lead.findUnique({ where: { phoneE164 } });
    if (existing) {
      const updated = await prisma.lead.update({
        where: { id: existing.id },
        data: {
          lastContactedAt: new Date(),
          // Update fields only if new values are provided and existing are empty
          email: email || existing.email,
          neighborhood: neighborhood || existing.neighborhood,
          itemsDescription: itemsDescription || existing.itemsDescription,
          estimatedValue: estimatedValue ? parseFloat(estimatedValue) : existing.estimatedValue,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "lead.duplicate_merged",
          detail: `Duplicate lead attempt for ${name} (${phoneE164}) — updated existing lead`,
          leadId: existing.id,
        },
      });

      return NextResponse.json({ ...updated, action: "merged" });
    }
  }

  // Create new lead
  const lead = await prisma.lead.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      phoneE164,
      source: source || "OTHER",
      neighborhood: neighborhood || null,
      itemsDescription: itemsDescription || null,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
    },
  });

  // If phone provided, upsert a Conversation linked to this lead
  let conversationId: string | null = null;
  if (phoneE164) {
    const conversation = await prisma.conversation.upsert({
      where: { phoneE164 },
      create: {
        phoneE164,
        leadId: lead.id,
        lastMessageAt: new Date(),
      },
      update: {
        leadId: lead.id,
      },
    });
    conversationId = conversation.id;
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "lead.created",
      detail: `New lead: ${name}${phoneE164 ? ` (${phoneE164})` : ""} from ${source || "OTHER"}`,
      leadId: lead.id,
    },
  });

  // Notify admin — never auto-text the customer
  if (phoneE164) {
    notifyNewLead(name, phoneE164).catch((err) => {
      console.error("[leads] notification error:", err);
    });
  }

  return NextResponse.json({ ...lead, conversationId }, { status: 201 });
}
