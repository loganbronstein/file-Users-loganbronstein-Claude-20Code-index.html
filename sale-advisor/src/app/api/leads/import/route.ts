import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  const expectedSecret = process.env.INGEST_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    fullName, phone, email, notes, source,
    campaign, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    adPlatform, campaignId, adId, landingVariant,
  } = body;

  if (!fullName) {
    return NextResponse.json({ error: "fullName is required" }, { status: 400 });
  }

  // Upsert by phone or email to avoid duplicates
  let existing = null;
  if (phone) {
    existing = await prisma.lead.findFirst({ where: { phone, archivedAt: null } });
  }
  if (!existing && email) {
    existing = await prisma.lead.findFirst({ where: { email, archivedAt: null } });
  }

  if (existing) {
    const updated = await prisma.lead.update({
      where: { id: existing.id },
      data: {
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
    return NextResponse.json({ action: "updated", lead: updated });
  }

  const lead = await prisma.lead.create({
    data: {
      name: fullName,
      phone: phone || null,
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

  return NextResponse.json({ action: "created", lead }, { status: 201 });
}
