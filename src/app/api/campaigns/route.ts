import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/campaigns — List all campaigns with lead counts.
 * POST /api/campaigns — Create a new campaign.
 *
 * NOTE: Campaign model must be added by Terminal A (see schema-requests-c.md).
 * Until then, this uses a localStorage-based fallback via the client component.
 * When the Campaign model exists, uncomment the Prisma code below.
 */

// ── Temporary in-memory store until Campaign model exists ──
// This lets the feature work immediately without schema changes.
const campaigns: Array<{
  id: string;
  name: string;
  platform: string;
  status: string;
  budgetCents: number | null;
  startDate: string | null;
  endDate: string | null;
  targetAudience: string | null;
  notes: string | null;
  utmCampaign: string | null;
  createdAt: string;
}> = [];

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

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

  // Attach lead counts to campaigns
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

  const campaign = {
    id: `camp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: body.name.trim(),
    platform,
    status: "DRAFT",
    budgetCents: body.budgetCents ? Number(body.budgetCents) : null,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    targetAudience: body.targetAudience?.trim() || null,
    notes: body.notes?.trim() || null,
    utmCampaign: body.utmCampaign?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  campaigns.push(campaign);
  return NextResponse.json({ ok: true, campaign });
}
