/**
 * Phone normalization utility.
 * Single source of truth for phone formatting across the entire app.
 * All phone numbers stored as E.164 format: +1XXXXXXXXXX
 */

/** Strip everything except digits from a phone string */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Normalize a raw phone input to E.164 format (+1XXXXXXXXXX).
 * Returns null if the input can't be normalized to a valid US number.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const digits = digitsOnly(raw);

  // 10-digit US number → +1XXXXXXXXXX
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11-digit starting with 1 → +1XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}

/**
 * Format E.164 phone for display: (312) 555-1234
 */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "No phone";
  const digits = digitsOnly(e164);
  const national = digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return e164;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
