import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/campaigns — List all campaigns with lead counts.
 * POST /api/campaigns — Create a new campaign.
 */

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Get lead counts per campaign (by utmCampaign field)
  const leadCounts = await prisma.lead.groupBy({
    by: ["utmCampaign"],
    _count: { id: true },
    where: { utmCampaign: { not: null } },
  });

  const countMap: Record<string, number> = {};
  for (const lc of leadCounts) {
    if (lc.utmCampaign) countMap[lc.utmCampaign] = lc._count.id;
  }

  const withCounts = campaigns.map((c) => ({
    ...c,
    leadCount: c.utmCampaign ? (countMap[c.utmCampaign] || 0) : 0,
    costPerLead: c.budgetCents && c.utmCampaign && countMap[c.utmCampaign]
      ? Math.round(c.budgetCents / countMap[c.utmCampaign])
      : null,
  }));

  return NextResponse.json({ ok: true, campaigns: withCounts });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ ok: false, errors: ["Campaign name is required"] }, { status: 400 });
  }

  const validPlatforms = ["meta", "google", "tiktok", "nextdoor", "other"];
  const platform = validPlatforms.includes(body.platform) ? body.platform : "other";

  const campaign = await prisma.campaign.create({
    data: {
      name: body.name.trim(),
      platform,
      status: "DRAFT",
      budgetCents: body.budgetCents ? Number(body.budgetCents) : null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      targetAudience: body.targetAudience?.trim() || null,
      notes: body.notes?.trim() || null,
      utmCampaign: body.utmCampaign?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, campaign });
}
