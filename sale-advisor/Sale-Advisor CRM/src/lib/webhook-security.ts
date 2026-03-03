// ── Webhook security utilities ────────────────────────────
// Twilio signature validation, HMAC verification, rate limiting.
// No external dependencies — uses Node crypto only.

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { validationError } from "@/lib/validation";

// ── Twilio signature validation ──────────────────────────

/**
 * Validates X-Twilio-Signature header per Twilio's spec:
 * HMAC-SHA1 of (webhook URL + sorted POST params) using auth token.
 */
export function validateTwilioSignature(
  req: NextRequest,
  params: Record<string, string>,
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[webhook] TWILIO_AUTH_TOKEN not set — rejecting request");
    return false;
  }

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  // Reconstruct the full URL Twilio used (must match exactly)
  const url = buildTwilioUrl(req);

  // Sort params alphabetically and concatenate key+value
  const data =
    url +
    Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], "");

  const expected = createHmac("sha1", authToken).update(data).digest("base64");

  // Timing-safe comparison
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false; // length mismatch
  }
}

/**
 * Build the webhook URL Twilio sees. Uses X-Forwarded headers if behind a proxy,
 * otherwise falls back to the request URL.
 */
function buildTwilioUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const path = new URL(req.url).pathname;
  return `${proto}://${host}${path}`;
}

// ── HMAC verification for lead intake ────────────────────

/**
 * Verifies X-Webhook-Signature header: HMAC-SHA256 of raw body.
 * Used for external lead intake (website forms, Zapier, etc.).
 */
export function validateHmacSignature(
  signature: string | null,
  body: string,
): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] WEBHOOK_SECRET not set — rejecting request");
    return false;
  }

  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(body).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ── In-memory rate limiter ───────────────────────────────

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Simple sliding-window rate limiter. Returns true if allowed, false if over limit.
 * @param key   Unique identifier (e.g., IP or route+IP)
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count++;
  return bucket.count <= limit;
}

// ── Helpers ──────────────────────────────────────────────

/** Extract client IP from request headers */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Standard 401 response for failed webhook auth */
export function webhookUnauthorized(reason: string) {
  return validationError([reason], 401);
}

/** Standard 429 response */
export function webhookRateLimited() {
  return validationError(["Rate limit exceeded. Try again later."], 429);
}
