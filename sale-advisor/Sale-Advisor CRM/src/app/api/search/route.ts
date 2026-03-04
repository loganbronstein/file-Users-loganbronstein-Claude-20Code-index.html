import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/search?q=term — Global search across leads, clients, listings.
 * Returns up to 5 results per category, case-insensitive.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ leads: [], clients: [], listings: [] });
  }

  const [leads, clients, listings] = await Promise.all([
    prisma.lead.findMany({
      where: {
        archivedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phoneE164: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true, source: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      where: {
        archivedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true, stage: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, status: true, priceCents: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ leads, clients, listings });
}
