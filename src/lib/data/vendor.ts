import { cache } from "react";
import {
  unstable_cache,
  revalidatePath,
  revalidateTag as nextRevalidateTag,
  updateTag as nextUpdateTag,
} from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type VendorContext = {
  setupError?: string;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    abn: string;
    branches: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
      address: string;
      status: string;
      phone: string | null;
      whatsapp: string | null;
    }>;
  }>;
};

export type VehicleLimitInfo = {
  currentCount: number;
  limit: number | null;
  hasLimit: boolean;
  canAddMore: boolean;
  planCode: string | null;
  hasActiveSubscription: boolean;
};

export async function getVehicleLimitInfo(organizationId: string): Promise<VehicleLimitInfo> {
  const supabase = createAdminClient();

  const [countResult, subResult] = await Promise.all([
    supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("subscriptions")
      .select("plan_code, status, stripe_subscription_id, current_period_end")
      .eq("organization_id", organizationId)
      .maybeSingle(),
  ]);

  if (countResult.error) {
    throw new Error(`Failed to count vehicles: ${countResult.error.message}`);
  }

  if (subResult.error) {
    throw new Error(`Failed to get subscription: ${subResult.error.message}`);
  }

  const currentCount = countResult.count ?? 0;
  const subscription = subResult.data;

  // Strict subscription verification:
  // An active paid subscription requires status "active", a valid plan_code,
  // and a valid stripe_subscription_id. Trialing without payment is not eligible.
  // Also check if current_period_end has expired.
  const isStatusEligible = subscription?.status === "active";
  const hasStripeId = Boolean(subscription?.stripe_subscription_id);

  let isExpired = false;
  if (subscription?.current_period_end) {
    const periodEndMs = new Date(subscription.current_period_end).getTime();
    if (periodEndMs > 0 && periodEndMs < Date.now()) {
      isExpired = true;
    }
  }

  const hasActiveSubscription = Boolean(
    isStatusEligible &&
    subscription?.plan_code &&
    hasStripeId &&
    !isExpired
  );

  let planCode: string | null = null;
  let limit: number | null = null;

  if (hasActiveSubscription && subscription?.plan_code) {
    planCode = subscription.plan_code;
    const { data: plan } = await supabase
      .from("plans")
      .select("vehicle_limit")
      .eq("code", planCode)
      .single();
    limit = plan?.vehicle_limit ?? null;
  } else {
    // Unpaid or unsubscribed organizations receive 0 limit and CANNOT add vehicles.
    planCode = null;
    limit = 0;
  }

  // null limit means unlimited (enterprise/business plans)
  const hasLimit = limit !== null;
  const canAddMore = hasActiveSubscription && (!hasLimit || currentCount < (limit ?? 0));

  return {
    currentCount,
    limit,
    hasLimit,
    canAddMore,
    planCode,
    hasActiveSubscription,
  };
}

export async function enforceVehicleLimit(organizationId: string): Promise<void> {
  const limitInfo = await getVehicleLimitInfo(organizationId);

  if (!limitInfo.hasActiveSubscription) {
    throw new Error(
      "An active paid subscription (Starter, Growth, or Pro) is required to list vehicles. Please select a plan and complete payment to continue.",
    );
  }

  if (!limitInfo.canAddMore) {
    throw new Error(
      `Vehicle limit reached. Your ${limitInfo.planCode} plan allows ${limitInfo.limit} vehicles. ` +
      `Please upgrade your plan to add more vehicles.`,
    );
  }
}

export function safeInvalidateTag(tag: string) {
  try {
    (nextUpdateTag as unknown as (t: string) => void)(tag);
  } catch {}
  try {
    (nextRevalidateTag as unknown as (t: string, p?: string) => void)(tag, "max");
  } catch {
    try {
      (nextRevalidateTag as unknown as (t: string) => void)(tag);
    } catch {}
  }
}

export function invalidateVendorContext(userId: string) {
  safeInvalidateTag(`vendor-context-${userId}`);
  safeInvalidateTag("vendor-context");
  try {
    revalidatePath("/vendor/billing");
    revalidatePath("/vendor/upgrade");
    revalidatePath("/vendor/onboarding");
    revalidatePath("/vendor/dashboard");
    revalidatePath("/vendor/branches");
  } catch {}
}

export function invalidateVendorMetrics(organizationId: string, userId?: string) {
  safeInvalidateTag(`vendor-metrics-${organizationId}`);
  if (userId) {
    safeInvalidateTag(`vendor-context-${userId}`);
  }
  safeInvalidateTag("vendor-context");
  try {
    revalidatePath("/vendor/dashboard");
    revalidatePath("/vendor/billing");
    revalidatePath("/vendor/vehicles");
    revalidatePath("/vendor/branches");
  } catch {}
}

export async function fetchVendorContextFromDb(userId: string): Promise<VendorContext> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      role,
      organizations (
        id, name, slug, status, abn,
        branches (id, name, city, state, address, status, phone, whatsapp)
      )
    `)
    .eq("user_id", userId);

  if (error) {
    return {
      organizations: [],
      setupError:
        "Database tables are not available yet. Apply the Supabase migration before using vendor workflows.",
    };
  }

  if (!data || data.length === 0) {
    return { organizations: [] };
  }

  // Filter out any members that don't have an associated organization (shouldn't happen, but safe)
  // and map to the required structure
  const organizations = data
    .filter((row) => row.organizations != null)
    .map((row) => {
      // Cast because Supabase nested queries typing can be strict
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = row.organizations as any;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        abn: org.abn,
        // Ensure branches is an array
        branches: Array.isArray(org.branches)
          ? (org.branches as Array<Record<string, string | null>>).map((b) => ({
              id: String(b.id),
              name: String(b.name),
              city: String(b.city),
              state: String(b.state),
              address: String(b.address),
              status: String(b.status),
              phone: b.phone ? String(b.phone) : null,
              whatsapp: b.whatsapp ? String(b.whatsapp) : null,
            }))
          : [],
      };
    });

  return { organizations };
}

export const getVendorContext = cache(async function getVendorContext(userId: string): Promise<VendorContext> {
  return unstable_cache(
    async (id: string) => {
      return fetchVendorContextFromDb(id);
    },
    [`vendor-context-${userId}`],
    { tags: [`vendor-context-${userId}`, "vendor-context"], revalidate: 3600 }
  )(userId);
});

export async function ensureUserCanManageOrganization(
  userId: string,
  organizationId: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .in("role", ["owner", "admin", "manager"])
    .maybeSingle();

  if (error || !data) {
    throw new Error("You do not have permission to manage this organization.");
  }
}

export type LeadWithVehicle = {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupCity: string;
  startDate: string;
  endDate: string;
  message: string | null;
  status: "new" | "contacted" | "converted" | "lost";
  createdAt: string;
  assignedViaLocation?: boolean;
  phoneVerified?: boolean;
  snapshotPricePerDayAud?: number | null;
  snapshotOfferPriceAud?: number | null;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    actorName?: string;
  }>;
};

export async function getOrganizationLeads(
  organizationId: string,
  userId: string,
  options: {
    status?: "new" | "contacted" | "converted" | "lost";
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ leads: LeadWithVehicle[]; total: number }> {
  await ensureUserCanManageOrganization(userId, organizationId);

  const supabase = createAdminClient();
  const { status, limit = 50, offset = 0 } = options;

  // Retrieve any leads assigned to this organization via location matching
  const { data: assignments } = await supabase
    .from("lead_vendor_assignments")
    .select("lead_id, status")
    .eq("organization_id", organizationId);

  const assignmentStatusMap = new Map<string, string>();
  for (const a of assignments ?? []) {
    assignmentStatusMap.set(a.lead_id, a.status);
  }

  const assignedLeadIds = assignments?.map((a) => a.lead_id) ?? [];

  let query = supabase
    .from("leads")
    .select(
      `
      id,
      vendor_id,
      vehicle_id,
      vehicles(title),
      customer_name,
      customer_email,
      customer_phone,
      pickup_city,
      start_date,
      end_date,
      message,
      status,
      phone_verified,
      snapshot_price_per_day_aud,
      snapshot_offer_price_aud,
      created_at,
      lead_events(id, event_type, created_at, profiles(full_name))
    `,
    );

  if (assignedLeadIds.length > 0) {
    query = query.or(`vendor_id.eq.${organizationId},id.in.(${assignedLeadIds.join(",")})`);
  } else {
    query = query.eq("vendor_id", organizationId);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  // Map each lead to its organization-specific effective status
  const allLeads = (data ?? []).map((lead) => {
    const raw = assignmentStatusMap.get(lead.id);
    const effectiveStatus = ((raw === "closed" ? "lost" : raw) || lead.status) as LeadWithVehicle["status"];
    return { lead, effectiveStatus };
  });

  // Filter by isolated status if requested
  const filtered = status
    ? allLeads.filter((item) => item.effectiveStatus === status)
    : allLeads;

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  const leads: LeadWithVehicle[] = paginated.map(({ lead, effectiveStatus }) => {
    const vehicle = lead.vehicles as unknown as { title: string } | null;
    const events = (lead.lead_events as unknown as Array<{
      id: string;
      event_type: string;
      created_at: string;
      profiles: { full_name: string } | null;
    }>) ?? [];

    return {
      id: lead.id,
      vehicleId: lead.vehicle_id,
      vehicleTitle: vehicle?.title ?? "General Enquiry",
      customerName: lead.customer_name,
      customerEmail: lead.customer_email,
      customerPhone: lead.customer_phone,
      pickupCity: lead.pickup_city,
      startDate: lead.start_date,
      endDate: lead.end_date,
      message: lead.message,
      status: effectiveStatus,
      createdAt: lead.created_at,
      assignedViaLocation: lead.vendor_id !== organizationId,
      phoneVerified: Boolean(lead.phone_verified),
      snapshotPricePerDayAud: lead.snapshot_price_per_day_aud ?? null,
      snapshotOfferPriceAud: lead.snapshot_offer_price_aud ?? null,
      events: events.map((e) => ({
        id: e.id,
        eventType: e.event_type,
        createdAt: e.created_at,
        actorName: e.profiles?.full_name ?? undefined,
      })),
    };
  });

  return { leads, total };
}

export async function getLeadStats(organizationId: string, userId: string) {
  await ensureUserCanManageOrganization(userId, organizationId);

  const supabase = createAdminClient();

  // Include location assigned leads
  const { data: assignments } = await supabase
    .from("lead_vendor_assignments")
    .select("lead_id, status")
    .eq("organization_id", organizationId);

  const assignmentStatusMap = new Map<string, string>();
  for (const a of assignments ?? []) {
    assignmentStatusMap.set(a.lead_id, a.status);
  }

  const assignedLeadIds = assignments?.map((a) => a.lead_id) ?? [];

  let query = supabase.from("leads").select("id, status");

  if (assignedLeadIds.length > 0) {
    query = query.or(`vendor_id.eq.${organizationId},id.in.(${assignedLeadIds.join(",")})`);
  } else {
    query = query.eq("vendor_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch lead stats: ${error.message}`);
  }

  const effectiveLeads = (data ?? []).map((l) => {
    const raw = assignmentStatusMap.get(l.id);
    return (raw === "closed" ? "lost" : raw) || l.status;
  });

  const stats = {
    total: effectiveLeads.length,
    new: effectiveLeads.filter((s) => s === "new").length,
    contacted: effectiveLeads.filter((s) => s === "contacted").length,
    converted: effectiveLeads.filter((s) => s === "converted").length,
    lost: effectiveLeads.filter((s) => s === "lost").length,
  };

  return stats;
}

export type DashboardMetrics = {
  vehicleCount: number;
  activeListings: number;
  pendingListings: number;
  newLeads: number;
  totalLeads: number;
  planLimit: number | null;
  planCode: string | null;
  planUsage: string;
  branchCount: number;
  clickStats: {
    phone: number;
    whatsapp: number;
    total: number;
  };
  totalViews: number;
};

export async function getDashboardMetrics(
  organizationId: string,
  userId: string,
): Promise<DashboardMetrics> {
  await ensureUserCanManageOrganization(userId, organizationId);

  return unstable_cache(
    async (orgId: string) => {
      const supabase = createAdminClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        metricsRes,
        limitInfo,
        branchRes,
      ] = await Promise.all([
        supabase.rpc("get_vendor_dashboard_metrics", { org_id: orgId }).single(),
        getVehicleLimitInfo(orgId),
        supabase.from("branches").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      ]);

      if (metricsRes.error) throw new Error(`Failed to fetch metrics: ${metricsRes.error.message}`);
      if (branchRes.error) throw new Error(`Failed to fetch branches: ${branchRes.error.message}`);

      const metrics = metricsRes.data as {
        total_views: number;
        active_listings: number;
        pending_listings: number;
        total_vehicles: number;
        new_leads: number;
        total_leads: number;
        phone_clicks_30d: number;
        whatsapp_clicks_30d: number;
        total_clicks_30d: number;
      };
      const branchCount = branchRes.count;

      return {
        vehicleCount: metrics.total_vehicles,
        activeListings: metrics.active_listings,
        pendingListings: metrics.pending_listings,
        newLeads: metrics.new_leads,
        totalLeads: metrics.total_leads,
        planLimit: limitInfo.limit,
        planCode: limitInfo.planCode,
        planUsage: limitInfo.hasLimit
          ? `${limitInfo.currentCount} / ${limitInfo.limit}`
          : `${limitInfo.currentCount} / ∞`,
        branchCount: branchCount ?? 0,
        clickStats: {
          phone: metrics.phone_clicks_30d,
          whatsapp: metrics.whatsapp_clicks_30d,
          total: metrics.total_clicks_30d,
        },
        totalViews: metrics.total_views,
      };
    },
    [`vendor-metrics-${organizationId}`],
    { tags: [`vendor-metrics-${organizationId}`], revalidate: 3600 }
  )(organizationId);
}
