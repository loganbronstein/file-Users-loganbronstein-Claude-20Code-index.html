import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBucket } from "@/lib/supabase-storage";

/**
 * GET /api/health — System health check
 * Checks: database, Supabase storage bucket, Twilio config, Anthropic config, Prisma schema.
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // ── Database ──────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (err) {
    checks.database = {
      ok: false,
      detail: err instanceof Error ? err.message : "Database unreachable",
    };
  }

  // ── Prisma schema sync ────────────────────────────────
  try {
    const count = await prisma.listing.count();
    checks.prisma = { ok: true, detail: `${count} listings in DB` };
  } catch (err) {
    checks.prisma = {
      ok: false,
      detail: err instanceof Error ? err.message : "Prisma query failed — schema may be out of sync",
    };
  }

  // ── Supabase Storage bucket ───────────────────────────
  checks.storage = await checkBucket();

  // ── Twilio config ─────────────────────────────────────
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    checks.twilio = { ok: true };
  } else {
    const missing: string[] = [];
    if (!twilioSid) missing.push("TWILIO_ACCOUNT_SID");
    if (!twilioToken) missing.push("TWILIO_AUTH_TOKEN");
    if (!twilioFrom) missing.push("TWILIO_FROM_NUMBER");
    checks.twilio = { ok: false, detail: `Missing: ${missing.join(", ")}` };
  }

  // ── Anthropic config ──────────────────────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  checks.ai = anthropicKey && anthropicKey !== "PASTE_ANTHROPIC_API_KEY"
    ? { ok: true }
    : { ok: false, detail: "ANTHROPIC_API_KEY not set or placeholder" };

  // ── Auth config ───────────────────────────────────────
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextauthSecret = process.env.NEXTAUTH_SECRET;
  if (googleId && googleSecret && nextauthSecret) {
    checks.auth = { ok: true, detail: "Google OAuth + NextAuth configured" };
  } else {
    const missing: string[] = [];
    if (!googleId) missing.push("GOOGLE_CLIENT_ID");
    if (!googleSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!nextauthSecret) missing.push("NEXTAUTH_SECRET");
    checks.auth = { ok: false, detail: `Missing: ${missing.join(", ")}` };
  }

  // ── Core routes ───────────────────────────────────────
  checks.routes = { ok: true, detail: "Health endpoint responding" };

  // ── Overall ───────────────────────────────────────────
  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { ok: allOk, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
