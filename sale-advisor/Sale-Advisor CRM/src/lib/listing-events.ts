/**
 * Listing event + audit logging helpers.
 * Records status changes, AI generation events, and field-level changes.
 */

import { prisma } from "./prisma";

/**
 * Log a listing event (status change, AI generation, marketplace post, etc.)
 */
export async function logListingEvent(params: {
  listingId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.listingEvent.create({
    data: {
      listingId: params.listingId,
      action: params.action,
      fromStatus: params.fromStatus || null,
      toStatus: params.toStatus || null,
      detail: params.detail || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

/**
 * Log a field-level audit change on a listing.
 */
export async function logListingAudit(params: {
  listingId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy?: string;
}) {
  await prisma.listingAudit.create({
    data: {
      listingId: params.listingId,
      field: params.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
      changedBy: params.changedBy || "system",
    },
  });
}

/**
 * Log a status transition as both a ListingEvent and an ActivityLog.
 */
export async function logStatusTransition(params: {
  listingId: string;
  fromStatus: string;
  toStatus: string;
  title: string;
  clientId?: string | null;
}) {
  await Promise.all([
    logListingEvent({
      listingId: params.listingId,
      action: `status.${params.toStatus.toLowerCase()}`,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      detail: `"${params.title}" transitioned from ${params.fromStatus} to ${params.toStatus}`,
    }),
    prisma.activityLog.create({
      data: {
        action: `listing.${params.toStatus.toLowerCase()}`,
        detail: `"${params.title}" → ${params.toStatus}`,
        clientId: params.clientId || null,
      },
    }),
  ]);
}
