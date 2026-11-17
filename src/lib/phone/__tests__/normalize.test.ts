import { describe, it, expect } from "vitest";
import {
  normalizeAustralianPhone,
  isValidAustralianPhone,
  formatAustralianPhoneDisplay,
} from "../normalize";

describe("Australian Phone Normalization", () => {
  it("normalizes standard mobile format with spaces", () => {
    expect(normalizeAustralianPhone("0412 345 678")).toBe("+61412345678");
  });

  it("normalizes mobile format without spaces", () => {
    expect(normalizeAustralianPhone("0412345678")).toBe("+61412345678");
  });

  it("normalizes E.164 mobile with plus", () => {
    expect(normalizeAustralianPhone("+61412345678")).toBe("+61412345678");
    expect(normalizeAustralianPhone("+61 412 345 678")).toBe("+61412345678");
  });

  it("normalizes 61 prefix without plus", () => {
    expect(normalizeAustralianPhone("61412345678")).toBe("+61412345678");
  });

  it("normalizes 9-digit format without leading 0", () => {
    expect(normalizeAustralianPhone("412345678")).toBe("+61412345678");
  });

  it("normalizes Australian landlines", () => {
    expect(normalizeAustralianPhone("02 9876 5432")).toBe("+61298765432");
    expect(normalizeAustralianPhone("03 9123 4567")).toBe("+61391234567");
    expect(normalizeAustralianPhone("07 3123 4567")).toBe("+61731234567");
    expect(normalizeAustralianPhone("08 8123 4567")).toBe("+61881234567");
  });

  it("rejects invalid or international non-Australian numbers", () => {
    expect(normalizeAustralianPhone("12345")).toBeNull();
    expect(normalizeAustralianPhone("abc")).toBeNull();
    expect(normalizeAustralianPhone("+14155552671")).toBeNull();
    expect(normalizeAustralianPhone("+447911123456")).toBeNull();
    expect(normalizeAustralianPhone("")).toBeNull();
  });

  it("correctly identifies validity via isValidAustralianPhone", () => {
    expect(isValidAustralianPhone("0412 345 678")).toBe(true);
    expect(isValidAustralianPhone("0400000000")).toBe(true);
    expect(isValidAustralianPhone("0298765432")).toBe(true);
    expect(isValidAustralianPhone("12345")).toBe(false);
    expect(isValidAustralianPhone("")).toBe(false);
  });

  it("formats Australian phone for clean display", () => {
    expect(formatAustralianPhoneDisplay("+61412345678")).toBe("0412 345 678");
    expect(formatAustralianPhoneDisplay("+61298765432")).toBe("(02) 9876 5432");
  });
});
