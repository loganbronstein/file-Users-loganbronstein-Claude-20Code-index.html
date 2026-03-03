/**
 * Lightweight Twilio SMS client using fetch — no SDK dependency.
 * Uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER env vars.
 */

function getConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return { accountSid, authToken, fromNumber };
}

export interface TwilioSendResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
}

/**
 * Send an SMS via Twilio REST API.
 */
export async function sendSms(to: string, body: string): Promise<TwilioSendResult> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: "Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  const params = new URLSearchParams({
    To: to,
    From: config.fromNumber,
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message || `Twilio error ${res.status}` };
    }

    return { success: true, sid: data.sid, status: data.status };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Twilio request failed" };
  }
}

/**
 * Validate an incoming Twilio webhook signature.
 * Uses HMAC-SHA1 per Twilio's spec.
 */
export async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  // Build validation data: URL + sorted params concatenated
  const data =
    url +
    Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], "");

  const { createHmac } = await import("crypto");
  const expected = createHmac("sha1", config.authToken).update(data).digest("base64");

  return expected === signature;
}
