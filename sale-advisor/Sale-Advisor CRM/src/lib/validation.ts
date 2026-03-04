// ── Validation utility for Sale Advisor CRM ──────────────
// Lightweight field whitelists, status transition maps, and error helpers.
// No external libraries — just pure TypeScript guards.

import { NextResponse } from "next/server";

// ── Structured error response ─────────────────────────────

export function validationError(errors: string[], status = 400) {
  return NextResponse.json({ ok: false, errors }, { status });
}

// ── Field whitelisting ────────────────────────────────────

export function pickAllowed<T extends Record<string, unknown>>(
  body: T,
  allowed: string[]
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      result[key] = body[key];
    }
  }
  return result as Partial<T>;
}

export function checkRequired(body: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    const val = body[f];
    if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
      missing.push(f);
    }
  }
  return missing;
}

// ── PATCH field whitelists per model ──────────────────────

export const LEAD_PATCH_FIELDS = [
  "name", "email", "phone", "source", "stage", "neighborhood",
  "itemsDescription", "estimatedValue", "smsConsent",
] as const;

export const CLIENT_PATCH_FIELDS = [
  "name", "email", "phone", "neighborhood", "stage", "notes",
] as const;

export const DELIVERY_PATCH_FIELDS = [
  "description", "fromAddress", "toAddress", "status", "crewSize",
  "scheduledAt", "cost", "revenue",
] as const;

export const PAYOUT_PATCH_FIELDS = [
  "status",
] as const;

export const INVENTORY_PATCH_FIELDS = [
  "title", "category", "condition", "estValueCents", "listPriceCents",
  "soldPriceCents", "marketplace", "status", "listedAt", "soldAt",
] as const;

export const LISTING_PATCH_FIELDS = [
  "title", "description", "priceCents", "category", "condition",
  "marketplaces", "status", "images",
  "buyerName", "buyerContact", "deliveryStatus", "deliveryDate",
  "payoutStatus", "payoutAmountCents",
] as const;

// ── Enum value sets (for runtime validation) ──────────────

export const LEAD_SOURCES = [
  "FACEBOOK", "INSTAGRAM", "GOOGLE", "NEXTDOOR", "TIKTOK",
  "REFERRAL", "LAKESHORE", "WEBSITE", "OTHER",
] as const;

export const LEAD_STAGES = [
  "NEW_LEAD", "CONTACTED", "WALKTHROUGH_BOOKED", "LOST",
] as const;

export const CLIENT_STAGES = [
  "WALKTHROUGH_SCHEDULED", "WALKTHROUGH_COMPLETED", "LISTING_ACTIVE",
  "PARTIALLY_SOLD", "SOLD_PAID", "CLOSED",
] as const;

export const DELIVERY_STATUSES = [
  "SCHEDULED", "PICKUP", "IN_TRANSIT", "DELIVERED", "CANCELLED",
] as const;

export const PAYOUT_STATUSES = [
  "PENDING", "PROCESSING", "PAID", "FAILED",
] as const;

export const INVENTORY_STATUSES = [
  "PENDING_PICKUP", "IN_POSSESSION", "LISTED", "SOLD",
  "DELIVERED_TO_BUYER", "RETURNED", "CANCELLED",
] as const;

export const LISTING_STATUSES = [
  "DRAFT", "NEEDS_REVIEW", "APPROVED", "POSTING", "POSTED",
  "SOLD", "DELIVERY_SCHEDULED", "PAID_OUT",
] as const;

export const LISTING_SOURCES = [
  "SMS", "UPLOAD", "MANUAL",
] as const;

// ── Status transition maps ────────────────────────────────
// Each key lists the statuses it CAN transition to.
// If a status is not a key, it's a terminal state (no transitions allowed).

export const LEAD_TRANSITIONS: Record<string, string[]> = {
  NEW_LEAD: ["CONTACTED", "WALKTHROUGH_BOOKED", "LOST"],
  CONTACTED: ["WALKTHROUGH_BOOKED", "LOST"],
  WALKTHROUGH_BOOKED: ["LOST"], // conversion to Client is a separate action, not a stage change
  // LOST is terminal
};

export const CLIENT_TRANSITIONS: Record<string, string[]> = {
  WALKTHROUGH_SCHEDULED: ["WALKTHROUGH_COMPLETED", "CLOSED"],
  WALKTHROUGH_COMPLETED: ["LISTING_ACTIVE", "CLOSED"],
  LISTING_ACTIVE: ["PARTIALLY_SOLD", "SOLD_PAID", "CLOSED"],
  PARTIALLY_SOLD: ["SOLD_PAID", "CLOSED"],
  // SOLD_PAID and CLOSED are terminal
};

export const DELIVERY_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["PICKUP", "CANCELLED"],
  PICKUP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  // DELIVERED and CANCELLED are terminal
};

export const PAYOUT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "PAID", "FAILED"],
  PROCESSING: ["PAID", "FAILED"],
  // PAID and FAILED are terminal
};

export const INVENTORY_TRANSITIONS: Record<string, string[]> = {
  PENDING_PICKUP: ["IN_POSSESSION", "CANCELLED"],
  IN_POSSESSION: ["LISTED", "RETURNED", "CANCELLED"],
  LISTED: ["SOLD", "RETURNED", "CANCELLED"],
  SOLD: ["DELIVERED_TO_BUYER"],
  // DELIVERED_TO_BUYER, RETURNED, CANCELLED are terminal
};

export const LISTING_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["NEEDS_REVIEW", "APPROVED"],
  NEEDS_REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["POSTING"],
  POSTING: ["POSTED"],
  POSTED: ["SOLD"],
  SOLD: ["DELIVERY_SCHEDULED"],
  DELIVERY_SCHEDULED: ["PAID_OUT"],
  // PAID_OUT is terminal
};

// ── Transition validator ──────────────────────────────────

export function canTransition(
  transitionMap: Record<string, string[]>,
  from: string,
  to: string
): boolean {
  if (from === to) return true; // no-op is always allowed
  const allowed = transitionMap[from];
  if (!allowed) return false; // terminal state
  return allowed.includes(to);
}

// ── Enum validator ────────────────────────────────────────

export function isValidEnum(value: string, validValues: readonly string[]): boolean {
  return validValues.includes(value);
}
