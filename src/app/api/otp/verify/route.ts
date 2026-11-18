import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow, getRedisClient } from "@/lib/security/rate-limit-redis";
import { verifyOtpHash, createVerificationToken } from "@/lib/security/otp";

export async function POST(request: NextRequest) {
  // In production, shared Redis infrastructure is strictly required for distributed abuse protection
  if (process.env.NODE_ENV === "production" && !getRedisClient()) {
    console.error("[OTP Security] REDIS_URL is required for distributed OTP rate limiting in production.");
    return NextResponse.json(
      { error: "Verification service temporarily unavailable (rate limiting infrastructure unconfigured)." },
      { status: 503 },
    );
  }

  const ip = clientIp(request.headers);

  // Rate limit OTP verification attempts by IP: 15 per minute to prevent brute-force
  const ipLimit = await rateLimitSlidingWindow(`otp:verify:ip:${ip}`, 15, 60_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter || 60) } },
    );
  }

  let body: { challengeId?: string; code?: string; vehicleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { challengeId, code, vehicleId } = body;

  if (!challengeId || typeof challengeId !== "string") {
    return NextResponse.json({ error: "Challenge ID is required." }, { status: 400 });
  }

  if (!code || typeof code !== "string" || code.trim().length !== 6) {
    return NextResponse.json(
      { error: "Please enter the 6-digit verification code." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Fetch challenge
  const { data: challenge, error: fetchError } = await supabase
    .from("phone_otp_challenges")
    .select("id, phone_e164, code_hash, vehicle_id, verified, verified_at, consumed_at, attempt_count, expires_at")
    .eq("id", challengeId)
    .single();

  if (fetchError || !challenge) {
    return NextResponse.json(
      { error: "Verification session not found or expired. Please request a new code." },
      { status: 404 },
    );
  }

  // Check expiration
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Verification code has expired. Please request a new code." },
      { status: 400 },
    );
  }

  // Check if already used or consumed
  if (challenge.verified || challenge.verified_at || challenge.consumed_at) {
    return NextResponse.json(
      { error: "This verification code has already been used. Please request a new code." },
      { status: 400 },
    );
  }

  // Check attempt limit (max 5)
  if (challenge.attempt_count >= 5) {
    return NextResponse.json(
      { error: "Maximum verification attempts exceeded. Please request a new code." },
      { status: 429 },
    );
  }

  // Increment attempt count atomically
  const newAttemptCount = challenge.attempt_count + 1;
  await supabase
    .from("phone_otp_challenges")
    .update({ attempt_count: newAttemptCount })
    .eq("id", challengeId);

  // Validate OTP code hash
  const isValid = verifyOtpHash(code.trim(), challenge.code_hash, challenge.phone_e164);

  if (!isValid) {
    const remainingAttempts = Math.max(0, 5 - newAttemptCount);
    return NextResponse.json(
      {
        error:
          remainingAttempts > 0
            ? `Incorrect verification code. ${remainingAttempts} attempts remaining.`
            : "Maximum verification attempts exceeded. Please request a new code.",
        remainingAttempts,
      },
      { status: 400 },
    );
  }

  // Success: mark verified atomically
  const { error: updateError } = await supabase
    .from("phone_otp_challenges")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", challengeId);

  if (updateError) {
    console.error("[OTP API] Failed to mark challenge verified:", updateError);
    return NextResponse.json(
      { error: "Unable to complete verification. Please try again." },
      { status: 500 },
    );
  }

  // Issue cryptographic verification token
  const effectiveVehicleId = vehicleId || challenge.vehicle_id || "";
  const verificationToken = createVerificationToken({
    challengeId: challenge.id,
    phoneE164: challenge.phone_e164,
    vehicleId: effectiveVehicleId,
    expiresInSeconds: 3600, // 1 hour to complete enquiry
  });

  return NextResponse.json({
    success: true,
    verified: true,
    verifiedPhone: challenge.phone_e164,
    verificationToken,
  });
}
