import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/phone";
import { notifyAdmin } from "@/lib/notify";

/**
 * POST /api/intake — Public lead intake from ads / saleadvisor.com
 * Creates a lead + conversation, notifies admin. Handles duplicate phones gracefully.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, errors: ["Invalid request body"] }, { status: 400 });
  }

  const { name, phone, email, neighborhood, itemsDescription, estimatedItems, source, smsConsent } = body as {
    name?: string;
    phone?: string;
    email?: string;
    neighborhood?: string;
    itemsDescription?: string;
    estimatedItems?: string;
    source?: string;
    smsConsent?: boolean;
  };

  // Validation
  const errors: string[] = [];
  if (!name?.trim()) errors.push("Name is required");
  if (!phone?.trim()) errors.push("Phone number is required");
  if (!itemsDescription?.trim()) errors.push("Please describe what you'd like to sell");
  if (!smsConsent) errors.push("SMS consent is required");
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  // Normalize phone
  const phoneE164 = toE164(phone!);
  if (!phoneE164) {
    return NextResponse.json({ ok: false, errors: ["Please enter a valid US phone number"] }, { status: 400 });
  }

  // Map source to LeadSource enum
  const validSources = ["FACEBOOK", "INSTAGRAM", "GOOGLE", "NEXTDOOR", "TIKTOK", "REFERRAL", "LAKESHORE", "WEBSITE", "OTHER"];
  const leadSource = validSources.includes((source || "").toUpperCase()) ? (source!.toUpperCase() as string) : "OTHER";

  // Build description with estimated items count
  const fullDescription = estimatedItems
    ? `${itemsDescription!.trim()} (Est. ${estimatedItems} items)`
    : itemsDescription!.trim();

  // Consent metadata
  const consentText = "I agree to receive text messages from Sale Advisor about my consignment inquiry. Message & data rates may apply.";
  const consentIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  const consentUserAgent = req.headers.get("user-agent") || null;

  try {
    // Upsert lead — if phone already exists, update description
    const existingLead = await prisma.lead.findUnique({ where: { phoneE164 } });

    let lead;
    if (existingLead) {
      // Update existing lead with new description
      lead = await prisma.lead.update({
        where: { phoneE164 },
        data: {
          itemsDescription: existingLead.itemsDescription
            ? `${existingLead.itemsDescription}\n---\n${fullDescription}`
            : fullDescription,
          ...(email && !existingLead.email ? { email } : {}),
          ...(neighborhood && !existingLead.neighborhood ? { neighborhood } : {}),
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          name: name!.trim(),
          phone: phone!.trim(),
          phoneE164,
          email: email?.trim() || null,
          neighborhood: neighborhood?.trim() || null,
          itemsDescription: fullDescription,
          source: leadSource as "FACEBOOK" | "INSTAGRAM" | "GOOGLE" | "NEXTDOOR" | "TIKTOK" | "REFERRAL" | "LAKESHORE" | "WEBSITE" | "OTHER",
          stage: "NEW_LEAD",
          smsConsent: true,
          consentText,
          consentedAt: new Date(),
          consentIp,
          consentUserAgent,
        },
      });
    }

    // Upsert conversation for this phone
    await prisma.conversation.upsert({
      where: { phoneE164 },
      update: { leadId: lead.id },
      create: { phoneE164, leadId: lead.id },
    });

    // Notify admin
    const sourceLabel = source || "Unknown";
    await notifyAdmin(
      `New lead: ${name!.trim()} from ${sourceLabel} — "${fullDescription.slice(0, 80)}". Open CRM > Leads.`,
    );

    return NextResponse.json({ ok: true, name: name!.trim() });
  } catch (err) {
    console.error("[intake] Error creating lead:", err);
    return NextResponse.json(
      { ok: false, errors: ["Something went wrong. Please try again."] },
      { status: 500 },
    );
  }
}
