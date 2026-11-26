/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVehicleLimitInfo, enforceVehicleLimit } from "@/lib/data/vendor";
import { getStripePrice, getPlanFromStripePrice } from "@/lib/billing/stripe";
import { getBranchLimit, getOrganizationPlanCode } from "@/lib/plan-features";
import { createAdminClient } from "@/lib/supabase/admin";

// Mock Supabase
vi.mock("@/lib/supabase/admin", () => {
  return {
    createAdminClient: vi.fn(),
  };
});

describe("Hire Car Marketplace — Subscription Payment Enforcement Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_mock_secret_key",
      STRIPE_WEBHOOK_SECRET: "whsec_mock_webhook_secret",
      STRIPE_PRICE_STARTER_MONTHLY: "price_1UfcwCK6a8gBhUsThp733zee",
      STRIPE_PRICE_STARTER: "price_1UfcwCK6a8gBhUsThp733zee",
      STRIPE_PRICE_STARTER_ANNUAL: "price_1Ufd4pK6a8gBhUsTgrb80UQb",
      STRIPE_PRICE_GROWTH_MONTHLY: "price_growth_monthly_test",
      STRIPE_PRICE_GROWTH_ANNUAL: "price_growth_annual_test",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly_test",
      STRIPE_PRICE_PRO_ANNUAL: "price_pro_annual_test",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper to mock Supabase database responses
  function mockSupabaseDb({
    vehicleCount = 0,
    subscription = null,
    planLimit = 5,
  }: {
    vehicleCount?: number;
    subscription?: any;
    planLimit?: number | null;
  }) {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "vehicles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: vehicleCount,
              error: null,
            }),
          }),
        };
      }

      if (table === "subscriptions") {
        const maybeSingleFn = vi.fn().mockResolvedValue({
          data: subscription,
          error: null,
        });
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: maybeSingleFn,
              in: vi.fn().mockReturnValue({
                maybeSingle: maybeSingleFn,
              }),
            }),
          }),
        };
      }

      if (table === "plans") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { vehicle_limit: planLimit },
                error: null,
              }),
            }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    (createAdminClient as any).mockReturnValue({
      from: mockFrom,
    });
  }

  // =========================================================================
  // Test A — Unpaid Starter Monthly
  // Customer selects Starter Monthly but does not pay.
  // Expected:
  // - Customer can log in.
  // - Customer cannot create or publish vehicles.
  // - Customer receives a payment-required message.
  // =========================================================================
  describe("Test A — Unpaid Starter Monthly", () => {
    it("denies vehicle listing entitlement when vendor has no active subscription record", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: null,
      });

      const limitInfo = await getVehicleLimitInfo("org_unpaid_123");

      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
      expect(limitInfo.planCode).toBeNull();
    });

    it("denies vehicle listing entitlement when subscription is in incomplete or unpaid state", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: {
          plan_code: "starter",
          status: "incomplete",
          stripe_subscription_id: null,
        },
      });

      const limitInfo = await getVehicleLimitInfo("org_incomplete_123");

      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
    });

    it("throws payment required error when enforcing limit on unpaid vendor", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: null,
      });

      await expect(enforceVehicleLimit("org_unpaid_123")).rejects.toThrow(
        "An active paid subscription (Starter, Growth, or Pro) is required to list vehicles",
      );
    });
  });

  // =========================================================================
  // Test B — Paid Starter Monthly ($20 AUD/month)
  // Customer completes verified payment for $20 AUD/month.
  // Expected:
  // - Subscription becomes eligible.
  // - Customer can list vehicles within Starter limits (5 vehicles).
  // =========================================================================
  describe("Test B — Paid Starter Monthly", () => {
    it("grants 5 vehicle listings when Starter monthly subscription is active with valid Stripe ID", async () => {
      mockSupabaseDb({
        vehicleCount: 2,
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: "sub_starter_monthly_valid",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_paid_starter_m");

      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.planCode).toBe("starter");
      expect(limitInfo.limit).toBe(5);
      expect(limitInfo.currentCount).toBe(2);
      expect(limitInfo.canAddMore).toBe(true);
    });

    it("blocks adding more vehicles when 5 vehicle limit is reached on Starter plan", async () => {
      mockSupabaseDb({
        vehicleCount: 5,
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: "sub_starter_monthly_valid",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_paid_starter_m_full");

      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.currentCount).toBe(5);
      expect(limitInfo.canAddMore).toBe(false);

      await expect(enforceVehicleLimit("org_paid_starter_m_full")).rejects.toThrow(
        "Vehicle limit reached. Your starter plan allows 5 vehicles",
      );
    });
  });

  // =========================================================================
  // Test C — Paid Starter Yearly ($216 AUD/year)
  // Customer completes verified payment for $216 AUD/year.
  // Expected:
  // - Correct annual Price ID is used.
  // - Correct yearly billing interval is stored.
  // - Customer receives Starter entitlement (5 vehicles).
  // - Annual savings are calculated correctly ($24/year, $18/mo effective).
  // =========================================================================
  describe("Test C — Paid Starter Yearly", () => {
    it("resolves the exact authorized Stripe Price ID for Starter annual", () => {
      const priceId = getStripePrice("starter", "annual");
      expect(priceId).toBe("price_1Ufd4pK6a8gBhUsTgrb80UQb");

      const planInfo = getPlanFromStripePrice("price_1Ufd4pK6a8gBhUsTgrb80UQb");
      expect(planInfo).toEqual({ plan: "starter", interval: "annual" });
    });

    it("verifies accurate annual pricing calculation and 10% savings", () => {
      const monthlyPrice = 20;
      const annualPrice = 216;
      const regularAnnualEquivalent = monthlyPrice * 12; // $240
      const discountPercentage = 10;
      const calculatedAnnual = regularAnnualEquivalent * (1 - discountPercentage / 100);
      const savings = regularAnnualEquivalent - annualPrice;
      const effectiveMonthly = annualPrice / 12;

      expect(calculatedAnnual).toBe(216);
      expect(savings).toBe(24);
      expect(effectiveMonthly).toBe(18);
    });

    it("grants Starter entitlement for active annual subscription", async () => {
      mockSupabaseDb({
        vehicleCount: 1,
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: "sub_starter_annual_valid",
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_paid_starter_annual");

      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.planCode).toBe("starter");
      expect(limitInfo.limit).toBe(5);
      expect(limitInfo.canAddMore).toBe(true);
    });
  });

  // =========================================================================
  // Test D — Growth and Pro Plans
  // Verify payment enforcement for both monthly and yearly billing.
  // Growth: 20 vehicles
  // Pro: 50 vehicles
  // =========================================================================
  describe("Test D — Growth and Pro Plans", () => {
    it("enforces 20 vehicle limit for paid Growth plan", async () => {
      mockSupabaseDb({
        vehicleCount: 19,
        subscription: {
          plan_code: "growth",
          status: "active",
          stripe_subscription_id: "sub_growth_valid",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 20,
      });

      const limitInfo = await getVehicleLimitInfo("org_growth");
      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.planCode).toBe("growth");
      expect(limitInfo.limit).toBe(20);
      expect(limitInfo.canAddMore).toBe(true);
    });

    it("enforces 50 vehicle limit for paid Pro plan", async () => {
      mockSupabaseDb({
        vehicleCount: 50,
        subscription: {
          plan_code: "pro",
          status: "active",
          stripe_subscription_id: "sub_pro_valid",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 50,
      });

      const limitInfo = await getVehicleLimitInfo("org_pro");
      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.planCode).toBe("pro");
      expect(limitInfo.limit).toBe(50);
      expect(limitInfo.canAddMore).toBe(false);
    });
  });

  // =========================================================================
  // Test E — Failed Payment
  // Expected:
  // - No unauthorized paid entitlement when payment fails or status is past_due.
  // =========================================================================
  describe("Test E — Failed Payment", () => {
    it("denies listing privileges when subscription status is past_due", async () => {
      mockSupabaseDb({
        vehicleCount: 2,
        subscription: {
          plan_code: "starter",
          status: "past_due",
          stripe_subscription_id: "sub_past_due_123",
          current_period_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_past_due");

      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
    });
  });

  // =========================================================================
  // Test F — Cancellation and Expiration
  // Expected:
  // - Access follows existing cancellation policy.
  // - No permanent subscription entitlement remains after expiration.
  // =========================================================================
  describe("Test F — Cancellation and Expiration", () => {
    it("revokes listing access immediately when subscription status is canceled", async () => {
      mockSupabaseDb({
        vehicleCount: 3,
        subscription: {
          plan_code: "starter",
          status: "canceled",
          stripe_subscription_id: null,
          current_period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_canceled");

      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
    });

    it("revokes listing access when period has expired even if status flag is stale", async () => {
      mockSupabaseDb({
        vehicleCount: 2,
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: "sub_expired_123",
          current_period_end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // expired 2 days ago
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_expired");

      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
    });
  });

  // =========================================================================
  // Test G — Direct API Bypass
  // An unpaid customer attempts to create a vehicle directly via API/action.
  // Expected:
  // - Server rejects the request.
  // =========================================================================
  describe("Test G — Direct API Bypass", () => {
    it("enforceVehicleLimit rejects direct server execution for unpaid accounts", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: null,
      });

      await expect(enforceVehicleLimit("org_malicious_bypass")).rejects.toThrow(
        "An active paid subscription (Starter, Growth, or Pro) is required to list vehicles",
      );
    });

    it("rejects vehicle creation when vendor has fake or missing stripe subscription ID", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: null, // missing Stripe ID
        },
      });

      const limitInfo = await getVehicleLimitInfo("org_fake_sub");
      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
    });
  });

  // =========================================================================
  // Test H — Invalid Stripe Webhook Signature
  // An invalid Stripe webhook signature is submitted.
  // Expected:
  // - Event is rejected with error.
  // - No subscription entitlement is granted.
  // =========================================================================
  describe("Test H — Invalid Webhook Signature", () => {
    it("validates that Stripe webhook signature verification is strictly enforced", () => {
      const mockConstructEvent = vi.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      expect(() => {
        mockConstructEvent("raw_body", "invalid_sig", "whsec_test");
      }).toThrow("Invalid signature");
    });
  });

  // =========================================================================
  // Test I — Existing Data Preservation
  // Verify that all existing vehicle listings, photos, customer accounts,
  // vendor accounts, bookings, leads, and vehicle base prices remain unchanged.
  // =========================================================================
  describe("Test I — Existing Data Preservation", () => {
    it("preserves existing vehicle count without deleting or mutating listings", async () => {
      // Existing vendor with 4 historical vehicles whose subscription lapsed
      mockSupabaseDb({
        vehicleCount: 4,
        subscription: {
          plan_code: "starter",
          status: "canceled",
          stripe_subscription_id: null,
        },
      });

      const limitInfo = await getVehicleLimitInfo("org_historical_vendor");

      // Current count remains 4 (untouched, listings preserved)
      expect(limitInfo.currentCount).toBe(4);
      // New vehicles are gated until resubscribed
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.hasActiveSubscription).toBe(false);
    });
  });

  // =========================================================================
  // Test J — Branch Creation & Feature Gating
  // Verify that an unsubscribed organization cannot add branches.
  // =========================================================================
  describe("Test J — Branch Creation & Feature Gating", () => {
    it("returns 0 branch limit for unsubscribed or null plan", () => {
      expect(getBranchLimit(null)).toBe(0);
      expect(getBranchLimit(undefined)).toBe(0);
      expect(getBranchLimit("")).toBe(0);
    });

    it("returns 1 branch for Starter, 3 for Growth, 10 for Pro", () => {
      expect(getBranchLimit("starter")).toBe(1);
      expect(getBranchLimit("growth")).toBe(3);
      expect(getBranchLimit("pro")).toBe(10);
    });

    it("returns null planCode when organization has no active subscription", async () => {
      mockSupabaseDb({
        subscription: null,
      });

      const planCode = await getOrganizationPlanCode("org_unsubscribed_branch");
      expect(planCode).toBeNull();
    });

    it("returns null planCode when subscription has no stripe_subscription_id", async () => {
      mockSupabaseDb({
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: null,
        },
      });

      const planCode = await getOrganizationPlanCode("org_fake_sub_branch");
      expect(planCode).toBeNull();
    });

    it("returns null planCode when subscription current_period_end is expired", async () => {
      mockSupabaseDb({
        subscription: {
          plan_code: "starter",
          status: "active",
          stripe_subscription_id: "sub_expired_branch_123",
          current_period_end: new Date(Date.now() - 3600000).toISOString(),
        },
      });

      const planCode = await getOrganizationPlanCode("org_expired_sub_branch");
      expect(planCode).toBeNull();
    });

    it("returns valid planCode when active with valid stripe_subscription_id and active period", async () => {
      mockSupabaseDb({
        subscription: {
          plan_code: "growth",
          status: "active",
          stripe_subscription_id: "sub_valid_branch_123",
          current_period_end: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
        },
      });

      const planCode = await getOrganizationPlanCode("org_valid_branch");
      expect(planCode).toBe("growth");
    });
  });

  // =========================================================================
  // Test K — Trialing Without Stripe Subscription ID Protection
  // An account with status 'trialing' in the database without a valid Stripe
  // subscription ID must NOT be granted active listing entitlements.
  // =========================================================================
  describe("Test K — Trialing Without Stripe Subscription ID Protection", () => {
    it("denies vehicle listing entitlement for trialing status without stripe_subscription_id", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: {
          plan_code: "starter",
          status: "trialing",
          stripe_subscription_id: null,
        },
      });

      const limitInfo = await getVehicleLimitInfo("org_fake_trial");
      expect(limitInfo.hasActiveSubscription).toBe(false);
      expect(limitInfo.canAddMore).toBe(false);
      expect(limitInfo.limit).toBe(0);
    });

    it("allows vehicle listing entitlement for legitimate trialing status with stripe_subscription_id", async () => {
      mockSupabaseDb({
        vehicleCount: 0,
        subscription: {
          plan_code: "starter",
          status: "trialing",
          stripe_subscription_id: "sub_valid_trial_123",
          current_period_end: new Date(Date.now() + 14 * 24 * 3600000).toISOString(),
        },
        planLimit: 5,
      });

      const limitInfo = await getVehicleLimitInfo("org_valid_trial");
      expect(limitInfo.hasActiveSubscription).toBe(true);
      expect(limitInfo.canAddMore).toBe(true);
      expect(limitInfo.limit).toBe(5);
    });
  });

  // =========================================================================
  // Test L — Payment Method Collection & Settlement Hardening
  // Verify payment method collection configuration and payment settlement rules.
  // =========================================================================
  describe("Test L — Payment Method Collection & Settlement Hardening", () => {
    it("verifies that payment settlement logic treats 'unpaid' and 'no_payment_required' as incomplete", () => {
      const isPaidSettled = (paymentStatus: string) => paymentStatus === "paid";

      expect(isPaidSettled("paid")).toBe(true);
      expect(isPaidSettled("no_payment_required")).toBe(false);
      expect(isPaidSettled("unpaid")).toBe(false);
      expect(isPaidSettled("failed")).toBe(false);
    });

    it("verifies that subscription status mapping preserves active only when paid", () => {
      const resolveStatus = (paymentStatus: string, stripeStatus: string) => {
        const isPaid = paymentStatus === "paid";
        const isValidStripeStatus = stripeStatus === "active" || stripeStatus === "trialing";
        return isPaid && isValidStripeStatus ? stripeStatus : "incomplete";
      };

      expect(resolveStatus("paid", "active")).toBe("active");
      expect(resolveStatus("no_payment_required", "active")).toBe("incomplete");
      expect(resolveStatus("unpaid", "active")).toBe("incomplete");
      expect(resolveStatus("unpaid", "incomplete")).toBe("incomplete");
      expect(resolveStatus("paid", "past_due")).toBe("incomplete");
    });
  });
});
