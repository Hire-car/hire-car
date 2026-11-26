import Stripe from "stripe";
import { getAppUrl, requireEnv } from "@/lib/config";
import type { PlanCode } from "@/lib/types";

let stripeClient: Stripe | null = null;

export function getStripe() {
  stripeClient ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-04-22.dahlia",
  });

  return stripeClient;
}

export function getStripePrice(plan: PlanCode, interval: "monthly" | "annual" = "monthly"): string {
  if (plan === "starter") {
    if (interval === "annual") {
      const priceId =
        process.env.STRIPE_PRICE_STARTER_ANNUAL ||
        process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL;
      if (!priceId) throw new Error("STRIPE_PRICE_STARTER_ANNUAL is not configured in environment variables.");
      return priceId;
    }
    const priceId =
      process.env.STRIPE_PRICE_STARTER_MONTHLY ||
      process.env.STRIPE_PRICE_STARTER ||
      process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY;
    if (!priceId) throw new Error("STRIPE_PRICE_STARTER_MONTHLY or STRIPE_PRICE_STARTER is not configured in environment variables.");
    return priceId;
  }

  if (plan === "growth") {
    if (interval === "annual") {
      const priceId = process.env.STRIPE_PRICE_GROWTH_ANNUAL;
      if (!priceId) throw new Error("STRIPE_PRICE_GROWTH_ANNUAL is not configured in environment variables.");
      return priceId;
    }
    const priceId = process.env.STRIPE_PRICE_GROWTH_MONTHLY || process.env.STRIPE_PRICE_GROWTH;
    if (!priceId) throw new Error("STRIPE_PRICE_GROWTH_MONTHLY or STRIPE_PRICE_GROWTH is not configured in environment variables.");
    return priceId;
  }

  if (plan === "pro") {
    if (interval === "annual") {
      const priceId = process.env.STRIPE_PRICE_PRO_ANNUAL;
      if (!priceId) throw new Error("STRIPE_PRICE_PRO_ANNUAL is not configured in environment variables.");
      return priceId;
    }
    const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO;
    if (!priceId) throw new Error("STRIPE_PRICE_PRO_MONTHLY or STRIPE_PRICE_PRO is not configured in environment variables.");
    return priceId;
  }

  throw new Error(`Unsupported plan for Stripe checkout: ${plan}`);
}

export function getPlanFromStripePrice(priceId: string): { plan: PlanCode; interval: "monthly" | "annual" } | null {
  if (!priceId) return null;

  // Growth Monthly
  if (
    priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_GROWTH
  ) {
    return { plan: "growth", interval: "monthly" };
  }

  // Growth Annual
  if (priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL) {
    return { plan: "growth", interval: "annual" };
  }

  // Pro Monthly
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO
  ) {
    return { plan: "pro", interval: "monthly" };
  }

  // Pro Annual
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    return { plan: "pro", interval: "annual" };
  }

  // Starter (monthly & annual aliases)
  if (
    priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_STARTER ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY
  ) {
    return { plan: "starter", interval: "monthly" };
  }
  if (
    priceId === process.env.STRIPE_PRICE_STARTER_ANNUAL ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL
  ) {
    return { plan: "starter", interval: "annual" };
  }

  return null;
}

const PAID_PLANS: PlanCode[] = ["starter", "growth", "pro"];

export async function createCheckoutSession(input: {
  plan: PlanCode;
  interval?: "monthly" | "annual";
  organizationId: string;
  userId: string;
  email?: string;
  customerId?: string;
  existingSubscriptionId?: string | null;
  idempotencyKey?: string;
}) {
  const interval = input.interval ?? "monthly";
  const isPaidPlan = PAID_PLANS.includes(input.plan);
  if (!isPaidPlan) {
    throw new Error(`Invalid plan for checkout: ${input.plan}`);
  }

  const priceId = getStripePrice(input.plan, interval);

  const subscriptionData = {
    metadata: {
      organization_id: input.organizationId,
      plan: input.plan,
      interval,
      existing_stripe_subscription_id: input.existingSubscriptionId ?? "",
      is_replacement: input.existingSubscriptionId ? "true" : "false",
    },
  };

  const params: Parameters<Stripe["checkout"]["sessions"]["create"]>[0] = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/vendor/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/vendor/billing?checkout=cancelled`,
    client_reference_id: input.organizationId,
    metadata: {
      organization_id: input.organizationId,
      user_id: input.userId,
      plan: input.plan,
      interval,
      existing_stripe_subscription_id: input.existingSubscriptionId ?? "",
      is_replacement: input.existingSubscriptionId ? "true" : "false",
    },
    subscription_data: subscriptionData,
    payment_method_collection: "always",
  };

  if (input.customerId) {
    params.customer = input.customerId;
  } else if (input.email) {
    params.customer_email = input.email;
  }

  return getStripe().checkout.sessions.create(
    params,
    input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
  );
}
