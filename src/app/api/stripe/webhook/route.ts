import { NextResponse, type NextRequest } from "next/server";
import {
  claimStripeWebhookEvent,
  describeClaimError,
} from "@/lib/billing/claim-webhook-event";
import { getStripe } from "@/lib/billing/stripe";
import { enqueueFailedCancellation } from "@/lib/billing/cancellation-recovery";
import {
  approveOrganizationIfEligible,
  getInvoiceSubscriptionId,
  getSubscriptionPeriodFields,
  resolvePlanFromSubscription,
  SUBSCRIPTION_STATUS_MAP,
  syncInvoiceRecord,
  upsertSubscriptionRecord,
} from "@/lib/billing/webhook-helpers";
import { requireEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode } from "@/lib/types";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    return await handleWebhook(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack?.slice(0, 500) : undefined;
    console.error("[stripe-webhook] Unhandled error:", message, stack);
    return NextResponse.json(
      { error: "Internal webhook error", detail: message },
      { status: 500 },
    );
  }
}

async function handleWebhook(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json(
      {
        error: "Invalid Stripe signature",
        hint: "Ensure STRIPE_WEBHOOK_SECRET matches this endpoint's signing secret and disable any old Stripe webhook destinations.",
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const claim = await claimStripeWebhookEvent(supabase, event);

  if (!claim.claimed) {
    if (claim.duplicate || claim.inProgress) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const detail = describeClaimError(claim.code, claim.error);
    console.error(`Failed to claim webhook event ${event.id}:`, detail, claim.code);
    return NextResponse.json(
      {
        error: "Webhook processing could not be started",
        eventId: event.id,
        detail,
        code: claim.code,
      },
      { status: 500 },
    );
  }

  try {
    await processStripeEvent(event, supabase);

    const { error: subscriptionEventError } = await supabase.from("subscription_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: JSON.parse(JSON.stringify(event)),
    });

    if (subscriptionEventError) {
      throw new Error(`Failed to record subscription event: ${subscriptionEventError.message}`);
    }

    const { error: processedError } = await supabase
      .from("stripe_webhook_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", event.id);

    if (processedError) {
      throw new Error(`Failed to mark webhook processed: ${processedError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("stripe_webhook_events")
      .update({
        processing_status: "failed",
        last_error: errorMessage,
      })
      .eq("id", event.id);

    await supabase.from("security_events").insert({
      event_type: "webhook_processing_failed",
      metadata: {
        stripe_event_id: event.id,
        event_type: event.type,
        error: errorMessage,
      },
    });

    console.error(`Webhook processing failed for ${event.id}:`, errorMessage);

    return NextResponse.json(
      { error: "Webhook processing failed", eventId: event.id, detail: errorMessage },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

async function processStripeEvent(
  event: Stripe.Event,
  supabase: ReturnType<typeof createAdminClient>,
) {
  await supabase.from("audit_logs").insert({
    action: "webhook_processing_started",
    resource_type: "stripe_event",
    metadata: {
      stripe_event_id: event.id,
      event_type: event.type,
      created_at: new Date().toISOString(),
    },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      const plan = session.metadata?.plan as PlanCode | undefined;
      const interval = (session.metadata?.interval || "monthly") as "monthly" | "annual";
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (!organizationId || !plan || !subscriptionId) {
        const missing = [
          !organizationId && "organization_id",
          !plan && "plan",
          !subscriptionId && "subscription",
        ].filter(Boolean);
        throw new Error(
          `Missing required data in checkout.session.completed: ${missing.join(", ")}`,
        );
      }

      // All plans are strictly paid plans. "no_payment_required" is explicitly rejected to prevent zero-value bypass.
      const isPaidSettled = session.payment_status === "paid";
      const sessionStatus = isPaidSettled ? "active" : "incomplete";

      // Check current subscription state to protect against out-of-order stale events
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("id, updated_at, status, stripe_subscription_id, plan_code")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (
        existingSub?.updated_at &&
        event.created * 1000 < new Date(existingSub.updated_at).getTime() - 5000
      ) {
        console.warn(
          `[stripe-webhook] Skipping stale checkout.session.completed event ${event.id} for organization ${organizationId}`,
        );
        break;
      }

      // Multiple active subscription guard:
      // If organization ALREADY has an active primary subscription with a DIFFERENT Stripe ID:
      const hasActivePrimary =
        Boolean(existingSub?.stripe_subscription_id) &&
        existingSub?.stripe_subscription_id !== subscriptionId &&
        (existingSub?.status === "active" || existingSub?.status === "trialing");

      if (hasActivePrimary && existingSub?.stripe_subscription_id) {
        const currentPrimarySubId = existingSub.stripe_subscription_id;
        // Verify whether this checkout was authorized to replace the existing active subscription
        const authorizedOldSubId = session.metadata?.existing_stripe_subscription_id;
        const isAuthorizedReplacement =
          Boolean(authorizedOldSubId) && authorizedOldSubId === currentPrimarySubId;

        if (!isAuthorizedReplacement) {
          // Unintended secondary or unauthorized duplicate checkout completed:
          // Protect the active primary subscription from being overwritten!
          console.warn(
            `[stripe-webhook] Unauthorized secondary checkout ${subscriptionId} for organization ${organizationId}. Primary subscription ${currentPrimarySubId} is active. Canceling secondary subscription in Stripe to prevent duplicate billing.`,
          );

          try {
            await getStripe().subscriptions.cancel(subscriptionId, { prorate: true });
          } catch (cancelErr) {
            console.error(
              `[stripe-webhook] Failed to cancel unauthorized secondary subscription ${subscriptionId}:`,
              cancelErr,
            );
            await enqueueFailedCancellation(supabase, {
              organizationId,
              stripeSubscriptionId: subscriptionId,
              reason: "unauthorized_secondary",
              error: cancelErr,
            });
          }

          await supabase.from("audit_logs").insert({
            action: "duplicate_checkout_canceled",
            resource_type: "subscription",
            resource_id: organizationId,
            metadata: {
              rejected_subscription_id: subscriptionId,
              preserved_subscription_id: currentPrimarySubId,
              reason: "unauthorized_secondary_checkout",
            },
          });
          break;
        }

        // It is an authorized replacement!
        // 1. Confirm and upsert replacement subscription FIRST
        await upsertSubscriptionRecord(supabase, {
          organizationId,
          plan,
          interval,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: sessionStatus,
          periodFields: {
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          eventCreated: event.created,
          isReplacement: true,
        });

        if (isPaidSettled) {
          await approveOrganizationIfEligible(supabase, organizationId);
        }

        // 2. Only AFTER replacement subscription is confirmed, safely cancel superseded subscription in Stripe
        const supersededSubId = currentPrimarySubId;
        try {
          await getStripe().subscriptions.cancel(supersededSubId, { prorate: true });
          await supabase.from("audit_logs").insert({
            action: "superseded_subscription_canceled",
            resource_type: "subscription",
            resource_id: organizationId,
            metadata: {
              superseded_subscription_id: supersededSubId,
              replacement_subscription_id: subscriptionId,
            },
          });
        } catch (supersededCancelErr) {
          console.error(
            `[stripe-webhook] Failed to cancel superseded subscription ${supersededSubId}:`,
            supersededCancelErr,
          );
          await enqueueFailedCancellation(supabase, {
            organizationId,
            stripeSubscriptionId: supersededSubId,
            reason: "superseded_replacement",
            error: supersededCancelErr,
          });
        }

        await supabase.from("audit_logs").insert({
          action: isPaidSettled ? "subscription_activated" : "subscription_checkout_unpaid",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            plan,
            stripe_subscription_id: subscriptionId,
            replaced_subscription_id: supersededSubId,
            payment_status: session.payment_status,
          },
        });
        break;
      }

      await upsertSubscriptionRecord(supabase, {
        organizationId,
        plan,
        interval,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: sessionStatus,
        periodFields: {
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        eventCreated: event.created,
        isReplacement: true,
      });

      if (isPaidSettled) {
        await approveOrganizationIfEligible(supabase, organizationId);

        await supabase.from("audit_logs").insert({
          action: "subscription_activated",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: { plan, stripe_subscription_id: subscriptionId },
        });
      } else {
        await supabase.from("audit_logs").insert({
          action: "subscription_checkout_unpaid",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            plan,
            stripe_subscription_id: subscriptionId,
            payment_status: session.payment_status,
          },
        });
      }
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (organizationId && subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        await approveOrganizationIfEligible(supabase, organizationId);

        await supabase.from("audit_logs").insert({
          action: "subscription_async_payment_succeeded",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            stripe_subscription_id: subscriptionId,
            session_id: session.id,
          },
        });
      }
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (organizationId && subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "incomplete",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        await supabase.from("audit_logs").insert({
          action: "subscription_async_payment_failed",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            stripe_subscription_id: subscriptionId,
            session_id: session.id,
          },
        });
      }
      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("organization_id, updated_at")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (
          subscription?.updated_at &&
          event.created * 1000 < new Date(subscription.updated_at).getTime() - 5000
        ) {
          console.warn(
            `[stripe-webhook] Skipping stale invoice event ${event.id} for subscription ${subscriptionId}`,
          );
        } else if (subscription) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
      }

      if (invoice.status === "paid" || event.type !== "invoice.finalized") {
        try {
          await syncInvoiceRecord(supabase, invoice);
        } catch (invoiceError) {
          console.error(
            `[stripe-webhook] Invoice sync failed for ${invoice.id}:`,
            invoiceError instanceof Error ? invoiceError.message : invoiceError,
          );
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("organization_id, updated_at")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        // Stale event guard: do not overwrite newer subscription state with older payment failure
        if (
          subscription?.updated_at &&
          event.created * 1000 < new Date(subscription.updated_at).getTime() - 5000
        ) {
          console.warn(
            `[stripe-webhook] Skipping stale payment_failed event ${event.id} for subscription ${subscriptionId}`,
          );
          break;
        }

        if (subscription) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const mappedStatus = SUBSCRIPTION_STATUS_MAP[subscription.status] || "incomplete";
      const periodFields = getSubscriptionPeriodFields(subscription);
      const planInfo = resolvePlanFromSubscription(subscription);
      const organizationId = subscription.metadata?.organization_id;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null;

      if (event.type === "customer.subscription.created" && organizationId && planInfo) {
        await upsertSubscriptionRecord(supabase, {
          organizationId,
          plan: planInfo.plan,
          interval: planInfo.interval,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: mappedStatus,
          periodFields,
          eventCreated: event.created,
          isReplacement: false,
        });

        if (mappedStatus === "active" || mappedStatus === "trialing") {
          await approveOrganizationIfEligible(supabase, organizationId);
        }
      } else {
        const { data: currentSub } = await supabase
          .from("subscriptions")
          .select("organization_id, updated_at, status")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        // Stale event guard: prevent out-of-order webhook delivery from overwriting newer state
        if (
          currentSub?.updated_at &&
          event.created * 1000 < new Date(currentSub.updated_at).getTime() - 5000
        ) {
          console.warn(
            `[stripe-webhook] Stale out-of-order event ${event.id} received for subscription ${subscriptionId}. Attempting authoritative retrieval from Stripe...`,
          );
          try {
            const authoritativeSub = await getStripe().subscriptions.retrieve(subscriptionId);
            const authStatus = SUBSCRIPTION_STATUS_MAP[authoritativeSub.status] || "incomplete";
            const authPlan = resolvePlanFromSubscription(authoritativeSub);
            const authPeriods = getSubscriptionPeriodFields(authoritativeSub);

            await supabase
              .from("subscriptions")
              .update({
                status: authStatus,
                ...(authPlan ? { plan_code: authPlan.plan, billing_interval: authPlan.interval } : {}),
                ...authPeriods,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subscriptionId);

            console.info(
              `[stripe-webhook] Synchronized subscription ${subscriptionId} with authoritative Stripe state.`,
            );
          } catch (authErr) {
            console.warn(
              `[stripe-webhook] Could not retrieve authoritative subscription ${subscriptionId} from Stripe (${authErr instanceof Error ? authErr.message : authErr}). Skipping stale payload.`,
            );
          }
          break;
        }

        const { data: updatedSub } = await supabase
          .from("subscriptions")
          .update({
            status: mappedStatus,
            ...(planInfo ? { plan_code: planInfo.plan, billing_interval: planInfo.interval } : {}),
            ...periodFields,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId)
          .select("organization_id")
          .maybeSingle();

        if (updatedSub) {
          if (mappedStatus === "canceled") {
            // Mark subscription canceled; do not grant active entitlement without payment
            await supabase
              .from("subscriptions")
              .update({
                status: "canceled",
                cancel_at_period_end: false,
                canceled_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subscriptionId);

            await supabase.from("audit_logs").insert({
              action: "subscription_canceled",
              resource_type: "subscription",
              resource_id: updatedSub.organization_id,
              metadata: { reason: "stripe_subscription_updated_canceled" },
            });
          } else if (mappedStatus === "active" || mappedStatus === "trialing") {
            const { data: org } = await supabase
              .from("organizations")
              .select("status")
              .eq("id", updatedSub.organization_id)
              .single();
            const { count: fraudCount } = await supabase
              .from("fraud_flags")
              .select("id", { count: "exact", head: true })
              .eq("resource_id", updatedSub.organization_id)
              .eq("status", "open");

            if (org?.status === "suspended" && fraudCount === 0) {
              await supabase
                .from("organizations")
                .update({ status: "approved", suspended_at: null })
                .eq("id", updatedSub.organization_id);
            }
          }
        } else if (organizationId && planInfo) {
          // Fallback when subscription row not found by stripe_subscription_id (e.g. out-of-order customer.subscription.updated before created).
          // Serialized upsertSubscriptionRecord handles stale checks, concurrency, and secondary subscription rejection.
          await upsertSubscriptionRecord(supabase, {
            organizationId,
            plan: planInfo.plan,
            interval: planInfo.interval,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            status: mappedStatus,
            periodFields,
            eventCreated: event.created,
            isReplacement: false,
          });

          if (mappedStatus === "active" || mappedStatus === "trialing") {
            await approveOrganizationIfEligible(supabase, organizationId);
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      // 1. Verify subscription matching stripe_subscription_id exists and check for stale event
      const { data: targetSub } = await supabase
        .from("subscriptions")
        .select("organization_id, updated_at, stripe_subscription_id, version")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();

      // If no subscription matches this stripe_subscription_id, it is already deleted or superseded.
      // Do NOT revert the active subscription to Starter!
      if (!targetSub) {
        console.warn(
          `[stripe-webhook] Skipping deletion event ${event.id}: No local subscription matches stripe_subscription_id ${subscriptionId}`,
        );
        break;
      }

      // Stale event guard: do not revert if a newer event already updated this subscription
      if (
        targetSub.updated_at &&
        event.created * 1000 < new Date(targetSub.updated_at).getTime() - 5000
      ) {
        console.warn(
          `[stripe-webhook] Skipping stale customer.subscription.deleted event ${event.id} for subscription ${subscriptionId}`,
        );
        break;
      }

      // 2. Database-level atomic concurrency protection:
      // First attempt atomic RPC using PostgreSQL row-level lock (SELECT FOR UPDATE)
      let revertedSuccessfully = false;
      try {
        const { data: rpcSuccess, error: rpcErr } = await supabase.rpc(
          "atomic_subscription_revert_to_starter",
          {
            p_organization_id: targetSub.organization_id,
            p_stripe_subscription_id: subscriptionId,
            p_expected_version: targetSub.version ?? null,
          },
        );
        if (!rpcErr && rpcSuccess === true) {
          revertedSuccessfully = true;
        }
      } catch {
        // RPC not deployed in this environment yet; fall through to atomic conditional update
      }

      // Fallback: Database-level atomic conditional update with version or exact updated_at OCC
      if (!revertedSuccessfully) {
        const updateQuery = supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId)
          .eq("organization_id", targetSub.organization_id);

        if (typeof targetSub.version === "number") {
          updateQuery.eq("version", targetSub.version);
        } else {
          updateQuery.eq("updated_at", targetSub.updated_at);
        }

        const { data: deletedSub } = await updateQuery
          .select("organization_id")
          .maybeSingle();

        if (deletedSub) {
          revertedSuccessfully = true;
        }
      }

      if (!revertedSuccessfully) {
        console.warn(
          `[stripe-webhook] Concurrent write or state change detected for subscription ${subscriptionId}. Preserving newer committed state.`,
        );
        break;
      }

      // Revert organization to Starter plan entitlement.
      // Organization remains approved; existing inventory is preserved.
      await supabase.from("audit_logs").insert({
        action: "subscription_reverted_to_starter",
        resource_type: "subscription",
        resource_id: targetSub.organization_id,
        metadata: {
          reason: "stripe_subscription_deleted",
          stripe_subscription_id: subscriptionId,
        },
      });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.client_reference_id;

      if (organizationId) {
        await supabase.from("audit_logs").insert({
          action: "checkout_abandoned",
          resource_type: "subscription",
          resource_id: organizationId,
          metadata: {
            stripe_session_id: session.id,
            plan: session.metadata?.plan,
          },
        });
      }
      break;
    }

    default:
      console.info(`Unhandled Stripe event type: ${event.type}`);

      await supabase.from("audit_logs").insert({
        action: "webhook_unhandled_event_type",
        resource_type: "stripe_event",
        metadata: {
          stripe_event_id: event.id,
          event_type: event.type,
        },
      });
  }
}
