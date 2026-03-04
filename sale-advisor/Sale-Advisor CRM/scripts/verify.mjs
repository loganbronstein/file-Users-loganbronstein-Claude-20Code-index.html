#!/usr/bin/env node

/**
 * verify.mjs — Quick verification script for Sale Advisor CRM
 * Run: node scripts/verify.mjs
 *
 * Checks: env sanity, Supabase connectivity, Prisma schema, core routes.
 */

const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";

const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m!\x1b[0m";

async function main() {
  console.log("\n\x1b[1m  Sale Advisor CRM — Verification\x1b[0m\n");

  // ── 1. Env sanity ──────────────────────────────────────
  console.log("  \x1b[1mEnvironment Variables\x1b[0m");

  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "ALLOWED_EMAILS",
  ];

  const optional = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
    "MY_NOTIFY_NUMBER",
  ];

  const placeholders = ["PASTE_SUPABASE_URL", "PASTE_SERVICE_ROLE_KEY", "PASTE_ANTHROPIC_API_KEY"];

  for (const key of required) {
    const val = process.env[key];
    if (!val) {
      console.log(`    ${FAIL} ${key} — MISSING (required)`);
    } else if (placeholders.some((p) => val.includes(p))) {
      console.log(`    ${WARN} ${key} — still a placeholder`);
    } else {
      console.log(`    ${PASS} ${key}`);
    }
  }

  for (const key of optional) {
    const val = process.env[key];
    if (!val) {
      console.log(`    ${WARN} ${key} — not set (optional)`);
    } else if (placeholders.some((p) => val.includes(p))) {
      console.log(`    ${WARN} ${key} — still a placeholder`);
    } else {
      console.log(`    ${PASS} ${key}`);
    }
  }

  // ── 2. Health endpoint ─────────────────────────────────
  console.log("\n  \x1b[1mHealth Check (${BASE}/api/health)\x1b[0m");

  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();

    for (const [name, check] of Object.entries(data.checks)) {
      const c = check;
      const icon = c.ok ? PASS : FAIL;
      console.log(`    ${icon} ${name}${c.detail ? ` — ${c.detail}` : ""}`);
    }

    console.log(`\n    Overall: ${data.ok ? `${PASS} All checks passed` : `${FAIL} Some checks failed`}`);
  } catch (err) {
    console.log(`    ${FAIL} Could not reach ${BASE}/api/health`);
    console.log(`       Is the dev server running? Start with: npm run dev`);
  }

  // ── 3. Core routes ─────────────────────────────────────
  console.log("\n  \x1b[1mCore Routes\x1b[0m");

  const routes = [
    { path: "/api/health", method: "GET", expect: 200 },
    { path: "/login", method: "GET", expect: 200 },
    { path: "/api/listings", method: "GET", expect: 401 }, // should require auth
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`${BASE}${route.path}`, {
        method: route.method,
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      const ok = res.status === route.expect;
      console.log(`    ${ok ? PASS : FAIL} ${route.method} ${route.path} → ${res.status} (expected ${route.expect})`);
    } catch {
      console.log(`    ${FAIL} ${route.method} ${route.path} — unreachable`);
    }
  }

  // ── 4. Test checklist ──────────────────────────────────
  console.log("\n  \x1b[1m── Manual Test Checklist ──\x1b[0m\n");
  console.log("  [ ] Visit http://localhost:3000/login — Google sign-in button visible");
  console.log("  [ ] Sign in with loganbronstein@saleadvisor.com — should succeed");
  console.log("  [ ] Sign in with inquiries@saleadvisor.com — should show 'not permitted'");
  console.log("  [ ] Visit /listings — DRAFTS tab shows any SMS-created listings");
  console.log("  [ ] Click 'Approve & Post' on a listing — marketplace modal appears");
  console.log("  [ ] Select/deselect marketplaces, confirm — listing moves to POSTED");
  console.log("  [ ] POST http://localhost:3000/api/test/mms-smoke — returns ok:true");
  console.log("  [ ] Check server logs for [mms-*] trace IDs");
  console.log("  [ ] GET http://localhost:3000/api/storage/check — bucket status");
  console.log("");
}

main().catch(console.error);
