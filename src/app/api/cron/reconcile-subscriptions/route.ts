import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";
import { getSubscriptionPeriodFields, resolvePlanFromSubscription, SUBSCRIPTION_STATUS_MAP } from "@/lib/billing/webhook-helpers";
import { processCancellationQueue } from "@/lib/billing/cancellation-recovery";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAYMENT_FAILURE_GRACE_PERIOD_DAYS = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const stripe = getStripe();
  const results = {
    checked: 0,
    reconciled: 0,
    revertedToStarter: 0,
    cancellationsProcessed: 0,
    cancellationsCompleted: 0,
    cancellationsFailed: 0,
    errors: [] as string[],
  };

  try {
    // Process pending failed cancellations from the queue with exponential backoff
    const queueResults = await processCancellationQueue(supabase, stripe);
    results.cancellationsProcessed = queueResults.processed;
    results.cancellationsCompleted = queueResults.completed;
    results.cancellationsFailed = queueResults.failed;

    const nowIso = new Date().toISOString();

    // Query active or past_due subscriptions with a Stripe ID where period ended or cancellation scheduled
    const { data: staleSubscriptions, error: queryError } = await supabase
      .from("subscriptions")
      .select("id, organization_id, stripe_subscription_id, plan_code, status, current_period_end, cancel_at_period_end")
      .not("stripe_subscription_id", "is", null)
      .or(`current_period_end.lt.${nowIso},status.eq.past_due,cancel_at_period_end.eq.true`)
      .limit(50);

    if (queryError) {
      throw new Error(`Failed to query stale subscriptions: ${queryError.message}`);
    }

    if (!staleSubscriptions || staleSubscriptions.length === 0) {
      return NextResponse.json({ success: true, message: "No stale subscriptions found", ...results });
    }

    results.checked = staleSubscriptions.length;

    for (const sub of staleSubscriptions) {
      if (!sub.stripe_subscription_id) continue;

      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const mappedStatus = SUBSCRIPTION_STATUS_MAP[stripeSub.status] || "incomplete";
        const periodFields = getSubscriptionPeriodFields(stripeSub);
        const planInfo = resolvePlanFromSubscription(stripeSub);

        // If Stripe subscription is canceled or expired:
        if (["canceled", "incomplete_expired"].includes(stripeSub.status)) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              stripe_subscription_id: null,
              cancel_at_period_end: false,
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);

          await supabase.from("audit_logs").insert({
            action: "subscription_reconciled_canceled",
            resource_type: "subscription",
            resource_id: sub.organization_id,
            metadata: {
              source: "cron_reconcile_subscriptions",
              previous_stripe_subscription_id: sub.stripe_subscription_id,
              stripe_status: stripeSub.status,
            },
          });

          results.reconciled++;
          continue;
        }

        // If past due beyond grace period:
        const periodEndTimestamp = stripeSub.items?.data?.[0]?.current_period_end ?? (stripeSub as unknown as { current_period_end?: number }).current_period_end;
        const graceEndMs = periodEndTimestamp ? (periodEndTimestamp * 1000) + (PAYMENT_FAILURE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000) : 0;
        const isPastGrace = graceEndMs > 0 && Date.now() > graceEndMs;

        if (stripeSub.status === "past_due" && isPastGrace) {
          // Mark past due without active paid privileges after grace period expires
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sub.id);

          await supabase.from("audit_logs").insert({
            action: "subscription_reconciled_grace_expired",
            resource_type: "subscription",
            resource_id: sub.organization_id,
            metadata: {
              source: "cron_reconcile_subscriptions",
              grace_period_days: PAYMENT_FAILURE_GRACE_PERIOD_DAYS,
            },
          });

          results.reconciled++;
          continue;
        }

        // Otherwise sync updated state from Stripe
        await supabase
          .from("subscriptions")
          .update({
            status: mappedStatus,
            ...(planInfo ? { plan_code: planInfo.plan, billing_interval: planInfo.interval } : {}),
            ...periodFields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        results.reconciled++;
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
        results.errors.push(`Sub ${sub.id} (${sub.stripe_subscription_id}): ${msg}`);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ success: false, error: errorMsg, ...results }, { status: 500 });
  }
}
