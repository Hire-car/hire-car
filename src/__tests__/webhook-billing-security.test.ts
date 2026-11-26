/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/stripe/webhook/route";
import { syncCheckoutSessionForOrganization } from "@/lib/billing/sync-checkout-session";
import { NextRequest } from "next/server";

// Hoisted mock state
const mockState = vi.hoisted(() => ({
  subscriptionsMap: new Map<string, any>(),
  auditLogs: [] as any[],
  organizationsMap: new Map<string, any>(),
  stripeSubscriptions: new Map<string, any>(),
  stripeCheckoutSessions: new Map<string, any>(),
  constructedEvent: null as any,
  claimResult: { claimed: true, duplicate: false, inProgress: false },
}));

// Mock config
vi.mock("@/lib/config", () => ({
  requireEnv: vi.fn((key: string) => {
    if (key === "STRIPE_SECRET_KEY") return "sk_test_mock";
    if (key === "STRIPE_WEBHOOK_SECRET") return "whsec_mock";
    return "mock_value";
  }),
  getAppUrl: vi.fn(() => "http://localhost:3000"),
}));

// Mock claim-webhook-event
vi.mock("@/lib/billing/claim-webhook-event", () => ({
  claimStripeWebhookEvent: vi.fn().mockImplementation(async () => mockState.claimResult),
  describeClaimError: vi.fn(() => "Claim error"),
}));

// Mock Stripe
vi.mock("@/lib/billing/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/billing/stripe")>();
  return {
    ...actual,
    getStripe: vi.fn().mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation((rawBody: string) => {
          if (mockState.constructedEvent) return mockState.constructedEvent;
          return JSON.parse(rawBody);
        }),
      },
      subscriptions: {
        retrieve: vi.fn().mockImplementation(async (id: string) => {
          const sub = mockState.stripeSubscriptions.get(id);
          if (!sub) throw new Error(`Stripe subscription ${id} not found`);
          return sub;
        }),
        cancel: vi.fn().mockResolvedValue({ status: "canceled" }),
        search: vi.fn().mockResolvedValue({ data: [] }),
      },
      checkout: {
        sessions: {
          retrieve: vi.fn().mockImplementation(async (id: string) => {
            const sess = mockState.stripeCheckoutSessions.get(id);
            if (!sess) throw new Error(`Stripe session ${id} not found`);
            return sess;
          }),
        },
      },
      invoices: {
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    }),
  };
});

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockImplementation(() => {
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              return {
                maybeSingle: vi.fn().mockImplementation(async () => {
                  for (const [, sub] of mockState.subscriptionsMap.entries()) {
                    if (sub[col] === val) return { data: { ...sub }, error: null };
                  }
                  return { data: null, error: null };
                }),
                eq: vi.fn().mockImplementation((col2: string, val2: string) => {
                  return {
                    maybeSingle: vi.fn().mockImplementation(async () => {
                      for (const [, sub] of mockState.subscriptionsMap.entries()) {
                        if (sub[col] === val && sub[col2] === val2) {
                          return { data: { ...sub }, error: null };
                        }
                      }
                      return { data: null, error: null };
                    }),
                  };
                }),
              };
            }),
            upsert: vi.fn().mockImplementation(async (record: any) => {
              const key = record.organization_id;
              const existing = mockState.subscriptionsMap.get(key) || {};
              mockState.subscriptionsMap.set(key, { ...existing, ...record });
              return { error: null };
            }),
            update: vi.fn().mockImplementation((updates: any) => {
              return {
                eq: vi.fn().mockImplementation((col: string, val: string) => {
                  return {
                    eq: vi.fn().mockImplementation((col2: string, val2: string) => {
                      for (const [key, sub] of mockState.subscriptionsMap.entries()) {
                        if (sub[col] === val && sub[col2] === val2) {
                          mockState.subscriptionsMap.set(key, { ...sub, ...updates });
                        }
                      }
                      return { error: null, select: vi.fn().mockReturnValue({ maybeSingle: vi.fn() }) };
                    }),
                    select: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockImplementation(async () => {
                        for (const [, sub] of mockState.subscriptionsMap.entries()) {
                          if (sub[col] === val) return { data: { ...sub }, error: null };
                        }
                        return { data: null, error: null };
                      }),
                    }),
                    then: (resolve: any) => {
                      for (const [key, sub] of mockState.subscriptionsMap.entries()) {
                        if (sub[col] === val) {
                          mockState.subscriptionsMap.set(key, { ...sub, ...updates });
                        }
                      }
                      return resolve({ error: null });
                    },
                  };
                }),
              };
            }),
          };
        }

        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => ({
              single: vi.fn().mockImplementation(async () => {
                const org = mockState.organizationsMap.get(val);
                return { data: org || { status: "pending" }, error: null };
              }),
            })),
            update: vi.fn().mockImplementation((updates: any) => ({
              eq: vi.fn().mockImplementation((col: string, val: string) => {
                const org = mockState.organizationsMap.get(val) || {};
                mockState.organizationsMap.set(val, { ...org, ...updates });
                return Promise.resolve({ error: null });
              }),
            })),
          };
        }

        if (table === "audit_logs" || table === "subscription_events" || table === "stripe_webhook_events") {
          return {
            insert: vi.fn().mockImplementation(async (record: any) => {
              if (table === "audit_logs") mockState.auditLogs.push(record);
              return { error: null };
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }

        if (table === "fraud_flags") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          };
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
      }),
    };
  }),
}));

describe("Hire Car Marketplace — Comprehensive Billing Security & Webhook Test Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.subscriptionsMap.clear();
    mockState.auditLogs = [];
    mockState.organizationsMap.clear();
    mockState.stripeSubscriptions.clear();
    mockState.stripeCheckoutSessions.clear();
    mockState.constructedEvent = null;
    mockState.claimResult = { claimed: true, duplicate: false, inProgress: false };

    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_mock_secret_key",
      STRIPE_WEBHOOK_SECRET: "whsec_mock_webhook_secret",
      STRIPE_PRICE_STARTER_MONTHLY: "price_1UfcwCK6a8gBhUsThp733zee",
      STRIPE_PRICE_STARTER: "price_1UfcwCK6a8gBhUsThp733zee",
      STRIPE_PRICE_STARTER_ANNUAL: "price_1Ufd4pK6a8gBhUsTgrb80UQb",
      STRIPE_PRICE_GROWTH_MONTHLY: "price_growth_monthly_live",
      STRIPE_PRICE_GROWTH: "price_growth_monthly_live",
      STRIPE_PRICE_GROWTH_ANNUAL: "price_growth_annual_live",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly_live",
      STRIPE_PRICE_PRO: "price_pro_monthly_live",
      STRIPE_PRICE_PRO_ANNUAL: "price_pro_annual_live",
    };
  });

  function createWebhookRequest(event: any): NextRequest {
    mockState.constructedEvent = event;
    return new NextRequest("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "t=123,v1=mock_signature",
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
    });
  }

  // =========================================================================
  // 1. Unpaid Checkout Session
  // =========================================================================
  it("rejects unpaid checkout.session.completed and marks subscription incomplete", async () => {
    const event = {
      id: "evt_unpaid_1",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_unpaid_1",
          client_reference_id: "org_unpaid",
          customer: "cus_123",
          subscription: "sub_unpaid_1",
          payment_status: "unpaid", // Unpaid!
          metadata: { plan: "starter", interval: "monthly" },
        },
      },
    };

    mockState.stripeSubscriptions.set("sub_unpaid_1", {
      id: "sub_unpaid_1",
      status: "incomplete",
      customer: "cus_123",
      items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
    });

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_unpaid");
    expect(sub).toBeDefined();
    expect(sub.status).toBe("incomplete");

    // Organization must NOT be approved
    const org = mockState.organizationsMap.get("org_unpaid");
    expect(org?.status).not.toBe("approved");

    // Audit log recorded
    const unpaidLog = mockState.auditLogs.find((l) => l.action === "subscription_checkout_unpaid");
    expect(unpaidLog).toBeDefined();
  });

  // =========================================================================
  // 2. no_payment_required Checkout Session
  // =========================================================================
  it("rejects no_payment_required checkout session and prevents zero-value bypass", async () => {
    const event = {
      id: "evt_zero_val_1",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_zero_1",
          client_reference_id: "org_zero",
          customer: "cus_123",
          subscription: "sub_zero_1",
          payment_status: "no_payment_required", // Zero-value attempt!
          metadata: { plan: "starter", interval: "monthly" },
        },
      },
    };

    mockState.stripeSubscriptions.set("sub_zero_1", {
      id: "sub_zero_1",
      status: "trialing",
      customer: "cus_123",
      items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
    });

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_zero");
    expect(sub).toBeDefined();
    expect(sub.status).toBe("incomplete");

    const org = mockState.organizationsMap.get("org_zero");
    expect(org?.status).not.toBe("approved");
  });

  // =========================================================================
  // 3. Paid Checkout Session
  // =========================================================================
  it("activates subscription and approves organization on paid checkout.session.completed", async () => {
    const periodEndSec = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    const event = {
      id: "evt_paid_1",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_paid_1",
          client_reference_id: "org_paid",
          customer: "cus_paid_123",
          subscription: "sub_paid_1",
          payment_status: "paid", // Legitimate paid!
          metadata: { plan: "starter", interval: "monthly" },
        },
      },
    };

    mockState.stripeSubscriptions.set("sub_paid_1", {
      id: "sub_paid_1",
      status: "active",
      customer: "cus_paid_123",
      current_period_end: periodEndSec,
      items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
    });

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_paid");
    expect(sub).toBeDefined();
    expect(sub.status).toBe("active");
    expect(sub.plan_code).toBe("starter");
    expect(sub.current_period_end).toBe(new Date(periodEndSec * 1000).toISOString());

    // Organization is approved
    const org = mockState.organizationsMap.get("org_paid");
    expect(org?.status).toBe("approved");
  });

  // =========================================================================
  // 4. Trialing Subscription (No-Free-Trial Rule)
  // =========================================================================
  it("denies organization approval and activation when subscription status is trialing", async () => {
    const event = {
      id: "evt_trial_1",
      type: "customer.subscription.created",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "sub_trial_1",
          status: "trialing", // Stripe reports trialing
          customer: "cus_trial_123",
          metadata: { organization_id: "org_trial", plan: "starter", interval: "monthly" },
          items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_trial");
    expect(sub).toBeDefined();
    expect(sub.status).not.toBe("active");

    const org = mockState.organizationsMap.get("org_trial");
    expect(org?.status).not.toBe("approved");
  });

  // =========================================================================
  // 5. Active Subscription via Webhook
  // =========================================================================
  it("approves organization when customer.subscription.created is active", async () => {
    const event = {
      id: "evt_sub_active_1",
      type: "customer.subscription.created",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "sub_active_1",
          status: "active",
          customer: "cus_active_123",
          metadata: { organization_id: "org_active_sub", plan: "growth", interval: "monthly" },
          items: { data: [{ price: { id: "price_growth_monthly_live" } }] },
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_active_sub");
    expect(sub).toBeDefined();
    expect(sub.status).toBe("active");

    const org = mockState.organizationsMap.get("org_active_sub");
    expect(org?.status).toBe("approved");
  });

  // =========================================================================
  // 6. Canceled Subscription
  // =========================================================================
  it("marks subscription canceled and records audit log when customer.subscription.updated is canceled", async () => {
    mockState.subscriptionsMap.set("org_canceling", {
      organization_id: "org_canceling",
      stripe_subscription_id: "sub_cancel_1",
      status: "active",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    const event = {
      id: "evt_cancel_1",
      type: "customer.subscription.updated",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "sub_cancel_1",
          status: "canceled",
          customer: "cus_123",
          items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_canceling");
    expect(sub.status).toBe("canceled");

    const cancelLog = mockState.auditLogs.find((l) => l.action === "subscription_canceled");
    expect(cancelLog).toBeDefined();
  });

  // =========================================================================
  // 7. Async Payment Success
  // =========================================================================
  it("activates subscription on checkout.session.async_payment_succeeded with valid parameters", async () => {
    mockState.subscriptionsMap.set("org_async_success", {
      organization_id: "org_async_success",
      stripe_subscription_id: "sub_async_1",
      stripe_customer_id: "cus_async_1",
      status: "incomplete",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    mockState.stripeSubscriptions.set("sub_async_1", {
      id: "sub_async_1",
      status: "active",
      customer: "cus_async_1",
      metadata: { plan: "starter", interval: "monthly" },
      items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
    });

    const event = {
      id: "evt_async_succ_1",
      type: "checkout.session.async_payment_succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_async_1",
          client_reference_id: "org_async_success",
          customer: "cus_async_1",
          subscription: "sub_async_1",
          payment_status: "paid",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_async_success");
    expect(sub.status).toBe("active");

    const org = mockState.organizationsMap.get("org_async_success");
    expect(org?.status).toBe("approved");

    const asyncLog = mockState.auditLogs.find((l) => l.action === "subscription_async_payment_succeeded");
    expect(asyncLog).toBeDefined();
  });

  // =========================================================================
  // 8. Async Payment Failure
  // =========================================================================
  it("marks subscription incomplete on checkout.session.async_payment_failed", async () => {
    mockState.subscriptionsMap.set("org_async_fail", {
      organization_id: "org_async_fail",
      stripe_subscription_id: "sub_async_fail_1",
      status: "incomplete",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    const event = {
      id: "evt_async_fail_1",
      type: "checkout.session.async_payment_failed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_async_fail_1",
          client_reference_id: "org_async_fail",
          subscription: "sub_async_fail_1",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_async_fail");
    expect(sub.status).toBe("incomplete");

    const failLog = mockState.auditLogs.find((l) => l.action === "subscription_async_payment_failed");
    expect(failLog).toBeDefined();
  });

  // =========================================================================
  // 9. Wrong Customer
  // =========================================================================
  it("rejects async_payment_succeeded when customer does not match stored customer", async () => {
    mockState.subscriptionsMap.set("org_wrong_cust", {
      organization_id: "org_wrong_cust",
      stripe_subscription_id: "sub_wc_1",
      stripe_customer_id: "cus_EXPECTED",
      status: "incomplete",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    const event = {
      id: "evt_wc_1",
      type: "checkout.session.async_payment_succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_wc_1",
          client_reference_id: "org_wrong_cust",
          customer: "cus_ATTACKER", // Mismatched customer!
          subscription: "sub_wc_1",
          payment_status: "paid",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    // Subscription remains incomplete
    const sub = mockState.subscriptionsMap.get("org_wrong_cust");
    expect(sub.status).toBe("incomplete");
  });

  // =========================================================================
  // 10. Wrong Organization
  // =========================================================================
  it("rejects async_payment_succeeded when organization is not found in database", async () => {
    const event = {
      id: "evt_wo_1",
      type: "checkout.session.async_payment_succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_wo_1",
          client_reference_id: "org_non_existent",
          subscription: "sub_wo_1",
          payment_status: "paid",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    expect(mockState.subscriptionsMap.has("org_non_existent")).toBe(false);
  });

  // =========================================================================
  // 11. Wrong Subscription ID
  // =========================================================================
  it("rejects async_payment_succeeded when subscription ID does not match stored subscription", async () => {
    mockState.subscriptionsMap.set("org_wrong_sub", {
      organization_id: "org_wrong_sub",
      stripe_subscription_id: "sub_LEGITIMATE",
      status: "incomplete",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    const event = {
      id: "evt_ws_1",
      type: "checkout.session.async_payment_succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_ws_1",
          client_reference_id: "org_wrong_sub",
          subscription: "sub_ROGUE", // Mismatched subscription!
          payment_status: "paid",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_wrong_sub");
    expect(sub.status).toBe("incomplete");
  });

  // =========================================================================
  // 12. Wrong Price ID
  // =========================================================================
  it("rejects async_payment_succeeded when retrieved Stripe Price ID does not match the plan", async () => {
    mockState.subscriptionsMap.set("org_wrong_price", {
      organization_id: "org_wrong_price",
      stripe_subscription_id: "sub_wp_1",
      status: "incomplete",
      updated_at: new Date(Date.now() - 60000).toISOString(),
    });

    mockState.stripeSubscriptions.set("sub_wp_1", {
      id: "sub_wp_1",
      status: "active",
      metadata: { plan: "starter", interval: "monthly" },
      items: { data: [{ price: { id: "price_ROGUE_FAKE_PRICE" } }] }, // Wrong price!
    });

    const event = {
      id: "evt_wp_1",
      type: "checkout.session.async_payment_succeeded",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_wp_1",
          client_reference_id: "org_wrong_price",
          subscription: "sub_wp_1",
          payment_status: "paid",
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    const sub = mockState.subscriptionsMap.get("org_wrong_price");
    expect(sub.status).toBe("incomplete");
  });

  // =========================================================================
  // 13. Stale Webhook Event
  // =========================================================================
  it("skips stale webhook events older than local record updated_at", async () => {
    mockState.subscriptionsMap.set("org_stale", {
      organization_id: "org_stale",
      stripe_subscription_id: "sub_stale_1",
      status: "active",
      updated_at: new Date(Date.now() - 10000).toISOString(), // Updated 10s ago
    });

    // Event created 60s ago (stale!)
    const event = {
      id: "evt_stale_1",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000) - 60,
      data: {
        object: {
          id: "cs_stale_1",
          client_reference_id: "org_stale",
          subscription: "sub_stale_1",
          payment_status: "unpaid",
          metadata: { plan: "starter", interval: "monthly" },
        },
      },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);

    // Preserved active status without being overwritten by stale event
    const sub = mockState.subscriptionsMap.get("org_stale");
    expect(sub.status).toBe("active");
  });

  // =========================================================================
  // 14. Duplicate Webhook Event
  // =========================================================================
  it("skips processing when webhook event is claimed as duplicate", async () => {
    mockState.claimResult = { claimed: false, duplicate: true, inProgress: false };

    const event = {
      id: "evt_dup_1",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: { object: {} },
    };

    const res = await POST(createWebhookRequest(event));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
    expect(mockState.auditLogs.length).toBe(0);
  });

  // =========================================================================
  // 15. Monthly vs Annual Billing Period End
  // =========================================================================
  it("correctly sets authoritative annual (~365d) and monthly (~30d) period dates from Stripe", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const monthlyEndSec = nowSec + 30 * 24 * 3600;
    const annualEndSec = nowSec + 365 * 24 * 3600;

    // Monthly session
    mockState.stripeCheckoutSessions.set("cs_sync_monthly", {
      id: "cs_sync_monthly",
      client_reference_id: "org_sync_m",
      customer: "cus_m",
      subscription: "sub_sync_m",
      status: "complete",
      payment_status: "paid",
      metadata: { plan: "starter", interval: "monthly" },
    });
    mockState.stripeSubscriptions.set("sub_sync_m", {
      id: "sub_sync_m",
      status: "active",
      customer: "cus_m",
      current_period_end: monthlyEndSec,
      current_period_start: nowSec,
      items: { data: [{ price: { id: "price_1UfcwCK6a8gBhUsThp733zee" } }] },
    });

    const monthlyResult = await syncCheckoutSessionForOrganization("org_sync_m", "cs_sync_monthly");
    expect(monthlyResult.status).toBe("active");
    const subM = mockState.subscriptionsMap.get("org_sync_m");
    expect(subM.current_period_end).toBe(new Date(monthlyEndSec * 1000).toISOString());

    // Annual session
    mockState.stripeCheckoutSessions.set("cs_sync_annual", {
      id: "cs_sync_annual",
      client_reference_id: "org_sync_a",
      customer: "cus_a",
      subscription: "sub_sync_a",
      status: "complete",
      payment_status: "paid",
      metadata: { plan: "starter", interval: "annual" },
    });
    mockState.stripeSubscriptions.set("sub_sync_a", {
      id: "sub_sync_a",
      status: "active",
      customer: "cus_a",
      current_period_end: annualEndSec,
      current_period_start: nowSec,
      items: { data: [{ price: { id: "price_1Ufd4pK6a8gBhUsTgrb80UQb" } }] },
    });

    const annualResult = await syncCheckoutSessionForOrganization("org_sync_a", "cs_sync_annual");
    expect(annualResult.status).toBe("active");
    const subA = mockState.subscriptionsMap.get("org_sync_a");
    expect(subA.current_period_end).toBe(new Date(annualEndSec * 1000).toISOString());

    // Verify annual duration is ~12x monthly duration, NOT an arbitrary 30 days
    const durationM = new Date(subM.current_period_end).getTime() - Date.now();
    const durationA = new Date(subA.current_period_end).getTime() - Date.now();
    expect(durationA).toBeGreaterThan(durationM * 11);
  });
});
