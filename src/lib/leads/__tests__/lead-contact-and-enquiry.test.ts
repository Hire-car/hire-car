import { describe, it, expect } from "vitest";
import { normalizeAustralianPhone, isValidAustralianPhone, formatAustralianPhoneDisplay } from "@/lib/phone/normalize";
import { leadSchema } from "@/lib/validation/schemas";

describe("Requirement 1: Phone Number Collection & Validation without OTP", () => {
  describe("Australian Mobile Phone Normalization", () => {
    it("normalizes standard domestic mobile 0412345678 to E.164 +61412345678", () => {
      expect(normalizeAustralianPhone("0412345678")).toBe("+61412345678");
    });

    it("normalizes spaced domestic mobile 0412 345 678 to E.164", () => {
      expect(normalizeAustralianPhone("0412 345 678")).toBe("+61412345678");
    });

    it("normalizes hyphenated domestic mobile 0412-345-678 to E.164", () => {
      expect(normalizeAustralianPhone("0412-345-678")).toBe("+61412345678");
    });

    it("normalizes international +61 412 345 678 to E.164", () => {
      expect(normalizeAustralianPhone("+61 412 345 678")).toBe("+61412345678");
    });

    it("normalizes unspaced international +61412345678 to E.164", () => {
      expect(normalizeAustralianPhone("+61412345678")).toBe("+61412345678");
    });

    it("normalizes country code without plus 61412345678 to E.164", () => {
      expect(normalizeAustralianPhone("61412345678")).toBe("+61412345678");
    });

    it("handles domestic landlines (02, 03, 07, 08)", () => {
      expect(normalizeAustralianPhone("02 9876 5432")).toBe("+61298765432");
      expect(normalizeAustralianPhone("03 9876 5432")).toBe("+61398765432");
    });

    it("rejects invalid, short, or foreign numbers", () => {
      expect(normalizeAustralianPhone("12345")).toBeNull();
      expect(normalizeAustralianPhone("0512345678")).toBeNull(); // 05 is not a valid AU area code
      expect(normalizeAustralianPhone("")).toBeNull();
      expect(normalizeAustralianPhone("abcdefghij")).toBeNull();
    });

    it("validates phone format correctly with isValidAustralianPhone", () => {
      expect(isValidAustralianPhone("0412 345 678")).toBe(true);
      expect(isValidAustralianPhone("+61412345678")).toBe(true);
      expect(isValidAustralianPhone("0412345678")).toBe(true);
      expect(isValidAustralianPhone("0400000000")).toBe(true);
      expect(isValidAustralianPhone("12345")).toBe(false);
      expect(isValidAustralianPhone("not-a-number")).toBe(false);
    });

    it("formats Australian phone for clean vendor UI display", () => {
      expect(formatAustralianPhoneDisplay("+61412345678")).toBe("0412 345 678");
    });
  });

  describe("Lead Schema Validation with Mandatory Phone Number", () => {
    const validLeadPayload = {
      vehicleId: "169c031b-fa29-4f6f-b510-632b9b07d9c4",
      vendorId: "8ac011c0-641d-49cd-be14-d1f4fd45da52",
      name: "Alex Customer",
      email: "alex@example.com",
      phone: "0412 345 678",
      pickupCity: "Sydney",
      startDate: "2026-12-01",
      endDate: "2026-12-05",
      message: "Looking for airport pickup.",
      consent: true,
    };

    it("accepts valid enquiry payload with phone and email", () => {
      const result = leadSchema.safeParse(validLeadPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("0412 345 678");
        expect(result.data.email).toBe("alex@example.com");
        expect(result.data.name).toBe("Alex Customer");
        expect(result.data.pickupCity).toBe("Sydney");
      }
    });

    it("rejects enquiry if phone number is missing or empty", () => {
      const invalid = { ...validLeadPayload, phone: "" };
      const result = leadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects enquiry if email address is invalid", () => {
      const invalid = { ...validLeadPayload, email: "not-an-email" };
      const result = leadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects enquiry if customer name is too short", () => {
      const invalid = { ...validLeadPayload, name: "A" };
      const result = leadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects enquiry if end date is before start date", () => {
      const invalid = { ...validLeadPayload, startDate: "2026-12-10", endDate: "2026-12-05" };
      const result = leadSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("does NOT require verificationToken for lead submission (OTP postponed)", () => {
      // verificationToken is optional in leadSchema
      const withoutToken = { ...validLeadPayload };
      delete (withoutToken as Record<string, unknown>).verificationToken;
      const result = leadSchema.safeParse(withoutToken);
      expect(result.success).toBe(true);
    });
  });
});
