import { prisma } from "./prisma";

export async function getStats() {
  const [activeClients, totalLeads, itemsListed, itemsSold, revenueAgg, payoutAgg] = await Promise.all([
    prisma.client.count({ where: { archivedAt: null } }),
    prisma.lead.count({ where: { archivedAt: null } }),
    prisma.inventoryItem.count({ where: { status: { in: ["LISTED", "SOLD", "DELIVERED_TO_BUYER"] } } }),
    prisma.inventoryItem.count({ where: { status: { in: ["SOLD", "DELIVERED_TO_BUYER"] } } }),
    prisma.payout.aggregate({
      _sum: { commissionCents: true },
    }),
    prisma.payout.aggregate({
      _sum: { payoutCents: true },
      where: { status: "PAID" },
    }),
  ]);

  return {
    activeClients,
    totalLeads,
    itemsListed,
    itemsSold,
    revenueCents: revenueAgg._sum.commissionCents || 0,
    payoutCents: payoutAgg._sum.payoutCents || 0,
  };
}

export async function getLeadsByStage() {
  const leads = await prisma.lead.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, stage: true } } },
  });

  return {
    newLeads: leads.filter((l) => l.stage === "NEW_LEAD"),
    contacted: leads.filter((l) => l.stage === "CONTACTED"),
    booked: leads.filter((l) => l.stage === "WALKTHROUGH_BOOKED"),
  };
}

export async function getClientsByStage() {
  const clients = await prisma.client.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { source: true } },
      inventory: { select: { estValueCents: true, soldPriceCents: true, status: true } },
      payouts: { select: { payoutCents: true, status: true } },
    },
  });

  return {
    listing: clients.filter((c) => c.stage === "LISTING_ACTIVE" || c.stage === "WALKTHROUGH_COMPLETED"),
    soldPaid: clients.filter((c) => c.stage === "SOLD_PAID" || c.stage === "PARTIALLY_SOLD"),
  };
}

export async function getRecentMessages() {
  const messages = await prisma.message.findMany({
    where: { direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      lead: { select: { name: true } },
      client: { select: { name: true } },
    },
  });

  return messages;
}

export async function getLeadSourceCounts() {
  const counts = await prisma.lead.groupBy({
    by: ["source"],
    _count: { id: true },
    where: { archivedAt: null },
  });

  return counts.map((c) => ({
    source: c.source,
    count: c._count.id,
  }));
}

export async function getDeliveries() {
  const deliveries = await prisma.delivery.findMany({
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
    include: { client: { select: { name: true } } },
  });

  return deliveries;
}

export async function getRecentActivity() {
  const [recentMessages, recentLeads, recentDeliveries, recentPayouts] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { lead: { select: { name: true } }, client: { select: { name: true } } },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, source: true, createdAt: true },
    }),
    prisma.delivery.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { client: { select: { name: true } } },
    }),
    prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      where: { status: "PAID" },
      include: { client: { select: { name: true } } },
    }),
  ]);

  type Activity = { type: string; text: string; time: Date; color: string };
  const activities: Activity[] = [];

  for (const lead of recentLeads) {
    activities.push({
      type: "lead",
      text: `${lead.name} — new lead from ${lead.source.replace("_", " ").toLowerCase()}`,
      time: lead.createdAt,
      color: "var(--accent)",
    });
  }
  for (const msg of recentMessages) {
    const name = msg.lead?.name || msg.client?.name || "Unknown";
    activities.push({
      type: "message",
      text: `${name} — "${msg.content.slice(0, 60)}${msg.content.length > 60 ? "..." : ""}"`,
      time: msg.createdAt,
      color: "var(--blue)",
    });
  }
  for (const del of recentDeliveries) {
    activities.push({
      type: "delivery",
      text: `${del.description} — ${del.client.name} — ${del.status.toLowerCase().replace("_", " ")}`,
      time: del.updatedAt,
      color: "var(--yellow)",
    });
  }
  for (const p of recentPayouts) {
    activities.push({
      type: "payout",
      text: `${p.client.name} was paid $${(p.payoutCents / 100).toLocaleString()}`,
      time: p.createdAt,
      color: "var(--green)",
    });
  }

  activities.sort((a, b) => b.time.getTime() - a.time.getTime());
  return activities.slice(0, 10);
}

export async function getAllClients() {
  return prisma.client.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { source: true, phone: true, email: true } },
      _count: { select: { inventory: true, messages: true, deliveries: true, payouts: true } },
    },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      lead: true,
      inventory: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, take: 50 },
      deliveries: { orderBy: { scheduledAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getAllLeads() {
  return prisma.lead.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true } },
      _count: { select: { messages: true } },
    },
  });
}

export async function getMessageThreads() {
  // Get latest message per lead/client
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      client: { select: { id: true, name: true, phone: true } },
    },
  });

  // Group by lead or client
  const threads: Record<string, {
    id: string;
    name: string;
    phone: string | null;
    type: "lead" | "client";
    messages: typeof messages;
    lastMessage: string;
    lastTime: Date;
    unreadCount: number;
  }> = {};

  for (const msg of messages) {
    const key = msg.leadId ? `lead-${msg.leadId}` : `client-${msg.clientId}`;
    if (!threads[key]) {
      const name = msg.lead?.name || msg.client?.name || "Unknown";
      const phone = msg.lead?.phone || msg.client?.phone || null;
      threads[key] = {
        id: msg.leadId || msg.clientId || "",
        name,
        phone,
        type: msg.leadId ? "lead" : "client",
        messages: [],
        lastMessage: msg.content,
        lastTime: msg.createdAt,
        unreadCount: 0,
      };
    }
    threads[key].messages.push(msg);
    if (!msg.read && msg.direction === "INBOUND") {
      threads[key].unreadCount++;
    }
  }

  return Object.values(threads).sort((a, b) => b.lastTime.getTime() - a.lastTime.getTime());
}

export async function getMessagesForThread(leadId?: string, clientId?: string) {
  return prisma.message.findMany({
    where: {
      ...(leadId ? { leadId } : {}),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllInventory() {
  return prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function getAllPayouts() {
  return prisma.payout.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function getWalkthroughs() {
  // Leads at WALKTHROUGH_BOOKED stage + clients at WALKTHROUGH_SCHEDULED/COMPLETED
  const [bookedLeads, walkthroughClients] = await Promise.all([
    prisma.lead.findMany({
      where: { stage: "WALKTHROUGH_BOOKED", archivedAt: null },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.client.findMany({
      where: { stage: { in: ["WALKTHROUGH_SCHEDULED", "WALKTHROUGH_COMPLETED"] }, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      include: { lead: { select: { phone: true, email: true } } },
    }),
  ]);

  return { bookedLeads, walkthroughClients };
}
