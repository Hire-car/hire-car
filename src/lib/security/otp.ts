import crypto from "crypto";

const OTP_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.TURNSTILE_SECRET_KEY ||
  "hirecar-otp-secret-salt-key-2026";

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateSecureOtp(): string {
  const number = crypto.randomInt(100000, 999999);
  return number.toString();
}

/**
 * Hash an OTP code with SHA-256 and salt.
 * Plaintext OTP is NEVER stored in the database.
 */
export function hashOtp(code: string, salt: string = ""): string {
  return crypto
    .createHash("sha256")
    .update(`${OTP_SECRET}:${salt}:${code.trim()}`)
    .digest("hex");
}

/**
 * Timing-safe comparison of OTP hash to prevent side-channel timing attacks.
 */
export function verifyOtpHash(inputCode: string, storedHash: string, salt: string = ""): boolean {
  const computedHash = hashOtp(inputCode, salt);
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

/**
 * Create a cryptographically signed verification token after OTP verification.
 * Binds challenge ID, phone number, vehicle ID, and expiration.
 */
export function createVerificationToken(params: {
  challengeId: string;
  phoneE164: string;
  vehicleId: string;
  expiresInSeconds?: number;
}): string {
  const { challengeId, phoneE164, vehicleId, expiresInSeconds = 3600 } = params;
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const payload = Buffer.from(
    JSON.stringify({
      challengeId,
      phone: phoneE164,
      vehicleId,
      exp,
    }),
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify a verification token.
 * Ensures the token was signed by the server, is unexpired, and matches parameters.
 */
export function verifyVerificationToken(
  token: string,
  expectedVehicleId?: string,
): { valid: boolean; phone?: string; challengeId?: string; error?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Malformed token" };
    }

    const [payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedSigBuf = Buffer.from(expectedSig);

    if (
      sigBuf.length !== expectedSigBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedSigBuf)
    ) {
      return { valid: false, error: "Invalid signature" };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: "Verification token expired" };
    }

    if (expectedVehicleId && payload.vehicleId !== expectedVehicleId) {
      return { valid: false, error: "Token vehicle mismatch" };
    }

    return {
      valid: true,
      phone: payload.phone,
      challengeId: payload.challengeId,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Token verification failed" };
  }
}
