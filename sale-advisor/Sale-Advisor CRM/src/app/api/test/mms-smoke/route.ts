import { NextResponse } from "next/server";

/**
 * POST /api/test/mms-smoke — Local smoke test for the MMS → listing pipeline.
 * Simulates an inbound Twilio MMS webhook with a sample public image.
 * Only works in development (NODE_ENV !== "production").
 *
 * Usage: curl -X POST http://localhost:3000/api/test/mms-smoke
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Smoke test disabled in production" },
      { status: 403 },
    );
  }

  // Simulate a Twilio inbound MMS payload with a public sample image
  const sampleImageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png";
  const fakeSid = `SM_SMOKE_${Date.now()}`;

  const payload = new URLSearchParams({
    From: "+15555550199",
    Body: "[SMOKE TEST] Photo of item for listing",
    MessageSid: fakeSid,
    NumMedia: "1",
    MediaUrl0: sampleImageUrl,
    MediaContentType0: "image/png",
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/twilio/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    const contentType = res.headers.get("content-type") || "";
    let body: string;
    if (contentType.includes("xml")) {
      body = await res.text();
    } else {
      body = await res.text();
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      fakeSid,
      webhookResponse: body,
      pipeline: res.ok
        ? "Webhook accepted — check server logs for trace ID (mms-*). A DRAFT listing should appear in /listings."
        : "Webhook rejected — check server logs for errors.",
      nextSteps: [
        "1. Check server console for [mms-*] trace logs",
        "2. Visit /listings → DRAFTS tab to see the new listing",
        "3. If Supabase is configured, images will be uploaded",
        "4. If ANTHROPIC_API_KEY is set, AI will generate title/description/price",
      ],
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to call inbound webhook",
    }, { status: 500 });
  }
}
