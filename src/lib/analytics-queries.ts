import { prisma } from "./prisma";

/**
 * Analytics queries — used by the analytics page.
 * Separate file from queries.ts to avoid merge conflicts.
 */

export async function getAnalyticsSummary(daysBack?: number) {
  const dateFilter = daysBack
    ? { createdAt: { gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) } }
    : {};

  const [
    leadCount,
    clientCount,
    itemsListed,
    itemsSold,
    totalGrossSales,
    totalCommission,
    totalPayouts,
    deliveryRevenue,
    deliveryCost,
  ] = await Promise.all([
    prisma.lead.count({ where: { archivedAt: null, ...dateFilter } }),
    prisma.client.count({ where: { archivedAt: null, ...dateFilter } }),
    prisma.inventoryItem.count({
      where: { status: { in: ["LISTED", "SOLD", "DELIVERED_TO_BUYER"] }, ...dateFilter },
    }),
    prisma.inventoryItem.count({
      where: { status: { in: ["SOLD", "DELIVERED_TO_BUYER"] }, ...dateFilter },
    }),
    prisma.payout.aggregate({
      _sum: { grossSaleCents: true },
      where: dateFilter,
    }),
    prisma.payout.aggregate({
      _sum: { commissionCents: true },
      where: dateFilter,
    }),
    prisma.payout.aggregate({
      _sum: { payoutCents: true },
      where: { status: "PAID", ...dateFilter },
    }),
    prisma.delivery.aggregate({
      _sum: { revenue: true },
      where: { status: "DELIVERED", ...dateFilter },
    }),
    prisma.delivery.aggregate({
      _sum: { cost: true },
      where: { status: "DELIVERED", ...dateFilter },
    }),
  ]);

  return {
    leadCount,
    clientCount,
    itemsListed,
    itemsSold,
    grossSaleCents: totalGrossSales._sum.grossSaleCents || 0,
    commissionCents: totalCommission._sum.commissionCents || 0,
    payoutCents: totalPayouts._sum.payoutCents || 0,
    deliveryRevenue: deliveryRevenue._sum.revenue || 0,
    deliveryCost: deliveryCost._sum.cost || 0,
  };
}

export async function getLeadSourcePerformance(daysBack?: number) {
  const dateFilter = daysBack
    ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
    : undefined;

  const leads = await prisma.lead.findMany({
    where: {
      archivedAt: null,
      ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
    },
    select: {
      source: true,
      client: {
        select: {
          id: true,
          inventory: { select: { id: true } },
        },
      },
    },
  });

  // Group by source
  const sourceMap: Record<string, { leads: number; clients: number; totalItems: number }> = {};

  for (const lead of leads) {
    const src = lead.source;
    if (!sourceMap[src]) sourceMap[src] = { leads: 0, clients: 0, totalItems: 0 };
    sourceMap[src].leads++;
    if (lead.client) {
      sourceMap[src].clients++;
      sourceMap[src].totalItems += lead.client.inventory.length;
    }
  }

  return Object.entries(sourceMap)
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      clients: data.clients,
      conversionRate: data.leads > 0 ? Math.round((data.clients / data.leads) * 100) : 0,
      avgItemsPerClient: data.clients > 0 ? Math.round(data.totalItems / data.clients) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);
}

export async function getInventoryPipeline(daysBack?: number) {
  const dateFilter = daysBack
    ? { createdAt: { gte: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000) } }
    : {};

  const [pendingPickup, inPossession, listed, sold, delivered] = await Promise.all([
    prisma.inventoryItem.count({ where: { status: "PENDING_PICKUP", ...dateFilter } }),
    prisma.inventoryItem.count({ where: { status: "IN_POSSESSION", ...dateFilter } }),
    prisma.inventoryItem.count({ where: { status: "LISTED", ...dateFilter } }),
    prisma.inventoryItem.count({ where: { status: "SOLD", ...dateFilter } }),
    prisma.inventoryItem.count({ where: { status: "DELIVERED_TO_BUYER", ...dateFilter } }),
  ]);

  return { pendingPickup, inPossession, listed, sold, delivered };
}
