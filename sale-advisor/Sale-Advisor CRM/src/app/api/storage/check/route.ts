import { NextResponse } from "next/server";
import { checkBucket, BUCKET } from "@/lib/supabase-storage";

/**
 * GET /api/storage/check — Dev-only endpoint to verify Supabase Storage connectivity.
 * Confirms: env vars present, can reach Supabase, listing-images bucket exists.
 */
export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== "PASTE_SERVICE_ROLE_KEY";

  const envCheck = {
    SUPABASE_URL: supabaseUrl && supabaseUrl !== "PASTE_SUPABASE_URL"
      ? "set"
      : "MISSING or placeholder",
    SUPABASE_SERVICE_ROLE_KEY: hasKey ? "set" : "MISSING or placeholder",
  };

  const bucketCheck = await checkBucket();

  return NextResponse.json({
    ok: bucketCheck.ok,
    bucket: BUCKET,
    env: envCheck,
    bucketStatus: bucketCheck,
    timestamp: new Date().toISOString(),
  }, { status: bucketCheck.ok ? 200 : 503 });
}
