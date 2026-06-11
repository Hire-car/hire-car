import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clientIp } from "@/lib/security/rate-limit";
import { z } from "zod";

const reviewSchema = z.object({
  organizationId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  customerName: z.string().trim().min(2).max(120),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const payload = reviewSchema.safeParse(rawBody);

    if (!payload.success) {
      return NextResponse.json({ error: "Invalid review data provided" }, { status: 400 });
    }

    const ip = clientIp(request.headers);
    const challenge = await verifyTurnstile(payload.data.turnstileToken, ip);

    if (!challenge.ok) {
      return NextResponse.json({ error: "Security challenge failed" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Verify vendor
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", payload.data.organizationId)
      .eq("status", "approved")
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: "Invalid vendor or vendor not available" }, { status: 400 });
    }

    // Optional: verify vehicle if provided
    if (payload.data.vehicleId) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", payload.data.vehicleId)
        .eq("organization_id", payload.data.organizationId)
        .single();
        
      if (vehicleError || !vehicle) {
        return NextResponse.json({ error: "Invalid vehicle" }, { status: 400 });
      }
    }

    // Insert review
    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        organization_id: payload.data.organizationId,
        vehicle_id: payload.data.vehicleId || null,
        customer_name: payload.data.customerName,
        rating: payload.data.rating,
        body: payload.data.body,
        status: "pending", // admin must approve public reviews
      });

    if (insertError) {
      console.error("[Review API] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Review API] Exception:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
