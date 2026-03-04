import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { checkBucket } from "@/lib/supabase-storage";

/**
 * GET /api/system/status — Auth-protected system health with latency + traffic-light status.
 * Used by the System Monitor admin page. For public health checks, use /api/health.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  type ServiceStatus = {
    status: "green" | "yellow" | "red";
    label: string;
    detail?: string;
    latencyMs?: number;
  };

  const services: Record<string, ServiceStatus> = {};

  // ── Database ───────────────────────────────────────────
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - t0;
    services.database = {
      status: latencyMs < 2000 ? "green" : "yellow",
      label: "Database",
      detail: latencyMs < 2000 ? "Connected" : "Slow response",
      latencyMs,
    };
  } catch (err) {
    services.database = {
      status: "red",
      label: "Database",
      detail: err instanceof Error ? err.message : "Unreachable",
    };
  }

  // ── Supabase Storage ───────────────────────────────────
  try {
    const t0 = Date.now();
    const result = await checkBucket();
    const latencyMs = Date.now() - t0;
    services.storage = {
      status: result.ok ? (latencyMs < 3000 ? "green" : "yellow") : "red",
      label: "Storage",
      detail: result.detail || (result.ok ? "Connected" : "Bucket check failed"),
      latencyMs,
    };
  } catch (err) {
    services.storage = {
      status: "red",
      label: "Storage",
      detail: err instanceof Error ? err.message : "Unreachable",
    };
  }

  // ── AI (Anthropic) — env-var check only ────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey && anthropicKey !== "PASTE_ANTHROPIC_API_KEY") {
    services.ai = { status: "green", label: "AI", detail: "API key configured" };
  } else {
    services.ai = { status: "red", label: "AI", detail: "ANTHROPIC_API_KEY not set or placeholder" };
  }

  // ── SMS (Twilio) — env-var check + lightweight API ping ─
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (!twilioSid || !twilioToken || !twilioFrom) {
    const missing: string[] = [];
    if (!twilioSid) missing.push("SID");
    if (!twilioToken) missing.push("Token");
    if (!twilioFrom) missing.push("From");
    services.sms = { status: "red", label: "SMS", detail: `Missing: ${missing.join(", ")}` };
  } else {
    try {
      const t0 = Date.now();
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - t0;
      services.sms = {
        status: res.ok ? "green" : "yellow",
        label: "SMS",
        detail: res.ok ? "Twilio connected" : `Twilio returned ${res.status}`,
        latencyMs,
      };
    } catch (err) {
      services.sms = {
        status: "red",
        label: "SMS",
        detail: err instanceof Error ? err.message : "Twilio unreachable",
      };
    }
  }

  // ── Overall ────────────────────────────────────────────
  const statuses = Object.values(services).map((s) => s.status);
  const overall: "green" | "yellow" | "red" = statuses.includes("red")
    ? "red"
    : statuses.includes("yellow")
      ? "yellow"
      : "green";

  return NextResponse.json({
    ok: overall === "green",
    overall,
    services,
    timestamp: new Date().toISOString(),
  });
}
