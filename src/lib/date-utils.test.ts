import { describe, expect, it } from "vitest";
import {
  formatAustralianDateTime,
  formatAustralianDate,
  formatAustralianTime,
} from "./date-utils";

describe("Australian Date & Time formatting", () => {
  it("formats UTC timestamp to Sydney local time during Daylight Saving Time (AEDT = UTC+11)", () => {
    // 2026-11-24T00:15:00.000Z in AEDT (UTC+11) is 11:15 AM on 24/11/2026
    const isoString = "2026-11-24T00:15:00.000Z";
    
    const dateTime = formatAustralianDateTime(isoString);
    expect(dateTime).toMatch(/24\/11\/2026/);
    expect(dateTime).toMatch(/11:15\s*am/i);

    const dateOnly = formatAustralianDate(isoString);
    expect(dateOnly).toBe("24/11/2026");

    const timeOnly = formatAustralianTime(isoString);
    expect(timeOnly).toMatch(/11:15\s*am/i);
  });

  it("formats UTC timestamp to Sydney local time during Standard Time (AEST = UTC+10)", () => {
    // 2026-07-15T00:15:00.000Z in AEST (UTC+10) is 10:15 AM on 15/07/2026
    const isoString = "2026-07-15T00:15:00.000Z";

    const dateTime = formatAustralianDateTime(isoString);
    expect(dateTime).toMatch(/15\/07\/2026/);
    expect(dateTime).toMatch(/10:15\s*am/i);

    const dateOnly = formatAustralianDate(isoString);
    expect(dateOnly).toBe("15/07/2026");

    const timeOnly = formatAustralianTime(isoString);
    expect(timeOnly).toMatch(/10:15\s*am/i);
  });

  it("returns fallback 'Not available' for null, undefined, or invalid dates", () => {
    expect(formatAustralianDateTime(null)).toBe("Not available");
    expect(formatAustralianDateTime(undefined)).toBe("Not available");
    expect(formatAustralianDateTime("invalid-date")).toBe("Not available");
    expect(formatAustralianDate(null)).toBe("Not available");
    expect(formatAustralianTime(null)).toBe("Not available");
  });

  it("supports custom fallback text", () => {
    expect(formatAustralianDateTime(null, "No timestamp")).toBe("No timestamp");
  });
});
