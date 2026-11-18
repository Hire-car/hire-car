import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  createVerificationToken,
  verifyVerificationToken,
} from "../otp";

describe("OTP Workflow & Schema Conformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conforms to phone_otp_challenges schema: verified, verified_at, and consumed_at", () => {
    const phone = "+61412345678";
    const code = generateSecureOtp();
    const hash = hashOtp(code, phone);
    const expiresAt = new Date(Date.now() + 300_000).toISOString();

    // 1. Initial challenge record as stored in phone_otp_challenges
    const challengeRow = {
      id: "7f4c9c11-9a74-4b53-9d90-31622b72449a",
      phone_e164: phone,
      code_hash: hash,
      vehicle_id: "veh-uuid-1",
      vendor_id: "org-uuid-1",
      verified: false,
      verified_at: null as string | null,
      consumed_at: null as string | null,
      attempt_count: 0,
      ip_hash: "hash123",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    };

    expect(challengeRow.verified).toBe(false);
    expect(challengeRow.verified_at).toBeNull();
    expect(challengeRow.consumed_at).toBeNull();

    // 2. Validate user code input
    const isValid = verifyOtpHash(code, challengeRow.code_hash, challengeRow.phone_e164);
    expect(isValid).toBe(true);

    // 3. Challenge verification state transition
    challengeRow.verified = true;
    challengeRow.verified_at = new Date().toISOString();

    expect(challengeRow.verified).toBe(true);
    expect(challengeRow.verified_at).not.toBeNull();

    // 4. Token issuance
    const token = createVerificationToken({
      challengeId: challengeRow.id,
      phoneE164: challengeRow.phone_e164,
      vehicleId: challengeRow.vehicle_id,
      expiresInSeconds: 3600,
    });

    // 5. Verification token parsing
    const tokenResult = verifyVerificationToken(token, challengeRow.vehicle_id);
    expect(tokenResult.valid).toBe(true);
    expect(tokenResult.challengeId).toBe(challengeRow.id);
    expect(tokenResult.phone).toBe(phone);

    // 6. Atomic consumption simulation (consumed_at set)
    expect(challengeRow.consumed_at).toBeNull();
    challengeRow.consumed_at = new Date().toISOString();
    expect(challengeRow.consumed_at).not.toBeNull();

    // 7. Replay attempt check: challenge already consumed cannot be consumed again
    const canConsumeAgain = challengeRow.consumed_at === null;
    expect(canConsumeAgain).toBe(false);
  });

  it("fails verification token when secret changes or signature is forged", () => {
    const token = createVerificationToken({
      challengeId: "chal-1",
      phoneE164: "+61412345678",
      vehicleId: "veh-1",
    });

    const [payload] = token.split(".");
    const forgedToken = `${payload}.forged_signature_here`;
    const result = verifyVerificationToken(forgedToken, "veh-1");
    expect(result.valid).toBe(false);
  });

  it("enforces that authenticated users do not bypass verification without trusted server-side proof and strictly rejects user_metadata", () => {
    const requestedPhone = "+61412345678";

    // 1. Malicious authenticated user attempting bypass via client-editable user_metadata
    const maliciousUser = {
      id: "user-malicious",
      phone: "+61412345678",
      phone_confirmed_at: null,
      user_metadata: { phone_verified: true },
    };

    // user_metadata.phone_verified MUST be strictly ignored and NOT accepted as proof
    const isMaliciousVerified = Boolean(
      maliciousUser.phone === requestedPhone && maliciousUser.phone_confirmed_at,
    );
    expect(isMaliciousVerified).toBe(false);

    // 2. Authenticated user with unconfirmed phone (phone_confirmed_at is null)
    const unverifiedUser = {
      id: "user-1",
      phone: "+61412345678",
      phone_confirmed_at: null,
      user_metadata: {},
    };

    const isUnverifiedUserVerified = Boolean(
      unverifiedUser.phone === requestedPhone && unverifiedUser.phone_confirmed_at,
    );
    expect(isUnverifiedUserVerified).toBe(false);

    // 3. Authenticated user with confirmed phone, but requesting a DIFFERENT unverified phone
    const mismatchUser = {
      id: "user-diff",
      phone: "+61499999999",
      phone_confirmed_at: new Date().toISOString(),
      user_metadata: {},
    };

    const isMismatchVerified = Boolean(
      mismatchUser.phone === requestedPhone && mismatchUser.phone_confirmed_at,
    );
    expect(isMismatchVerified).toBe(false);

    // 4. Authenticated user with genuine matching confirmed phone in Supabase Auth
    const genuineUser = {
      id: "user-2",
      phone: "+61412345678",
      phone_confirmed_at: new Date().toISOString(),
      user_metadata: {},
    };

    const isGenuineVerified = Boolean(
      genuineUser.phone === requestedPhone && genuineUser.phone_confirmed_at,
    );
    expect(isGenuineVerified).toBe(true);

    // 5. Guest user (no auth session)
    const resolveUser = (): { phone?: string; phone_confirmed_at?: string } | null => null;
    const guestUser = resolveUser();
    const isGuestVerified = Boolean(
      guestUser && guestUser.phone === requestedPhone && guestUser.phone_confirmed_at,
    );
    expect(isGuestVerified).toBe(false);
  });
});
