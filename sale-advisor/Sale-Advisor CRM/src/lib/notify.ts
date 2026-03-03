/**
 * Admin notification helper.
 * Sends SMS to MY_NOTIFY_NUMBER when important events happen.
 * Never sends automated messages to customers.
 */

import { sendSms } from "./twilio";

/**
 * Send a notification SMS to the admin (Logan).
 * Silently fails if Twilio or MY_NOTIFY_NUMBER is not configured.
 */
export async function notifyAdmin(message: string): Promise<void> {
  const myNumber = process.env.MY_NOTIFY_NUMBER;
  if (!myNumber) {
    console.warn("[notify] MY_NOTIFY_NUMBER not set — skipping notification");
    return;
  }

  const result = await sendSms(myNumber, message);
  if (!result.success) {
    console.error("[notify] Failed to send admin notification:", result.error);
  }
}

/**
 * Notify admin of a new lead.
 */
export async function notifyNewLead(name: string, phone: string): Promise<void> {
  await notifyAdmin(`New lead: ${name} – ${phone} – Open CRM > Messages.`);
}

/**
 * Notify admin of an inbound SMS.
 */
export async function notifyInboundSms(name: string | null, phone: string, preview: string): Promise<void> {
  const who = name || phone;
  const short = preview.length > 60 ? preview.slice(0, 57) + "..." : preview;
  await notifyAdmin(`SMS from ${who}: "${short}" – Open CRM > Messages.`);
}
