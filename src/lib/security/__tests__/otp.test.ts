import { describe, it, expect } from "vitest";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  createVerificationToken,
  verifyVerificationToken,
  getOtpSigningSecret,
} from "../otp";

describe("OTP Generation & Security", () => {
  it("generates a 6-digit numeric string", () => {
    const code = generateSecureOtp();
    expect(code).toMatch(/^\d{6}$/);
    const num = parseInt(code, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThanOrEqual(999999);
  });

  it("hashes OTP consistently and timing-safely verifies", () => {
    const code = "839201";
    const salt = "+61412345678";
    const hash = hashOtp(code, salt);

    expect(hash).toHaveLength(64); // SHA-256 hex is 64 chars
    expect(verifyOtpHash(code, hash, salt)).toBe(true);
    expect(verifyOtpHash("839202", hash, salt)).toBe(false);
    expect(verifyOtpHash("000000", hash, salt)).toBe(false);
  });

  it("creates and verifies a signed cryptographic verification token", () => {
    const challengeId = "b9090fc9-270e-4361-9005-fc5b0db118a8";
    const phoneE164 = "+61412345678";
    const vehicleId = "c2114d64-7e53-4877-bb89-51000b0e91a9";

    const token = createVerificationToken({
      challengeId,
      phoneE164,
      vehicleId,
      expiresInSeconds: 300,
    });

    expect(token).toContain(".");

    const result = verifyVerificationToken(token, vehicleId);
    expect(result.valid).toBe(true);
    expect(result.phone).toBe(phoneE164);
    expect(result.challengeId).toBe(challengeId);
  });

  it("rejects token when vehicleId does not match", () => {
    const token = createVerificationToken({
      challengeId: "challenge-1",
      phoneE164: "+61412345678",
      vehicleId: "vehicle-A",
      expiresInSeconds: 300,
    });

    const result = verifyVerificationToken(token, "vehicle-B");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Token vehicle mismatch");
  });

  it("rejects tampered or malformed tokens", () => {
    const result1 = verifyVerificationToken("invalid.token");
    expect(result1.valid).toBe(false);

    const validToken = createVerificationToken({
      challengeId: "c1",
      phoneE164: "+61412345678",
      vehicleId: "v1",
    });
    const tampered = validToken.slice(0, -4) + "XXXX";
    const result2 = verifyVerificationToken(tampered);
    expect(result2.valid).toBe(false);
  });

  it("enforces mandatory OTP_SIGNING_SECRET in production", () => {
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.OTP_SIGNING_SECRET;

    try {
      // @ts-expect-error mutating for test
      process.env.NODE_ENV = "production";
      delete process.env.OTP_SIGNING_SECRET;
      expect(() => getOtpSigningSecret()).toThrow(/OTP_SIGNING_SECRET is mandatory/);

      process.env.OTP_SIGNING_SECRET = "too-short";
      expect(() => getOtpSigningSecret()).toThrow(/must be at least 32 characters/);

      process.env.OTP_SIGNING_SECRET = "this-is-a-valid-cryptographically-secure-secret-32-chars";
      expect(getOtpSigningSecret()).toBe("this-is-a-valid-cryptographically-secure-secret-32-chars");
    } finally {
      // @ts-expect-error restoring
      process.env.NODE_ENV = prevEnv;
      if (prevSecret) {
        process.env.OTP_SIGNING_SECRET = prevSecret;
      } else {
        delete process.env.OTP_SIGNING_SECRET;
      }
    }
  });
});
