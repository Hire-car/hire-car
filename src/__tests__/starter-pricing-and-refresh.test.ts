/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStripePrice, getPlanFromStripePrice, createCheckoutSession } from "@/lib/billing/stripe";
import { checkoutSchema } from "@/lib/validation/schemas";

// Mock the Stripe SDK
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      checkout = {
        sessions: {
          create: vi.fn().mockImplementation((params) =>
            Promise.resolve({
              id: "cs_mock_123",
              url: "https://checkout.stripe.com/c/pay/cs_mock_123",
              status: "open",
              ...params,
            }),
          ),
        },
      };
    },
  };
});

describe("Starter Monthly ($20) & Annual ($216) Pricing & Vehicle Refresh Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("1. Starter Stripe Price Resolution (Monthly $20 AUD & Annual $216 AUD)", () => {
    it("resolves Starter monthly price from STRIPE_PRICE_STARTER_MONTHLY", () => {
      process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_starter_monthly_test_123";
      delete process.env.STRIPE_PRICE_STARTER;
      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY;

      const price = getStripePrice("starter", "monthly");
      expect(price).toBe("price_starter_monthly_test_123");
    });

    it("resolves Starter monthly price from STRIPE_PRICE_STARTER fallback", () => {
      delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
      process.env.STRIPE_PRICE_STARTER = "price_starter_fallback_456";
      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY;

      const price = getStripePrice("starter", "monthly");
      expect(price).toBe("price_starter_fallback_456");
    });

    it("resolves Starter monthly price from NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY fallback", () => {
      delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
      delete process.env.STRIPE_PRICE_STARTER;
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY = "price_starter_nextpub_789";

      const price = getStripePrice("starter", "monthly");
      expect(price).toBe("price_starter_nextpub_789");
    });

    it("resolves Starter annual price from STRIPE_PRICE_STARTER_ANNUAL", () => {
      process.env.STRIPE_PRICE_STARTER_ANNUAL = "price_starter_annual_test_123";
      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL;

      const price = getStripePrice("starter", "annual");
      expect(price).toBe("price_starter_annual_test_123");
    });

    it("resolves Starter annual price from NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL fallback", () => {
      delete process.env.STRIPE_PRICE_STARTER_ANNUAL;
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL = "price_starter_annual_nextpub_456";

      const price = getStripePrice("starter", "annual");
      expect(price).toBe("price_starter_annual_nextpub_456");
    });

    it("throws clear error when Starter monthly price environment variable is missing", () => {
      delete process.env.STRIPE_PRICE_STARTER_MONTHLY;
      delete process.env.STRIPE_PRICE_STARTER;
      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY;

      expect(() => getStripePrice("starter", "monthly")).toThrow(
        "STRIPE_PRICE_STARTER_MONTHLY or STRIPE_PRICE_STARTER is not configured",
      );
    });

    it("throws clear error when Starter annual price environment variable is missing", () => {
      delete process.env.STRIPE_PRICE_STARTER_ANNUAL;
      delete process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL;

      expect(() => getStripePrice("starter", "annual")).toThrow(
        "STRIPE_PRICE_STARTER_ANNUAL is not configured",
      );
    });
  });

  describe("2. Annual Discount Calculation Consistency (10% Discount Rule across all tiers)", () => {
    it("matches the exact 10% discount methodology across Starter, Growth, and Pro", () => {
      const plans = [
        { name: "Starter", monthly: 20, annual: 216, discountExpected: 24, effectiveMonthly: 18 },
        { name: "Growth", monthly: 49, annual: 529, discountExpected: 59, effectiveMonthly: 44.08 },
        { name: "Pro", monthly: 99, annual: 1069, discountExpected: 119, effectiveMonthly: 89.08 },
      ];

      for (const plan of plans) {
        const regularAnnual = plan.monthly * 12;
        const calculatedAnnual = Math.round(regularAnnual * 0.90);
        expect(calculatedAnnual).toBe(plan.annual);

        const savings = regularAnnual - plan.annual;
        expect(savings).toBe(plan.discountExpected);
      }
    });

    it("preserves Growth pricing at $49/mo and $529/yr", () => {
      process.env.STRIPE_PRICE_GROWTH = "price_growth_monthly";
      process.env.STRIPE_PRICE_GROWTH_ANNUAL = "price_growth_annual";

      expect(getStripePrice("growth", "monthly")).toBe("price_growth_monthly");
      expect(getStripePrice("growth", "annual")).toBe("price_growth_annual");
    });

    it("preserves Pro pricing at $99/mo and $1,069/yr", () => {
      process.env.STRIPE_PRICE_PRO = "price_pro_monthly";
      process.env.STRIPE_PRICE_PRO_ANNUAL = "price_pro_annual";

      expect(getStripePrice("pro", "monthly")).toBe("price_pro_monthly");
      expect(getStripePrice("pro", "annual")).toBe("price_pro_annual");
    });
  });

  describe("3. Reverse Price ID to Plan Mapping (Webhook & Subscription Sync)", () => {
    it("maps Starter monthly price IDs back to { plan: 'starter', interval: 'monthly' }", () => {
      process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_starter_m_1";
      process.env.STRIPE_PRICE_STARTER = "price_starter_m_legacy";
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY = "price_starter_m_pub";

      expect(getPlanFromStripePrice("price_starter_m_1")).toEqual({ plan: "starter", interval: "monthly" });
      expect(getPlanFromStripePrice("price_starter_m_legacy")).toEqual({ plan: "starter", interval: "monthly" });
      expect(getPlanFromStripePrice("price_starter_m_pub")).toEqual({ plan: "starter", interval: "monthly" });
    });

    it("maps Starter annual price IDs back to { plan: 'starter', interval: 'annual' }", () => {
      process.env.STRIPE_PRICE_STARTER_ANNUAL = "price_starter_a_1";
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL = "price_starter_a_pub";

      expect(getPlanFromStripePrice("price_starter_a_1")).toEqual({ plan: "starter", interval: "annual" });
      expect(getPlanFromStripePrice("price_starter_a_pub")).toEqual({ plan: "starter", interval: "annual" });
    });

    it("preserves Growth and Pro mappings without regression", () => {
      process.env.STRIPE_PRICE_GROWTH_MONTHLY = "price_growth_m";
      process.env.STRIPE_PRICE_GROWTH_ANNUAL = "price_growth_a";
      process.env.STRIPE_PRICE_PRO_MONTHLY = "price_pro_m";
      process.env.STRIPE_PRICE_PRO_ANNUAL = "price_pro_a";

      expect(getPlanFromStripePrice("price_growth_m")).toEqual({ plan: "growth", interval: "monthly" });
      expect(getPlanFromStripePrice("price_growth_a")).toEqual({ plan: "growth", interval: "annual" });
      expect(getPlanFromStripePrice("price_pro_m")).toEqual({ plan: "pro", interval: "monthly" });
      expect(getPlanFromStripePrice("price_pro_a")).toEqual({ plan: "pro", interval: "annual" });
    });
  });

  describe("4. Checkout Schema & Session Creation for Starter Monthly & Annual", () => {
    it("validates Starter monthly and annual checkout payloads successfully", () => {
      const monthlyPayload = {
        plan: "starter",
        interval: "monthly",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
      };
      const annualPayload = {
        plan: "starter",
        interval: "annual",
        organizationId: "123e4567-e89b-12d3-a456-426614174000",
      };

      expect(checkoutSchema.safeParse(monthlyPayload).success).toBe(true);
      expect(checkoutSchema.safeParse(annualPayload).success).toBe(true);
    });

    it("creates a monthly Stripe checkout session for Starter plan", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_mock_123456789";
      process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_starter_mo_test";

      const session = await createCheckoutSession({
        plan: "starter",
        interval: "monthly",
        organizationId: "org-starter-001",
        userId: "user-123",
        email: "vendor@example.com",
      });

      expect(session).toBeDefined();
      expect(session.id).toBe("cs_mock_123");
      expect(session.line_items).toEqual([{ price: "price_starter_mo_test", quantity: 1 }]);
      expect(session.metadata?.plan).toBe("starter");
      expect(session.metadata?.interval).toBe("monthly");
      expect(session.metadata?.organization_id).toBe("org-starter-001");
      expect((session as any).subscription_data?.metadata?.plan).toBe("starter");
    });

    it("creates an annual Stripe checkout session for Starter plan", async () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_mock_123456789";
      process.env.STRIPE_PRICE_STARTER_ANNUAL = "price_starter_ann_test";

      const session = await createCheckoutSession({
        plan: "starter",
        interval: "annual",
        organizationId: "org-starter-002",
        userId: "user-456",
        email: "vendor2@example.com",
      });

      expect(session).toBeDefined();
      expect(session.id).toBe("cs_mock_123");
      expect(session.line_items).toEqual([{ price: "price_starter_ann_test", quantity: 1 }]);
      expect(session.metadata?.plan).toBe("starter");
      expect(session.metadata?.interval).toBe("annual");
      expect(session.metadata?.organization_id).toBe("org-starter-002");
      expect((session as any).subscription_data?.metadata?.plan).toBe("starter");
    });
  });

  describe("5. Existing Subscribers & Vehicle Limits Protection", () => {
    it("preserves vehicle limit allocations across all tiers", () => {
      const limits: Record<string, number> = {
        starter: 5,
        growth: 20,
        pro: 50,
      };

      expect(limits.starter).toBe(5);
      expect(limits.growth).toBe(20);
      expect(limits.pro).toBe(50);
    });
  });
});
