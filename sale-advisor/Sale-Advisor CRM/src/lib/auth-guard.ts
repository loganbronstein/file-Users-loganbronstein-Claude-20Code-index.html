// ── Server-side auth guard for API routes ─────────────────
// Usage: const session = await requireAuth(); if (session instanceof NextResponse) return session;

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

type AuthSession = {
  user: { email: string; name?: string | null; role?: string };
};

/**
 * Returns the session if authenticated, or a 401 NextResponse if not.
 * Call at the top of any protected API route handler.
 */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, errors: ["Authentication required"] },
      { status: 401 }
    );
  }
  return session as AuthSession;
}

/**
 * Checks if the session user has one of the required roles.
 * Returns a 403 NextResponse if not authorized.
 */
export async function requireRole(
  ...roles: string[]
): Promise<AuthSession | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  const userRole = result.user.role || "VIEWER";
  if (!roles.includes(userRole)) {
    return NextResponse.json(
      { ok: false, errors: [`Requires one of: ${roles.join(", ")}`] },
      { status: 403 }
    );
  }
  return result;
}
