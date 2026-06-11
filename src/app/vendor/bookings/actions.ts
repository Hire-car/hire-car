"use server";

import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVendorContext } from "@/lib/data/vendor";
import { sendBookingRequestConfirmation, sendVendorBookingAlert } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRentalDays(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (!start || !end) return null;

  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  if (diff < 0) return null;

  return diff + 1;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function updateBookingStatus(bookingId: string, status: string, organizationId: string) {
  const user = await requireUser();
  const context = await getVendorContext(user.id);
  const org = context.organizations.find((o) => o.id === organizationId);
  if (!org) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Failed to update booking: ${error.message}`);

  revalidatePath("/vendor/bookings");
  return { success: true };
}

export async function createPublicBooking(input: {
  vehicleId: string;
  organizationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
}) {
  const supabase = createAdminClient();
  const customerName = input.customerName.trim();
  const customerEmail = normalizeEmail(input.customerEmail);
  const customerPhone = input.customerPhone?.trim() || null;
  const rentalDays = getRentalDays(input.startDate, input.endDate);

  if (customerName.length < 2) {
    throw new Error("Please enter your full name.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (!rentalDays || rentalDays > 365) {
    throw new Error("Please choose a valid pickup and return date range.");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = parseDateOnly(input.startDate);
  if (!start || start < today) {
    throw new Error("Pickup date cannot be in the past.");
  }

  // Validate vehicle is approved and calculate pricing server-side.
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, title, organization_id, price_per_day_aud")
    .eq("id", input.vehicleId)
    .eq("organization_id", input.organizationId)
    .eq("status", "approved")
    .single();

  if (!vehicle) throw new Error("Vehicle not found or not available.");

  const totalPrice = Number(vehicle.price_per_day_aud) * rentalDays;

  const { data: overlappingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("vehicle_id", input.vehicleId)
    .in("status", ["pending", "confirmed"])
    .lte("start_date", input.endDate)
    .gte("end_date", input.startDate)
    .limit(1)
    .maybeSingle();

  if (overlappingBooking) {
    throw new Error("This vehicle already has a booking request for those dates.");
  }

  // Get vendor billing email for notifications
  const { data: org } = await supabase
    .from("organizations")
    .select("billing_email")
    .eq("id", input.organizationId)
    .single();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      vehicle_id: input.vehicleId,
      organization_id: input.organizationId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      start_date: input.startDate,
      end_date: input.endDate,
      total_price_aud: totalPrice,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create booking: ${error.message}`);

  // Send confirmation to customer (non-blocking)
  sendBookingRequestConfirmation({
    to: customerEmail,
    customerName,
    vehicleTitle: vehicle.title,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice,
  }).catch((err) => console.error("[Booking] Customer email failed:", err));

  // Alert the vendor (non-blocking)
  const vendorNotificationEmail = org?.billing_email || process.env.CONTACT_EMAIL_TO;
  if (vendorNotificationEmail) {
    sendVendorBookingAlert({
      to: vendorNotificationEmail,
      vehicleTitle: vehicle.title,
      customerName,
      customerEmail,
      startDate: input.startDate,
      endDate: input.endDate,
      totalPrice,
    }).catch((err) => console.error("[Booking] Vendor email failed:", err));
  }

  // Create an in-app site notification for the vendor
  try {
    await supabase.from("notifications").insert({
      organization_id: input.organizationId,
      title: "New Booking Request",
      message: `${customerName} requested to book ${vehicle.title} from ${input.startDate} to ${input.endDate}.`,
      type: "info",
      link: "/vendor/bookings",
    });
  } catch {
    // Non-critical — don't fail the booking if notification insert fails
  }

  revalidatePath("/vendor/bookings");

  return { success: true, bookingId: booking.id, totalPrice };
}
