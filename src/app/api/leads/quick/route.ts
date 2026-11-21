import { NextResponse, type NextRequest } from "next/server";
import { readJsonBody } from "@/lib/api/request";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerEnquiryConfirmation, sendLeadAlert } from "@/lib/email/ses";
import { getCurrentUser } from "@/lib/security/auth";
import { clientIp, hashIpForStorage } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { normalizeAustralianPhone } from "@/lib/phone/normalize";
import { verifyVerificationToken } from "@/lib/security/otp";
import { assignLeadToLocationVendors } from "@/lib/leads/location-matching";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const ip = clientIp(request.headers);
    const ipHash = hashIpForStorage(ip);
    const { data: body, response: jsonError } = await readJsonBody(request);
    if (jsonError) return jsonError;
    
    const { vehicleId, vendorId } = body;
    
    if (!vehicleId || !vendorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Resolve customer contact details (authenticated profile or guest body parameters)
    let customerName = "";
    let customerEmail = "";
    let customerPhone = "";
    const customerUserId = user?.id || null;

    if (user) {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        console.error("[quick lead] User profile query error:", profileErr);
      }

      customerName = profile?.full_name || body.name || body.customerName || "Customer";
      customerEmail = profile?.email || body.email || body.customerEmail || "";
      customerPhone = profile?.phone || body.phone || body.customerPhone || "Not provided";
    } else {
      customerName = body.name || body.customerName || "";
      customerEmail = body.email || body.customerEmail || "";
      customerPhone = body.phone || body.customerPhone || "Not provided";
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Please enter your contact details to submit your booking request." },
        { status: 400 }
      );
    }

    // Turnstile & Anti-bot protection for guest enquiries
    if (!user) {
      if (body.turnstileToken) {
        const challenge = await verifyTurnstile(body.turnstileToken, ip);
        if (!challenge.ok) {
          return NextResponse.json({ error: "Security challenge failed" }, { status: 403 });
        }
      } else if (process.env.TURNSTILE_SECRET_KEY && process.env.TURNSTILE_OPTIONAL !== "true") {
        const challenge = await verifyTurnstile(undefined, ip);
        if (!challenge.ok) {
          return NextResponse.json({ error: "Security challenge required" }, { status: 403 });
        }
      }
    }

    // Phone normalization (OTP postponed by client)
    const normalizedPhone = normalizeAustralianPhone(customerPhone) || customerPhone;
    let isPhoneVerified = false;

    if (body.verificationToken) {
      const tokenResult = verifyVerificationToken(body.verificationToken, vehicleId);
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

    if (!isPhoneVerified && user) {
      const u = user;
      const userPhone = u.phone ? normalizeAustralianPhone(u.phone) : null;
      const isAuthPhoneConfirmed = Boolean(u.phone_confirmed_at);
      if (userPhone && userPhone === normalizedPhone && isAuthPhoneConfirmed) {
        isPhoneVerified = true;
      }
    }

    // 2. Validate vehicle and vendor
    const { data: vehicle, error: vehicleErr } = await supabase
      .from("vehicles")
      .select("id, branch_id, title, price_per_day_aud, offer_price_aud")
      .eq("id", vehicleId)
      .eq("organization_id", vendorId)
      .eq("status", "approved")
      .maybeSingle();

    if (vehicleErr) {
      console.error("[quick lead] Vehicle query error:", vehicleErr);
    }

    if (!vehicle) {
      console.warn("[quick lead] Vehicle not found, not approved, or org mismatch:", { vehicleId, vendorId });
      return NextResponse.json({ error: "Vehicle not available" }, { status: 404 });
    }

    const { data: organization, error: orgErr } = await supabase
      .from("organizations")
      .select("billing_email")
      .eq("id", vendorId)
      .maybeSingle();

    if (orgErr) {
      console.error("[quick lead] Organization query error:", orgErr);
    }

    // Get pickup city from branch
    const { data: branch, error: branchErr } = await supabase
      .from("branches")
      .select("city")
      .eq("id", vehicle.branch_id)
      .maybeSingle();

    if (branchErr) {
      console.error("[quick lead] Branch query error:", branchErr);
    }

    // 3. Prevent duplicate leads in short timeframe
    const { data: duplicateLead, error: duplicateErr } = await supabase
      .from("leads")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("customer_email", customerEmail)
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (duplicateErr) {
      console.error("[quick lead] Duplicate check query error:", duplicateErr);
    }

    if (duplicateLead) {
      console.info("[quick lead] Duplicate lead detected. Reusing lead ID:", duplicateLead.id);
      return NextResponse.json({
        success: true,
        leadId: duplicateLead.id,
        duplicate: true,
      });
    }

    // 4. Create the lead
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() + 1);
    
    const defaultEnd = new Date(today);
    defaultEnd.setDate(today.getDate() + 4);

    const sd = body.startDate || defaultStart.toISOString().split('T')[0];
    const ed = body.endDate || defaultEnd.toISOString().split('T')[0];
    const msg = body.message || "I am interested in this vehicle. Please contact me via chat.";

    console.info("[quick lead] Creating lead record for customer:", customerEmail);
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        vehicle_id: vehicleId,
        vendor_id: vendorId,
        customer_name: customerName || "Customer",
        customer_email: customerEmail,
        customer_user_id: customerUserId,
        customer_phone: normalizedPhone || customerPhone || "Not provided",
        phone_verified: isPhoneVerified,
        snapshot_price_per_day_aud: vehicle.price_per_day_aud || null,
        snapshot_offer_price_aud: vehicle.offer_price_aud || null,
        pickup_city: branch?.city || "Unknown",
        start_date: sd,
        end_date: ed,
        message: msg,
        ip_hash: ipHash,
        status: "new",
      })
      .select("id")
      .maybeSingle();

    if (leadError) {
      console.error("[quick lead] Lead insertion failed with error:", leadError);
      return NextResponse.json({ error: "Failed to create lead", details: leadError.message }, { status: 500 });
    }

    if (!lead) {
      console.error("[quick lead] Lead insertion succeeded but returned no data.");
      return NextResponse.json({ error: "Failed to create lead: no record returned" }, { status: 500 });
    }

    console.info("[quick lead] Lead created successfully with ID:", lead.id);

    // Multi-vendor location lead distribution
    if (branch?.city) {
      try {
        await assignLeadToLocationVendors({
          leadId: lead.id,
          pickupCity: branch.city,
          primaryVendorId: vendorId,
          customerName: customerName || "Customer",
          vehicleTitle: vehicle.title,
          startDate: sd,
          endDate: ed,
        });
      } catch (locErr) {
        console.error("[quick lead] Location lead assignment error:", locErr);
      }
    }

    // 5. If customer is authenticated, auto-create the first message in the chat thread
    if (customerUserId) {
      const { error: messageError } = await supabase.from("messages").insert({
        lead_id: lead.id,
        sender_user_id: customerUserId,
        body: "I am interested in this vehicle. Is it still available?",
      });
      if (messageError) {
        console.error("[quick lead] Initial message creation failed:", messageError);
      } else {
        console.info("[quick lead] Initial message created successfully for lead:", lead.id);
      }
    }

    const { error: eventError } = await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event_type: "quick_interest_submitted",
      metadata: { ip_hash: ipHash, user_id: customerUserId, guest: !customerUserId },
      actor_user_id: customerUserId,
    });

    if (eventError) {
      console.error("[quick lead] Lead event creation failed:", eventError);
    }

    if (organization?.billing_email) {
      try {
        await sendLeadAlert({
          to: organization.billing_email,
          vehicleTitle: vehicle.title,
          customerName: customerName || "Customer",
        });
      } catch (emailErr) {
        console.error("[quick lead] vendor alert failed:", emailErr);
      }
    }

    try {
      await sendCustomerEnquiryConfirmation({
        to: customerEmail,
        customerName: customerName || "Customer",
        vehicleTitle: vehicle.title,
        leadId: lead.id,
      });
    } catch (emailErr) {
      console.error("[quick lead] customer confirmation failed:", emailErr);
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("Exception in quick lead API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
