/**
 * Australian Date & Time Formatting Utilities
 *
 * All dates are stored as UTC timestamps in the database and formatted into
 * Australian local time (Australia/Sydney) on display.
 * The formatter automatically accounts for Australian Daylight Saving Time (AEDT / AEST)
 * without hardcoding UTC offsets.
 */

export const AUSTRALIAN_TIMEZONE = "Australia/Sydney";

/**
 * Formats a date into Australian date + time: "DD/MM/YYYY, HH:MM AM/PM"
 * Example: "24/11/2026, 10:45 AM"
 */
export function formatAustralianDateTime(
  dateInput: string | number | Date | null | undefined,
  fallback = "Not available"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: AUSTRALIAN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats a date into Australian date only: "DD/MM/YYYY"
 * Example: "24/11/2026"
 */
export function formatAustralianDate(
  dateInput: string | number | Date | null | undefined,
  fallback = "Not available"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: AUSTRALIAN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a date into Australian time only: "HH:MM AM/PM"
 * Example: "10:45 AM"
 */
export function formatAustralianTime(
  dateInput: string | number | Date | null | undefined,
  fallback = "Not available"
): string {
  if (!dateInput) return fallback;
  const date = typeof dateInput === "object" && dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: AUSTRALIAN_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
