import { NextResponse, type NextRequest } from "next/server";
import { readFormDataBody, readJsonBody } from "@/lib/api/request";
import { createCheckoutSession, getStripe } from "@/lib/billing/stripe";
import { requireApiUser } from "@/lib/security/auth";
import { checkoutSchema } from "@/lib/validation/schemas";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const contentType = request.headers.get("content-type") ?? "";
  const rawPayloadResult = contentType.includes("application/json")
    ? await readJsonBody(request)
    : await readFormDataBody(request);

  if (rawPayloadResult.response) return rawPayloadResult.response;

  const rawPayload =
    rawPayloadResult.data instanceof FormData
      ? Object.fromEntries(rawPayloadResult.data.entries())
      : rawPayloadResult.data;

  const payload = checkoutSchema.safeParse(rawPayload);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  // SECURITY: Verify the authenticated user is a member of the target organization.
  // Without this check, any logged-in user could initiate a checkout for any org (IDOR).
  await ensureUserCanManageOrganization(user.id, payload.data.organizationId);

  // Retrieve existing customer ID if present to avoid duplicating customers in Stripe
  const supabase = createAdminClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, plan_code, status")
    .eq("organization_id", payload.data.organizationId)
    .maybeSingle();

  const isPaidActive =
    subscription?.status === "active" &&
    Boolean(subscription.stripe_subscription_id);

  if (isPaidActive) {
    return NextResponse.json({ 
      error: "You already have an active subscription. Please use the Billing Portal to switch plans." 
    }, { status: 409 });
  }

  // Safely expire stale abandoned open checkout sessions for this organization and customer.
  // Safety rules:
  // 1. Only expire if client_reference_id matches target organizationId (never touch other orgs).
  // 2. Only expire sessions created > 60 seconds ago so concurrent users/tabs do not invalidate each other.
  // 3. Skip gracefully if customer ID is not yet assigned (e.g. Starter tier).
  if (subscription?.stripe_customer_id) {
    try {
      const openSessions = await getStripe().checkout.sessions.list({
        customer: subscription.stripe_customer_id,
        status: "open",
        limit: 10,
      });

      const staleThresholdSeconds = Math.floor(Date.now() / 1000) - 60;
      for (const openSession of openSessions.data) {
        if (
          openSession.client_reference_id === payload.data.organizationId &&
          openSession.created < staleThresholdSeconds
        ) {
          await getStripe().checkout.sessions.expire(openSession.id).catch(() => {});
        }
      }
    } catch (listErr) {
      console.warn("[checkout] Could not cleanup stale open checkout sessions:", listErr);
    }
  }

  // Robust checkout attempt lifecycle:
  // - If client supplies an attemptId (e.g. from UI checkout button / retry state), use it.
  // - Otherwise, generate a fresh unique UUID for this checkout attempt.
  // - Unique attempt token ensures genuine retries reuse the session, but different attempts get fresh keys.
  const attemptId = payload.data.attemptId || crypto.randomUUID();
  const selectedInterval = payload.data.interval ?? "monthly";
  let idempotencyKey = `chk_${payload.data.organizationId}_${payload.data.plan}_${selectedInterval}_${attemptId}`;

  const origin = request.nextUrl.origin;

  let session = await createCheckoutSession({
    plan: payload.data.plan,
    interval: payload.data.interval,
    organizationId: payload.data.organizationId,
    userId: user.id,
    email: user.email,
    customerId: subscription?.stripe_customer_id ?? undefined,
    existingSubscriptionId: subscription?.stripe_subscription_id ?? null,
    idempotencyKey,
    origin,
  });

  // If Stripe idempotency returned an expired session, immediately reissue with a fresh attempt token
  if (session.status === "expired") {
    const freshAttemptId = crypto.randomUUID();
    idempotencyKey = `chk_${payload.data.organizationId}_${payload.data.plan}_${selectedInterval}_${freshAttemptId}`;
    session = await createCheckoutSession({
      plan: payload.data.plan,
      interval: payload.data.interval,
      organizationId: payload.data.organizationId,
      userId: user.id,
      email: user.email,
      customerId: subscription?.stripe_customer_id ?? undefined,
      existingSubscriptionId: subscription?.stripe_subscription_id ?? null,
      idempotencyKey,
      origin,
    });
  }

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a Checkout URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
