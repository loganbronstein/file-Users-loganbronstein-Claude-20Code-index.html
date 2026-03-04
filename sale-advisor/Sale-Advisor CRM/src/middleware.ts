import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ── Public paths (no auth required) ─────────────────────────
// These routes are accessible without a session.
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",           // NextAuth handlers (sign-in, callback, etc.)
  "/api/twilio/inbound", // Twilio webhook (verified by X-Twilio-Signature)
  "/api/sms/inbound",    // SMS/MMS ingestion webhook (verified by X-Twilio-Signature)
  "/api/leads/import",   // External lead intake (verified by HMAC)
  "/api/health",         // Health check (no auth required)
  "/api/storage/check",  // Dev-only Supabase storage check
  "/api/test/",          // Dev-only test routes
  "/api/seed",           // Dev-only seed route (blocks in production internally)
  "/_next",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let public routes through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check JWT token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, errors: ["Authentication required"] },
        { status: 401 }
      );
    }

    // Page routes → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
