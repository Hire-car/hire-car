import { describe, expect, it, vi, beforeEach } from "vitest";
import { leadSchema } from "@/lib/validation/schemas";
import { verifyTurnstile } from "@/lib/security/turnstile";

describe("Guest Car Booking Validation (leadSchema)", () => {
  const validGuestBooking = {
    vehicleId: "169c031b-fa29-4f6f-b510-632b9b07d9c4",
    vendorId: "8ac011c0-641d-49cd-be14-d1f4fd45da52",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "0412345678",
    pickupCity: "Melbourne",
    startDate: "2026-11-10",
    endDate: "2026-11-15",
    message: "I am interested in booking this vehicle.",
    consent: true,
  };

  it("successfully validates a valid unauthenticated guest booking request without a turnstile token", () => {
    const result = leadSchema.safeParse(validGuestBooking);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane Doe");
      expect(result.data.email).toBe("jane.doe@example.com");
      expect(result.data.phone).toBe("0412345678");
      expect(result.data.pickupCity).toBe("Melbourne");
      expect(result.data.turnstileToken).toBeUndefined();
      expect(result.data.honeypot).toBe("");
    }
  });

  it("successfully validates a valid guest booking with turnstile token included", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      turnstileToken: "cf-token-12345",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnstileToken).toBe("cf-token-12345");
    }
  });

  it("rejects booking submission when full name is missing or too short", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("rejects booking submission when email is invalid", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      email: "invalid-email-address",
    });
    expect(result.success).toBe(false);
  });

  it("rejects booking submission when phone number is too short", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      phone: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects booking submission when pickup city is missing", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      pickupCity: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects booking submission when driver's license declaration (consent) is false", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects booking submission when end date is earlier than start date", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      startDate: "2026-11-15",
      endDate: "2026-11-10",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("End date must be on or after start date");
    }
  });

  it("preserves honeypot field value when submitted by a bot", () => {
    const result = leadSchema.safeParse({
      ...validGuestBooking,
      honeypot: "https://spam-bot.site",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.honeypot).toBe("https://spam-bot.site");
    }
  });
});

describe("Turnstile Security Verification Resilience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("gracefully skips verification and does not fail when TURNSTILE_SECRET_KEY is unset", async () => {
    const originalSecret = process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;

    try {
      const result = await verifyTurnstile("some-token", "127.0.0.1");
      expect(result.ok).toBe(true);
      expect(result.skipped).toBe(true);
    } finally {
      if (originalSecret) {
        process.env.TURNSTILE_SECRET_KEY = originalSecret;
      }
    }
  });

  it("rejects verification when TURNSTILE_SECRET_KEY is set but token is missing", async () => {
    const originalSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.TURNSTILE_SECRET_KEY = "dummy-secret-key";

    try {
      const result = await verifyTurnstile(undefined, "127.0.0.1");
      expect(result.ok).toBe(false);
      expect(result.skipped).toBe(false);
    } finally {
      if (originalSecret) {
        process.env.TURNSTILE_SECRET_KEY = originalSecret;
      } else {
        delete process.env.TURNSTILE_SECRET_KEY;
      }
    }
  });
});

