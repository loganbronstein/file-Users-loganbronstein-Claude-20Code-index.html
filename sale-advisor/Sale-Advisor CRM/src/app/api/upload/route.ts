import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { uploadImage } from "@/lib/supabase-storage";
import { validationError } from "@/lib/validation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/upload — Upload an image to Supabase Storage
 * Accepts multipart/form-data with a "file" field
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return validationError(["No file provided"]);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return validationError([`Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`]);
  }

  if (file.size > MAX_SIZE) {
    return validationError(["File exceeds 10MB limit"]);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name || "upload.jpg";
    const url = await uploadImage(buffer, filename, file.type);

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("[upload] Failed:", err);
    return NextResponse.json(
      { ok: false, errors: [err instanceof Error ? err.message : "Upload failed"] },
      { status: 500 },
    );
  }
}
