import type { PlanCode } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanFeature =
  | "directContact"
  | "contactAnalytics"
  | "realtimeLeads"
  | "bulkUpload"
  | "featuredPlacement"
  | "aiSeoContent"
  | "apiAccess"
  | "prioritySupport";

const FEATURES_BY_PLAN: Record<PlanCode, PlanFeature[]> = {
  starter: [],
  growth: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
  ],
  pro: [
    "directContact",
    "contactAnalytics",
    "realtimeLeads",
    "bulkUpload",
    "featuredPlacement",
    "aiSeoContent",
    "apiAccess",
    "prioritySupport",
  ],
};

const BRANCH_LIMITS: Record<PlanCode, number | null> = {
  starter: 1,
  growth: 3,
  pro: null,
};

export function planHasFeature(
  planCode: string | null | undefined,
  feature: PlanFeature,
): boolean {
  if (!planCode) return false;
  const normalized = planCode.trim().toLowerCase() as PlanCode;
  const features = FEATURES_BY_PLAN[normalized];
  if (!features) return false;
  return features.includes(feature);
}

export function getBranchLimit(planCode: string | null | undefined): number | null {
  if (!planCode) return 0;
  const normalized = planCode.trim().toLowerCase() as PlanCode;
  const limit = BRANCH_LIMITS[normalized];
  if (limit === undefined) return 0;
  return limit;
}

export async function getOrganizationPlanCode(
  organizationId: string,
): Promise<PlanCode | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan_code, status, stripe_subscription_id, current_period_end")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return null;
  // A subscription is only valid if it has an authoritative Stripe subscription ID
  if (!data.stripe_subscription_id) return null;

  // If period end has expired, the subscription is not active
  if (data.current_period_end) {
    const isExpired = new Date(data.current_period_end).getTime() < Date.now();
    if (isExpired) return null;
  }

  return (data.plan_code as PlanCode) ?? null;
}

export async function organizationHasFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<boolean> {
  const planCode = await getOrganizationPlanCode(organizationId);
  return planHasFeature(planCode, feature);
}

export async function requirePlanFeature(
  organizationId: string,
  feature: PlanFeature,
): Promise<void> {
  const allowed = await organizationHasFeature(organizationId, feature);
  if (!allowed) {
    throw new Error(
      `Your current plan does not include this feature. Please upgrade to access it.`,
    );
  }
}

export function getSupportTierLabel(planCode: string | null | undefined): string {
  if (planCode === "pro") return "Dedicated Phone, Priority Email, Account Manager, Same-Day Response";
  if (planCode === "growth") return "Priority email + Phone support";
  return "Email support";
}
