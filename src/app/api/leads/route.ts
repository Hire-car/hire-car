import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/security/auth";
import { sendCustomerEnquiryConfirmation, sendLeadAlert } from "@/lib/email/ses";
import { clientIp, hashIpForStorage } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { leadSchema } from "@/lib/validation/schemas";
import { normalizeAustralianPhone } from "@/lib/phone/normalize";
import { verifyVerificationToken } from "@/lib/security/otp";
import {
  assignLeadToLocationVendors,
  distributeGeneralLocationLead,
  findEligibleVendorsForLocation,
} from "@/lib/leads/location-matching";

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const ipHash = hashIpForStorage(ip);

  // Use distributed Redis rate limiting by IP (falls back to memory if Redis unavailable)
  const ipLimit = await rateLimitSlidingWindow(`lead:ip:${ip}`, 5, 60_000);

  if (!ipLimit.allowed) {
    console.info(`[Lead API] Rate limit hit for IP ${ip}`);
    return NextResponse.json(
      {
        error: "Too many lead submissions",
        retryAfter: ipLimit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter || 60) } },
    );
  }

  let rawBody;
  try {
    rawBody = await request.json();
  } catch {
    console.info(`[Lead API] Invalid JSON body from IP ${ip}`);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = leadSchema.safeParse(rawBody);

  if (!payload.success) {
    console.info(`[Lead API] Validation failed for IP ${ip}: ${payload.error.message}`);
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  // Anti-spam honeypot check: reject bot submissions immediately
  if (payload.data.honeypot) {
    console.warn(`[Lead API] Honeypot triggered from IP ${ip}`);
    return NextResponse.json({ error: "Unable to process submission" }, { status: 400 });
  }

  // Rate limit by email to prevent distributed botting
  const emailLimit = await rateLimitSlidingWindow(`lead:email:${payload.data.email}`, 3, 60_000);
  
  if (!emailLimit.allowed) {
    console.info(`[Lead API] Rate limit hit for email (ip ${ipHash})`);
    return NextResponse.json(
      {
        error: "Too many lead submissions for this email",
        retryAfter: emailLimit.retryAfter,
      },
      { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter || 60) } },
    );
  }

  if (payload.data.turnstileToken) {
    const challenge = await verifyTurnstile(payload.data.turnstileToken, ip);
    if (!challenge.ok) {
      console.info(`[Lead API] Turnstile challenge failed for IP ${ip}`);
      return NextResponse.json({ error: "Security challenge failed" }, { status: 403 });
    }
  } else {
    // If turnstileToken is absent, check whether Turnstile verification is strictly required
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret && process.env.TURNSTILE_OPTIONAL !== "true") {
      const challenge = await verifyTurnstile(undefined, ip);
      if (!challenge.ok) {
        console.info(`[Lead API] Security challenge required for IP ${ip}`);
        return NextResponse.json({ error: "Security challenge required" }, { status: 403 });
      }
    }
  }

  const supabase = createAdminClient();

  // Validate phone format
  const normalizedPhone = normalizeAustralianPhone(payload.data.phone);
  if (!normalizedPhone) {
    return NextResponse.json(
      { error: "Please enter a valid Australian mobile number (e.g. 0412 345 678 or +61 412 345 678)." },
      { status: 400 },
    );
  }

  // OTP mobile verification is postponed by client.
  // We record verified status if genuinely verified via token/auth, but never block unverified leads.
  // Phone ownership is never falsely marked as verified.
  let isPhoneVerified = false;

  if (payload.data.verificationToken) {
    const tokenResult = verifyVerificationToken(
      payload.data.verificationToken,
      payload.data.vehicleId,
    );
    if (tokenResult.valid && (!tokenResult.phone || tokenResult.phone === normalizedPhone)) {
      if (tokenResult.challengeId) {
        await supabase
          .from("phone_otp_challenges")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", tokenResult.challengeId)
          .eq("phone_e164", normalizedPhone)
          .eq("verified", true)
          .is("consumed_at", null)
          .gt("expires_at", new Date().toISOString());
      }
      isPhoneVerified = true;
    }
  }

  const currentUser = await getCurrentUser();

  if (!isPhoneVerified && currentUser) {
    if (currentUser.phone && Boolean(currentUser.phone_confirmed_at)) {
      const userPhone = normalizeAustralianPhone(currentUser.phone);
      if (userPhone === normalizedPhone) {
        isPhoneVerified = true;
      }
    }
  }

  const isVehicleSpecific = Boolean(payload.data.vehicleId && payload.data.vendorId);

  // -------------------------------------------------------------------------
  // GENERAL LOCATION ENQUIRY (No specific vehicle selected)
  // -------------------------------------------------------------------------
  if (!isVehicleSpecific) {
    // 1. Find all eligible vendors whose approved branches match the requested location
    const eligibleVendors = await findEligibleVendorsForLocation(payload.data.pickupCity);

    // 2. Check duplicate general enquiry within last hour (same email + pickup city without vehicle)
    const { data: duplicateLead } = await supabase
      .from("leads")
      .select("id")
      .is("vehicle_id", null)
      .eq("customer_email", payload.data.email)
      .eq("pickup_city", payload.data.pickupCity)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (duplicateLead) {
      console.info(`[Lead API] Returning existing general location lead ${duplicateLead.id}`);
      return NextResponse.json(
        { leadId: duplicateLead.id, duplicate: true },
        { status: 200 },
      );
    }

    const customerUserId = currentUser?.id ?? null;
    const primaryVendorId = eligibleVendors[0]?.organizationId ?? null;

    // 3. Insert lead record into existing leads table
    const { data: lead, error: insertError } = await supabase
      .from("leads")
      .insert({
        vehicle_id: null,
        vendor_id: primaryVendorId,
        customer_name: payload.data.name,
        customer_email: payload.data.email,
        customer_phone: normalizedPhone,
        customer_user_id: customerUserId,
        pickup_city: payload.data.pickupCity,
        start_date: payload.data.startDate,
        end_date: payload.data.endDate,
        message: payload.data.message || null,
        ip_hash: ipHash,
        status: "new",
        phone_verified: isPhoneVerified,
        snapshot_price_per_day_aud: null,
        snapshot_offer_price_aud: null,
      })
      .select("id")
      .single();

    if (insertError || !lead) {
      console.error(`[Lead API] Failed to save general location lead: ${insertError?.message}`);
      return NextResponse.json({ error: "Unable to save lead" }, { status: 500 });
    }

    // 4. Distribute to all eligible local vendors without duplicates
    const distribution = await distributeGeneralLocationLead({
      leadId: lead.id,
      pickupCity: payload.data.pickupCity,
      customerName: payload.data.name,
      startDate: payload.data.startDate,
      endDate: payload.data.endDate,
      message: payload.data.message,
    });

    // 5. Chat message thread if authenticated
    if (customerUserId) {
      await supabase.from("messages").insert({
        lead_id: lead.id,
        sender_user_id: customerUserId,
        body: payload.data.message || `I am looking for a vehicle in ${payload.data.pickupCity}.`,
      });
    }

    // 6. Log lead event
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event_type: "submitted",
      metadata: {
        ip_hash: ipHash,
        guest: !customerUserId,
        type: "general_location",
        matchedVendorsCount: distribution.assignedCount,
      },
    });

    // 7. Send customer confirmation
    try {
      await sendCustomerEnquiryConfirmation({
        to: payload.data.email,
        customerName: payload.data.name,
        vehicleTitle: `Car Hire in ${payload.data.pickupCity}`,
        leadId: lead.id,
      });
    } catch (emailErr) {
      console.warn(`[Lead API] Failed to send customer confirmation for general lead:`, emailErr);
    }

    return NextResponse.json(
      {
        leadId: lead.id,
        id: lead.id,
        type: "general_location",
        matchedVendorsCount: distribution.assignedCount,
        matchedVendors: distribution.matchedVendors.map((v) => v.name),
      },
      { status: 201 },
    );
  }

  // -------------------------------------------------------------------------
  // VEHICLE-SPECIFIC ENQUIRY
  // -------------------------------------------------------------------------
  // Validate vehicle exists and is approved
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, title, organization_id, status, branch_id, price_per_day_aud, offer_price_aud")
    .eq("id", payload.data.vehicleId)
    .eq("organization_id", payload.data.vendorId)
    .eq("status", "approved")
    .single();

  if (vehicleError || !vehicle) {
    console.info(`[Lead API] Vehicle not found or not approved: ${payload.data.vehicleId}`);
    return NextResponse.json(
      { error: "Invalid vehicle or vehicle not available" },
      { status: 400 },
    );
  }

  // Validate organization is approved
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, status, billing_email")
    .eq("id", payload.data.vendorId)
    .eq("status", "approved")
    .single();

  if (orgError || !organization) {
    console.info(`[Lead API] Organization not found or not approved: ${payload.data.vendorId}`);
    return NextResponse.json(
      { error: "Invalid vendor or vendor not available" },
      { status: 400 },
    );
  }

  // SECURITY: Validate pickup city matches one of the vendor's branch cities
  // This prevents spam leads with fake pickup locations
  const { data: branches } = await supabase
    .from("branches")
    .select("city")
    .eq("organization_id", payload.data.vendorId)
    .eq("status", "approved");

  const validCities = new Set(branches?.map((b) => b.city.toLowerCase()) ?? []);
  const requestedCity = payload.data.pickupCity.toLowerCase();

  if (!validCities.has(requestedCity)) {
    console.info(`[Lead API] Spam attempt detected: City ${payload.data.pickupCity} not valid for vendor ${payload.data.vendorId}`);
    
    // Log potential spam/fraud attempt but DO NOT block the lead 
    // because users might type partial city names (e.g. "Syd" instead of "Sydney")
    await supabase.from("fraud_flags").insert({
      resource_type: "lead_attempt",
      resource_id: payload.data.vehicleId,
      severity: "low",
      reason: `Pickup city "${payload.data.pickupCity}" does not strictly match vendor's branch cities: ${Array.from(validCities).join(", ")}`,
      status: "open",
    });
  }

  // Check for duplicate lead within last hour (same email + vehicle)
  const { data: duplicateLead } = await supabase
    .from("leads")
    .select("id")
    .eq("vehicle_id", payload.data.vehicleId)
    .eq("customer_email", payload.data.email)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .maybeSingle();

  if (duplicateLead) {
    console.info(`[Lead API] Returning existing lead ${duplicateLead.id} for vehicle ${payload.data.vehicleId}`);
    return NextResponse.json(
      { leadId: duplicateLead.id, duplicate: true },
      { status: 200 },
    );
  }

  // Associate authenticated customer ID when logged in; support null for guest customers
  const customerUserId = currentUser?.id ?? null;

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      vehicle_id: payload.data.vehicleId,
      vendor_id: payload.data.vendorId,
      customer_name: payload.data.name,
      customer_email: payload.data.email,
      customer_phone: normalizedPhone,
      customer_user_id: customerUserId,
      pickup_city: payload.data.pickupCity,
      start_date: payload.data.startDate,
      end_date: payload.data.endDate,
      message: payload.data.message,
      ip_hash: ipHash,
      status: "new",
      phone_verified: isPhoneVerified,
      snapshot_price_per_day_aud: vehicle.price_per_day_aud,
      snapshot_offer_price_aud: vehicle.offer_price_aud || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[Lead API] Failed to save lead: ${error.message}`);
    return NextResponse.json({ error: "Unable to save lead" }, { status: 500 });
  }

  // Location-based lead distribution to eligible local vendors (Requirement 2)
  try {
    await assignLeadToLocationVendors({
      leadId: lead.id,
      pickupCity: payload.data.pickupCity,
      primaryVendorId: payload.data.vendorId!,
      customerName: payload.data.name,
      vehicleTitle: vehicle.title,
      startDate: payload.data.startDate,
      endDate: payload.data.endDate,
    });
  } catch (assignErr) {
    console.warn("[Lead API] Location lead distribution failed (non-fatal):", assignErr);
  }
  // If user is authenticated, also create initial message in chat thread
  if (customerUserId) {
    await supabase.from("messages").insert({
      lead_id: lead.id,
      sender_user_id: customerUserId,
      body: payload.data.message || "I am interested in booking this vehicle.",
    });
  }

  // Log lead event
  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    event_type: "submitted",
    metadata: { ip_hash: ipHash, guest: !customerUserId },
  });

  // Notify vendor dashboard
  try {
    await supabase.from("notifications").insert({
      organization_id: payload.data.vendorId!,
      title: "New Booking Request",
      message: `${payload.data.name} requested to book ${vehicle.title} (${payload.data.startDate} to ${payload.data.endDate})`,
      type: "info",
      link: `/vendor/leads/${lead.id}`,
    });
  } catch (notifErr) {
    console.error(`[Lead API] Failed to create notification for lead ${lead.id}:`, notifErr);
  }

  // Send lead alert to vendor's actual billing email
  const vendorEmail = organization.billing_email;
  if (vendorEmail) {
    try {
      await sendLeadAlert({
        to: vendorEmail,
        vehicleTitle: vehicle.title,
        customerName: payload.data.name,
      });
      console.info(`[Lead API] Successfully processed lead ${lead.id} and sent vendor alert`);
    } catch (emailErr) {
      console.error(`[Lead API] Lead ${lead.id} created but failed to send email:`, emailErr);
    }
  } else {
    console.info(`[Lead API] Successfully processed lead ${lead.id} but vendor has no billing email`);
  }

  try {
    await sendCustomerEnquiryConfirmation({
      to: payload.data.email,
      customerName: payload.data.name,
      vehicleTitle: vehicle.title,
      leadId: lead.id,
    });
  } catch (emailErr) {
    console.error(`[Lead API] Lead ${lead.id} created but failed to send customer confirmation:`, emailErr);
  }

  return NextResponse.json({ leadId: lead.id, id: lead.id }, { status: 201 });
}
