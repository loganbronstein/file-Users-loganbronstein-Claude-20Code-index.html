/**
 * Supabase Storage client for listing images.
 * Uploads images to the "listing-images" bucket and returns public URLs.
 *
 * ⚠️  SECURITY: The Supabase service role key was previously exposed in a chat session.
 *     It MUST be rotated in the Supabase dashboard before production launch.
 *     After rotating, update SUPABASE_SERVICE_ROLE_KEY in .env and all deploy targets.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "listing-images";

/**
 * Fail-closed: throws immediately if Supabase env vars are missing.
 * Never silently continues without credentials.
 */
function getClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url === "PASTE_SUPABASE_URL") {
    throw new Error("[supabase] SUPABASE_URL is missing or still a placeholder — refusing to continue");
  }
  if (!key || key === "PASTE_SERVICE_ROLE_KEY") {
    throw new Error("[supabase] SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder — refusing to continue");
  }

  return createClient(url, key);
}

/**
 * Check Supabase connectivity and listing-images bucket.
 * Used by /api/health and /api/storage/check.
 */
export async function checkBucket(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase.storage.getBucket(BUCKET);
    if (error) {
      return { ok: false, detail: `Bucket "${BUCKET}": ${error.message}` };
    }
    return { ok: true, detail: `Bucket "${data.name}" exists (public: ${data.public})` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Upload a buffer to Supabase Storage. Returns the public URL.
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/jpeg",
): Promise<string> {
  const supabase = getClient();

  const path = `${Date.now()}-${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download an image from a Twilio media URL and upload to Supabase.
 * Twilio media URLs require Basic auth with account credentials.
 */
export async function downloadAndUpload(
  twilioMediaUrl: string,
  index: number,
): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const headers: Record<string, string> = {};
  if (accountSid && authToken) {
    headers["Authorization"] = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
  }

  const res = await fetch(twilioMediaUrl, { headers });
  if (!res.ok) {
    throw new Error(`Failed to download Twilio media: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Max 10MB
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Image exceeds 10MB limit");
  }

  const ext = contentType.split("/")[1] || "jpg";
  const filename = `mms-${index}.${ext}`;

  return uploadImage(buffer, filename, contentType);
}
