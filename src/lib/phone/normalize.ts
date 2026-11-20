/**
 * Australian telephone number normalization and validation.
 *
 * Handles Australian mobile formats:
 * - 0412 345 678
 * - 0412345678
 * - +61 412 345 678
 * - +61412345678
 * - 61412345678
 *
 * Also supports Australian landline formats (02, 03, 07, 08).
 * Normalizes all valid numbers to standard E.164 format (+61...).
 */

export function normalizeAustralianPhone(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Strip all whitespace, hyphens, brackets, dots
  let cleaned = raw.trim().replace(/[\s\-()[\].]/g, "");

  // Convert international prefixes: 001161 -> +61, 0061 -> +61
  if (cleaned.startsWith("001161")) {
    cleaned = "+61" + cleaned.slice(6);
  } else if (cleaned.startsWith("0061")) {
    cleaned = "+61" + cleaned.slice(4);
  }

  // If starts with +61
  if (cleaned.startsWith("+61")) {
    const afterCode = cleaned.slice(3);
    // If entered as +6104xxxxxxxx, drop the leading 0
    const normalizedDigits = afterCode.startsWith("0") ? afterCode.slice(1) : afterCode;

    // Mobile: +61 4XXXXXXXX (9 digits after +61)
    if (/^4\d{8}$/.test(normalizedDigits)) {
      return `+61${normalizedDigits}`;
    }
    // Landline: +61 [2378]XXXXXXXX (9 digits after +61)
    if (/^[2378]\d{8}$/.test(normalizedDigits)) {
      return `+61${normalizedDigits}`;
    }
    return null;
  }

  // If starts with 61 (without plus)
  if (cleaned.startsWith("61")) {
    const afterCode = cleaned.slice(2);
    const normalizedDigits = afterCode.startsWith("0") ? afterCode.slice(1) : afterCode;

    if (/^4\d{8}$/.test(normalizedDigits)) {
      return `+61${normalizedDigits}`;
    }
    if (/^[2378]\d{8}$/.test(normalizedDigits)) {
      return `+61${normalizedDigits}`;
    }
    return null;
  }

  // Standard domestic format starting with 0: 04XXXXXXXX (mobile) or 02/03/07/08XXXXXXXX (landline)
  if (/^04\d{8}$/.test(cleaned)) {
    return `+61${cleaned.slice(1)}`;
  }

  if (/^0[2378]\d{8}$/.test(cleaned)) {
    return `+61${cleaned.slice(1)}`;
  }

  // 9-digit format without leading 0 (e.g. 412345678)
  if (/^4\d{8}$/.test(cleaned)) {
    return `+61${cleaned}`;
  }

  return null;
}

export function isValidAustralianPhone(raw: string): boolean {
  return normalizeAustralianPhone(raw) !== null;
}

export function formatAustralianPhoneDisplay(e164: string): string {
  if (!e164 || !e164.startsWith("+61")) return e164;
  const digits = e164.slice(3);
  if (digits.startsWith("4") && digits.length === 9) {
    // Mobile format: 04XX XXX XXX
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    // Landline format: (0X) XXXX XXXX
    return `(0${digits.slice(0, 1)}) ${digits.slice(1, 5)} ${digits.slice(5)}`;
  }
  return e164;
}
