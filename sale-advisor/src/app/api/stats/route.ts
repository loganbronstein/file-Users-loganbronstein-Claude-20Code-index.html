import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [activeClients, itemsListed, revenueAgg, payoutAgg] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null } }),
    prisma.inventoryItem.count({ where: { status: { in: ["LISTED", "SOLD", "DELIVERED_TO_BUYER"] } } }),
    prisma.payout.aggregate({
      _sum: { commissionCents: true },
      where: { status: { in: ["PAID", "PROCESSING"] } },
    }),
    prisma.payout.aggregate({
      _sum: { payoutCents: true },
      where: { status: "PAID" },
    }),
  ]);

  return NextResponse.json({
    activeClients,
    itemsListed,
    revenueCents: revenueAgg._sum.commissionCents || 0,
    payoutCents: payoutAgg._sum.payoutCents || 0,
  });
}
