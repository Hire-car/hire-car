import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp, hashIpForStorage } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { normalizeAustralianPhone } from "@/lib/phone/normalize";
import { generateSecureOtp, hashOtp } from "@/lib/security/otp";
import { sendOtpSms } from "@/lib/sms/sender";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const ipHash = hashIpForStorage(ip);

  // Rate limit by IP: max 10 requests per 10 minutes
  const ipLimit = await rateLimitSlidingWindow(`otp:ip:${ip}`, 10, 600_000);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter || 60) } },
    );
  }

  let body: { phone?: string; vehicleId?: string; vendorId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phone, vehicleId, vendorId } = body;

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
  }

  const normalizedPhone = normalizeAustralianPhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json(
      {
        error:
          "Please enter a valid Australian mobile number (e.g. 0412 345 678 or +61 412 345 678).",
      },
      { status: 400 },
    );
  }

  // Rate limit per phone number: max 4 requests per 10 minutes
  const phoneLimit = await rateLimitSlidingWindow(`otp:phone:${normalizedPhone}`, 4, 600_000);
  if (!phoneLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification requests for this number. Please try again later." },
      { status: 429, headers: { "Retry-After": String(phoneLimit.retryAfter || 60) } },
    );
  }

  const supabase = createAdminClient();

  // Enforce 60-second cooldown between resends for the same phone & vehicle
  const { data: recentChallenge } = await supabase
    .from("phone_otp_challenges")
    .select("id, created_at")
    .eq("phone_e164", normalizedPhone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentChallenge) {
    const elapsedSeconds = (Date.now() - new Date(recentChallenge.created_at).getTime()) / 1000;
    if (elapsedSeconds < 45) {
      const waitTime = Math.ceil(45 - elapsedSeconds);
      return NextResponse.json(
        {
          error: `Please wait ${waitTime} seconds before requesting another code.`,
          retryAfter: waitTime,
        },
        { status: 429 },
      );
    }
  }

  // Optional: fetch vehicle title for friendly SMS message
  let vehicleTitle = "your selected vehicle";
  if (vehicleId) {
    const { data: veh } = await supabase
      .from("vehicles")
      .select("title")
      .eq("id", vehicleId)
      .maybeSingle();
    if (veh?.title) {
      vehicleTitle = veh.title;
    }
  }

  const otpCode = generateSecureOtp();
  const salt = normalizedPhone;
  const codeHash = hashOtp(otpCode, salt);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute expiry

  // Insert challenge row into phone_otp_challenges
  const { data: challenge, error: insertError } = await supabase
    .from("phone_otp_challenges")
    .insert({
      phone_e164: normalizedPhone,
      code_hash: codeHash,
      vehicle_id: vehicleId || null,
      vendor_id: vendorId || null,
      verified: false,
      attempt_count: 0,
      ip_hash: ipHash,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !challenge) {
    console.error("[OTP API] Failed to create challenge:", insertError);
    return NextResponse.json(
      { error: "Unable to create verification session. Please try again." },
      { status: 500 },
    );
  }

  // Send SMS
  const smsResult = await sendOtpSms({
    phoneE164: normalizedPhone,
    code: otpCode,
    vehicleTitle,
  });

  const isDev = process.env.NODE_ENV !== "production";

  return NextResponse.json(
    {
      success: true,
      challengeId: challenge.id,
      phone: normalizedPhone,
      expiresAt,
      resendAfter: 45,
      smsConfigured: smsResult.delivered || smsResult.provider === "twilio",
      // Include devCode ONLY in non-production environments to allow testing without live SMS
      devCode: isDev ? otpCode : undefined,
    },
    { status: 201 },
  );
}
