/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminPendingReminderEmail, sendVendorUnreadLeadReminderEmail } from "@/lib/email/ses";

// This endpoint should be protected by a cron secret in production
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results = { adminReminded: false, vendorRemindersSent: 0 };

  // 1. Check for Pending Vendors and Vehicles to remind Admin
  const { count: pendingVendors } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: pendingVehicles } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if ((pendingVendors && pendingVendors > 0) || (pendingVehicles && pendingVehicles > 0)) {
    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "support@hirecarmarketplace.com.au";
    await sendAdminPendingReminderEmail({
      to: adminEmail,
      pendingVendorsCount: pendingVendors || 0,
      pendingVehiclesCount: pendingVehicles || 0,
    });
    results.adminReminded = true;
  }

  // 2. Check for Leads with 'new' status (unread/unresponded)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Find leads created before 24h ago that are still 'new'
  const { data: unreadLeads } = await supabase
    .from("leads")
    .select("id, organization_id, organizations(name, billing_email)")
    .eq("status", "new")
    .lt("created_at", twentyFourHoursAgo);

  if (unreadLeads && unreadLeads.length > 0) {
    // Group by organization
    const orgsToRemind = new Map<string, { email: string; name: string; count: number }>();
    
    for (const lead of unreadLeads) {
      const org = lead.organizations as unknown as { name: string; billing_email: string };
      if (!org || !org.billing_email) continue;
      
      if (!orgsToRemind.has(lead.organization_id)) {
        orgsToRemind.set(lead.organization_id, { email: org.billing_email, name: org.name, count: 0 });
      }
      orgsToRemind.get(lead.organization_id)!.count++;
    }

    // Send reminders to vendors
    for (const [orgId, data] of orgsToRemind.entries()) {
      await sendVendorUnreadLeadReminderEmail({
        to: data.email,
        vendorName: data.name,
        unreadCount: data.count,
      });
      results.vendorRemindersSent++;
    }
  }

  // 3. Check for recently 'converted' leads (e.g. 3 days ago) to send Review Requests
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: convertedLeads } = await supabase
    .from("leads")
    .select("id, customer_email, customer_name, vehicles(title), organizations(name)")
    .eq("status", "converted")
    .lt("updated_at", threeDaysAgo)
    .gte("updated_at", fourDaysAgo); // only within this 1-day window so we don't spam old ones

  let reviewRequestsSent = 0;
  if (convertedLeads && convertedLeads.length > 0) {
    const { sendReviewRequestEmail } = await import("@/lib/email/ses");
    for (const lead of convertedLeads) {
      if (!lead.customer_email) continue;
      const vTitle = lead.vehicles ? (lead.vehicles as any).title : "vehicle";
      const oName = lead.organizations ? (lead.organizations as any).name : "Vendor";
      
      await sendReviewRequestEmail({
        to: lead.customer_email,
        customerName: lead.customer_name || "there",
        vehicleTitle: vTitle,
        vendorName: oName,
        leadId: lead.id,
      }).catch(e => console.error("Failed to send review request email", e));
      reviewRequestsSent++;
    }
  }

  return NextResponse.json({ success: true, results: { ...results, reviewRequestsSent } });
}
