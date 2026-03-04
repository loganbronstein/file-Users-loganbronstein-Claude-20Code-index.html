import { prisma } from "./prisma";

export type SystemEvent = {
  id: string;
  type: "sms" | "ai_listing" | "approval";
  title: string;
  detail: string;
  time: Date;
  color: string;
};

/**
 * Fetches recent system events from Messages + ListingEvents.
 * Merges into a unified timeline sorted by most recent first.
 */
export async function getSystemEvents(): Promise<SystemEvent[]> {
  const [inboundMessages, aiEvents, approvalEvents] = await Promise.all([
    // Inbound SMS
    prisma.message.findMany({
      where: { direction: "INBOUND" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        conversation: { select: { phoneE164: true } },
        lead: { select: { name: true } },
        client: { select: { name: true } },
      },
    }),
    // AI-generated listings
    prisma.listingEvent.findMany({
      where: { action: "ai.generated" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { listing: { select: { title: true } } },
    }),
    // Listing approvals
    prisma.listingEvent.findMany({
      where: {
        OR: [{ action: "status.approved" }, { toStatus: "APPROVED" }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { listing: { select: { title: true } } },
    }),
  ]);

  const events: SystemEvent[] = [];

  for (const msg of inboundMessages) {
    const contactName = msg.lead?.name || msg.client?.name || msg.conversation?.phoneE164 || "Unknown";
    events.push({
      id: msg.id,
      type: "sms",
      title: `SMS from ${contactName}`,
      detail: msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content,
      time: msg.createdAt,
      color: "var(--blue, #3b82f6)",
    });
  }

  for (const evt of aiEvents) {
    events.push({
      id: evt.id,
      type: "ai_listing",
      title: `AI listing created`,
      detail: evt.listing?.title || evt.detail || "Untitled",
      time: evt.createdAt,
      color: "var(--purple, #8b5cf6)",
    });
  }

  for (const evt of approvalEvents) {
    events.push({
      id: evt.id,
      type: "approval",
      title: `Listing approved`,
      detail: evt.listing?.title || evt.detail || "Untitled",
      time: evt.createdAt,
      color: "var(--green, #22c55e)",
    });
  }

  events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return events.slice(0, 50);
}
