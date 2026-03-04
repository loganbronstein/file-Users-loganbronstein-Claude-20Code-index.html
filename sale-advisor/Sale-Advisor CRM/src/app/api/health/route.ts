import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health — System health check
 * Checks database, Supabase storage config, and Twilio config.
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

  // ── Supabase Storage config ───────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
      });
      checks.storage = { ok: res.ok, detail: res.ok ? undefined : `HTTP ${res.status}` };
    } catch (err) {
      checks.storage = {
        ok: false,
        detail: err instanceof Error ? err.message : "Storage unreachable",
      };
    }
  } else {
    checks.storage = { ok: false, detail: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set" };
  }

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
  checks.ai = anthropicKey
    ? { ok: true }
    : { ok: false, detail: "ANTHROPIC_API_KEY not set" };

  // ── Overall ───────────────────────────────────────────
  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { ok: allOk, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
