import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import { notifyNewLead } from "@/lib/notify";
import { validationError, checkRequired, isValidEnum, LEAD_SOURCES } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false, errors: ["Unauthorized"] }, { status: 401 });
  }

  const body = await req.json();
  const {
    fullName, phone, email, notes, source,
    campaign, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    adPlatform, campaignId, adId, landingVariant,
  } = body;

  // Required fields
  const missing = checkRequired(body, ["fullName"]);
  if (missing.length > 0) {
    return validationError([`Missing required fields: ${missing.join(", ")}`]);
  }

  // Validate source if provided
  if (source && !isValidEnum(source, LEAD_SOURCES)) {
    return validationError([`Invalid source: ${source}. Must be one of: ${LEAD_SOURCES.join(", ")}`]);
  }

  const phoneE164 = toE164(phone);

  // ── Duplicate protection by phoneE164 (preferred) or email ──
  let existing = null;
  if (phoneE164) {
    existing = await prisma.lead.findUnique({ where: { phoneE164 } });
  }
  if (!existing && email) {
    existing = await prisma.lead.findFirst({ where: { email, archivedAt: null } });
  }

  if (existing) {
    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
        lastContactedAt: new Date(),
        itemsDescription: notes || existing.itemsDescription,
        utmSource: utm_source || existing.utmSource,
        utmMedium: utm_medium || existing.utmMedium,
        utmCampaign: utm_campaign || campaign || existing.utmCampaign,
        utmContent: utm_content || existing.utmContent,
        utmTerm: utm_term || existing.utmTerm,
        adPlatform: adPlatform || existing.adPlatform,
        campaignId: campaignId || existing.campaignId,
        adId: adId || existing.adId,
        landingVariant: landingVariant || existing.landingVariant,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "lead.duplicate_merged",
        detail: `Import duplicate for ${fullName} — updated existing lead`,
        leadId: existing.id,
      },
    });

    return NextResponse.json({ action: "updated", lead: updated });
  }

  const lead = await prisma.lead.create({
    data: {
      name: fullName,
      phone: phone || null,
      phoneE164,
      email: email || null,
      source: source || "WEBSITE",
      itemsDescription: notes || null,
      utmSource: utm_source || null,
      utmMedium: utm_medium || null,
      utmCampaign: utm_campaign || campaign || null,
      utmContent: utm_content || null,
      utmTerm: utm_term || null,
      adPlatform: adPlatform || null,
      campaignId: campaignId || null,
      adId: adId || null,
      landingVariant: landingVariant || null,
    },
  });

  // Upsert conversation if phone provided
  if (phoneE164) {
    await prisma.conversation.upsert({
      where: { phoneE164 },
      create: { phoneE164, leadId: lead.id, lastMessageAt: new Date() },
      update: { leadId: lead.id },
    });

    notifyNewLead(fullName, phoneE164).catch((err) => {
      console.error("[import] notification error:", err);
    });
  }

  await prisma.activityLog.create({
    data: {
      action: "lead.created",
      detail: `Imported lead: ${fullName} from ${source || "WEBSITE"}`,
      leadId: lead.id,
    },
  });

  return NextResponse.json({ action: "created", lead }, { status: 201 });
}
