/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getStripePrice,
  getPlanFromStripePrice,
  createCheckoutSession,
} from "@/lib/billing/stripe";
import {
  fetchVendorContextFromDb,
  invalidateVendorContext,
  invalidateVendorMetrics,
  safeInvalidateTag,
} from "@/lib/data/vendor";
import { getBranchLimit } from "@/lib/plan-features";
import { getVehicleLimitInfo } from "@/lib/data/vendor";
import { getSupportConfig } from "@/lib/support-channels";

// Mock next/cache
vi.mock("next/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/cache")>();
  return {
    ...actual,
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
    unstable_cache: (fn: any) => fn,
  };
});

// Mock Stripe SDK
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      checkout = {
        sessions: {
          create: vi.fn().mockImplementation((params) =>
            Promise.resolve({
              id: "cs_test_session_xyz",
              url: "https://checkout.stripe.com/c/pay/cs_test_session_xyz",
              status: "open",
              ...params,
            }),
          ),
          retrieve: vi.fn().mockImplementation((id: string) =>
            Promise.resolve({
              id,
              status: "complete",
              payment_status: "paid",
              client_reference_id: "org-test-123",
              customer: "cus_test_123",
              subscription: "sub_test_123",
              metadata: {
                organization_id: "org-test-123",
                plan: "starter",
                interval: "monthly",
              },
            }),
          ),
        },
      };
      subscriptions = {
        retrieve: vi.fn().mockImplementation((id: string) =>
          Promise.resolve({
            id,
            status: "active",
            customer: "cus_test_123",
            metadata: {
              organization_id: "org-test-123",
              plan: "starter",
              interval: "monthly",
            },
            current_period_start: 1700000000,
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            items: {
              data: [
                {
                  price: {
                    id: "price_1UfcwCK6a8gBhUsThp733zee",
                  },
                },
              ],
            },
          }),
        ),
      };
      invoices = {
        list: vi.fn().mockResolvedValue({ data: [] }),
      };
    },
  };
});

// Mock Supabase admin client
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  limit: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "organization_members") {
        return {
          ...mockSupabaseQuery,
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: string) => {
            if (col === "user_id" && val === "user-with-org") {
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    role: "owner",
                    organizations: {
                      id: "org-abc",
                      name: "Alpha Rentals",
                      slug: "alpha-rentals",
                      status: "approved",
                      abn: "51824753556",
                      branches: [],
                    },
                  },
                  error: null,
                }),
                select: vi.fn().mockReturnThis(),
              };
            }
            return {
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              select: vi.fn().mockReturnThis(),
            };
          }),
        };
      }
      return mockSupabaseQuery;
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })),
}));

describe("Vendor Onboarding, Plan Selection & Stripe Payment Workflow Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_mock_secret_key",
      STRIPE_WEBHOOK_SECRET: "whsec_mock_test_secret",
      STRIPE_PRICE_STARTER_MONTHLY: "price_1UfcwCK6a8gBhUsThp733zee",
      STRIPE_PRICE_STARTER_ANNUAL: "price_1Ufd4pK6a8gBhUsTgrb80UQb",
      STRIPE_PRICE_GROWTH_MONTHLY: "price_1SZWbUK6a8gBhUsTCV0Wb0z2",
      STRIPE_PRICE_GROWTH_ANNUAL: "price_1SZWbVK6a8gBhUsTLM832mZ6",
      STRIPE_PRICE_PRO_MONTHLY: "price_1SZWbWK6a8gBhUsT1mY93vL7",
      STRIPE_PRICE_PRO_ANNUAL: "price_1SZWbXK6a8gBhUsTV81y5Z41",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Next.js Cache Invalidation & Tag Safety", () => {
    it("safeInvalidateTag executes without throwing outside request context", () => {
      expect(() => safeInvalidateTag("test-tag")).not.toThrow();
    });

    it("invalidateVendorContext purges vendor-context tags and revalidates billing and upgrade paths", async () => {
      const { revalidatePath } = await import("next/cache");
      expect(() => invalidateVendorContext("user-123")).not.toThrow();
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/billing");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/upgrade");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/onboarding");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/dashboard");
    });

    it("invalidateVendorMetrics purges organization metrics and revalidates dashboard and billing paths", async () => {
      const { revalidatePath } = await import("next/cache");
      expect(() => invalidateVendorMetrics("org-123", "user-123")).not.toThrow();
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/dashboard");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/billing");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/vehicles");
      expect(revalidatePath).toHaveBeenCalledWith("/vendor/branches");
    });
  });

  describe("2. Database Vendor Context Resolution & Stale-Cache Self-Healing", () => {
    it("fetchVendorContextFromDb returns empty organizations when user has no org", async () => {
      const result = await fetchVendorContextFromDb("non-existent-user");
      expect(result.organizations).toEqual([]);
    });

    it("fetchVendorContextFromDb returns organization when record exists in database", async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      (createAdminClient as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                role: "owner",
                organizations: {
                  id: "org-newly-created",
                  name: "Coastal Fleet",
                  slug: "coastal-fleet",
                  status: "approved",
                  abn: "51824753556",
                  branches: [
                    {
                      id: "branch-1",
                      name: "Head Office",
                      city: "Sydney",
                      state: "NSW",
                      address: "123 George St",
                      status: "approved",
                      phone: "0400000000",
                      whatsapp: null,
                    },
                  ],
                },
              },
            ],
            error: null,
          }),
        }),
      });

      const result = await fetchVendorContextFromDb("user-just-onboarded");
      expect(result.organizations.length).toBe(1);
      expect(result.organizations[0].name).toBe("Coastal Fleet");
      expect(result.organizations[0].branches.length).toBe(1);
    });
  });

  describe("3. All Three Plans (Starter, Growth, Pro) Authoritative Price ID Resolution", () => {
    it("resolves Starter Monthly to price_1UfcwCK6a8gBhUsThp733zee", () => {
      const priceId = getStripePrice("starter", "monthly");
      expect(priceId).toBe("price_1UfcwCK6a8gBhUsThp733zee");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "starter", interval: "monthly" });
    });

    it("resolves Starter Annual to price_1Ufd4pK6a8gBhUsTgrb80UQb", () => {
      const priceId = getStripePrice("starter", "annual");
      expect(priceId).toBe("price_1Ufd4pK6a8gBhUsTgrb80UQb");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "starter", interval: "annual" });
    });

    it("resolves Growth Monthly to price_1SZWbUK6a8gBhUsTCV0Wb0z2", () => {
      const priceId = getStripePrice("growth", "monthly");
      expect(priceId).toBe("price_1SZWbUK6a8gBhUsTCV0Wb0z2");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "growth", interval: "monthly" });
    });

    it("resolves Growth Annual to price_1SZWbVK6a8gBhUsTLM832mZ6", () => {
      const priceId = getStripePrice("growth", "annual");
      expect(priceId).toBe("price_1SZWbVK6a8gBhUsTLM832mZ6");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "growth", interval: "annual" });
    });

    it("resolves Pro Monthly to price_1SZWbWK6a8gBhUsT1mY93vL7", () => {
      const priceId = getStripePrice("pro", "monthly");
      expect(priceId).toBe("price_1SZWbWK6a8gBhUsT1mY93vL7");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "pro", interval: "monthly" });
    });

    it("resolves Pro Annual to price_1SZWbXK6a8gBhUsTV81y5Z41", () => {
      const priceId = getStripePrice("pro", "annual");
      expect(priceId).toBe("price_1SZWbXK6a8gBhUsTV81y5Z41");
      const planInfo = getPlanFromStripePrice(priceId);
      expect(planInfo).toEqual({ plan: "pro", interval: "annual" });
    });
  });

  describe("4. Unified Stripe Checkout Session Creation Across All Three Plans", () => {
    it("creates secure checkout session for Starter Monthly with payment_method_collection: 'always'", async () => {
      const session = await createCheckoutSession({
        plan: "starter",
        interval: "monthly",
        organizationId: "org-123",
        userId: "user-123",
        email: "starter@hirecar.com.au",
      });

      expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_test_session_xyz");
      expect((session as any).mode).toBe("subscription");
      expect((session as any).payment_method_collection).toBe("always");
      expect((session as any).line_items[0].price).toBe("price_1UfcwCK6a8gBhUsThp733zee");
      expect((session as any).metadata.plan).toBe("starter");
    });

    it("creates secure checkout session for Growth Annual with payment_method_collection: 'always'", async () => {
      const session = await createCheckoutSession({
        plan: "growth",
        interval: "annual",
        organizationId: "org-456",
        userId: "user-456",
        email: "growth@hirecar.com.au",
      });

      expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_test_session_xyz");
      expect((session as any).mode).toBe("subscription");
      expect((session as any).payment_method_collection).toBe("always");
      expect((session as any).line_items[0].price).toBe("price_1SZWbVK6a8gBhUsTLM832mZ6");
      expect((session as any).metadata.plan).toBe("growth");
    });

    it("creates secure checkout session for Pro Monthly with payment_method_collection: 'always'", async () => {
      const session = await createCheckoutSession({
        plan: "pro",
        interval: "monthly",
        organizationId: "org-789",
        userId: "user-789",
        email: "pro@hirecar.com.au",
      });

      expect(session.url).toBe("https://checkout.stripe.com/c/pay/cs_test_session_xyz");
      expect((session as any).mode).toBe("subscription");
      expect((session as any).payment_method_collection).toBe("always");
      expect((session as any).line_items[0].price).toBe("price_1SZWbWK6a8gBhUsT1mY93vL7");
      expect((session as any).metadata.plan).toBe("pro");
    });
  });

  describe("5. Post-Payment Sync & Cache Invalidation", () => {
    it("syncCheckoutSessionForOrganization synchronizes paid session and triggers cache invalidation", async () => {
      const { syncCheckoutSessionForOrganization } = await import(
        "@/lib/billing/sync-checkout-session"
      );

      const result = await syncCheckoutSessionForOrganization(
        "org-test-123",
        "cs_test_session_xyz",
      );

      expect(result.status).toBe("active");
      expect(result.plan).toBe("starter");
      expect(result.organizationId).toBe("org-test-123");
    });
  });

  describe("6. Entitlement & Limit Enforcement Preservation", () => {
    it("enforces vehicle limits strictly across all tiers", async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin");

      // 1. Unsubscribed -> limit 0
      (createAdminClient as any).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });
      const unsubscribedLimit = await getVehicleLimitInfo("org-no-sub");
      expect(unsubscribedLimit.limit).toBe(0);
      expect(unsubscribedLimit.canAddMore).toBe(false);

      // 2. Starter -> limit 5
      (createAdminClient as any).mockReturnValueOnce({
        from: vi.fn((table: string) => {
          if (table === "subscriptions") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  plan_code: "starter",
                  status: "active",
                  stripe_subscription_id: "sub_123",
                  current_period_end: new Date(Date.now() + 86400000).toISOString(),
                },
                error: null,
              }),
            };
          }
          if (table === "plans") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { vehicle_limit: 5 },
                error: null,
              }),
            };
          }
          if (table === "vehicles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
            };
          }
          return mockSupabaseQuery;
        }),
      });
      const starterLimit = await getVehicleLimitInfo("org-starter");
      expect(starterLimit.limit).toBe(5);
      expect(starterLimit.currentCount).toBe(2);
      expect(starterLimit.canAddMore).toBe(true);
    });

    it("enforces branch limits correctly across all plans", () => {
      expect(getBranchLimit(null)).toBe(0);
      expect(getBranchLimit(undefined)).toBe(0);
      expect(getBranchLimit("")).toBe(0);
      expect(getBranchLimit("starter")).toBe(1);
      expect(getBranchLimit("growth")).toBe(3);
      expect(getBranchLimit("pro")).toBe(10);
    });
  });

  describe("7. Strict No-Free-Trial Enforcement Across All Plans", () => {
    it("guarantees checkout sessions for all six plans have no trial days and require payment method upfront", async () => {
      const planConfigs = [
        { plan: "starter" as const, interval: "monthly" as const },
        { plan: "starter" as const, interval: "annual" as const },
        { plan: "growth" as const, interval: "monthly" as const },
        { plan: "growth" as const, interval: "annual" as const },
        { plan: "pro" as const, interval: "monthly" as const },
        { plan: "pro" as const, interval: "annual" as const },
      ];

      for (const cfg of planConfigs) {
        const session = await createCheckoutSession({
          plan: cfg.plan,
          interval: cfg.interval,
          organizationId: "org-no-trial",
          userId: "user-no-trial",
          email: "notrial@hirecar.com.au",
        });

        const rawSession = session as any;
        expect(rawSession.mode).toBe("subscription");
        expect(rawSession.payment_method_collection).toBe("always");
        expect(rawSession.subscription_data?.trial_period_days).toBeUndefined();
        expect(rawSession.subscription_data?.trial_end).toBeUndefined();
        expect(rawSession.subscription_data?.trial_settings).toBeUndefined();
        expect(rawSession.trial_period_days).toBeUndefined();
      }
    });

    it("denies premium support access if subscription status is 'trialing'", () => {
      // Active growth gets priority email + phone
      const activeGrowth = getSupportConfig("growth", "active");
      expect(activeGrowth.channels).toContain("phone");
      expect(activeGrowth.channels).toContain("priorityEmail");

      // Trialing growth is demoted to starter support (email only)
      const trialingGrowth = getSupportConfig("growth", "trialing");
      expect(trialingGrowth.channels).toEqual(["email"]);

      // Active pro gets dedicated phone + account manager
      const activePro = getSupportConfig("pro", "active");
      expect(activePro.channels).toContain("dedicatedPhone");
      expect(activePro.channels).toContain("accountManager");

      // Trialing pro is demoted to starter support (email only)
      const trialingPro = getSupportConfig("pro", "trialing");
      expect(trialingPro.channels).toEqual(["email"]);
    });

    it("denies vehicle listing entitlement if subscription status is 'trialing'", async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin");

      (createAdminClient as any).mockReturnValueOnce({
        from: vi.fn((table: string) => {
          if (table === "subscriptions") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  plan_code: "pro",
                  status: "trialing", // trialing status must give 0 limit
                  stripe_subscription_id: "sub_trial",
                  current_period_end: new Date(Date.now() + 86400000).toISOString(),
                },
                error: null,
              }),
            };
          }
          return mockSupabaseQuery;
        }),
      });

      const trialLimit = await getVehicleLimitInfo("org-trial");
      expect(trialLimit.limit).toBe(0);
      expect(trialLimit.canAddMore).toBe(false);
    });
  });
});
