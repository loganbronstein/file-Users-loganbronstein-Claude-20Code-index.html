import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { getAnalyticsSummary, getLeadSourcePerformance, getInventoryPipeline } from "@/lib/analytics-queries";

/**
 * GET /api/analytics?days=7 — Analytics data with optional time filter.
 * Used by AnalyticsView for client-side time filter switching.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const daysParam = req.nextUrl.searchParams.get("days");
  const daysBack = daysParam ? Number(daysParam) : undefined;

  const [summary, sources, pipeline] = await Promise.all([
    getAnalyticsSummary(daysBack),
    getLeadSourcePerformance(daysBack),
    getInventoryPipeline(daysBack),
  ]);

  return NextResponse.json({ summary, sources, pipeline });
}
