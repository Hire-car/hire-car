import type { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface CancellationQueueItem {
  id?: string;
  organization_id: string;
  stripe_subscription_id: string;
  reason: "unauthorized_secondary" | "superseded_replacement";
  attempt_count?: number;
  max_attempts?: number;
  status?: "pending" | "processing" | "completed" | "failed";
  last_error?: string | null;
  next_retry_at?: string;
  created_at?: string;
}

const MAX_CANCELLATION_ATTEMPTS = 5;

/**
 * Calculates exponential backoff delay in milliseconds.
 * Attempt 1: 1 min, Attempt 2: 4 min, Attempt 3: 16 min, Attempt 4: 64 min (~1 hr), Attempt 5: 256 min (~4 hr)
 */
export function calculateCancellationBackoffMs(attemptCount: number): number {
  const baseMinutes = Math.pow(4, Math.max(0, attemptCount - 1));
  return Math.min(baseMinutes * 60 * 1000, 24 * 60 * 60 * 1000);
}

/**
 * Persists a failed Stripe subscription cancellation into the recovery queue table
 * and writes a structured audit log so the failure is immediately visible.
 */
export async function enqueueFailedCancellation(
  supabase: AdminClient,
  input: {
    organizationId: string;
    stripeSubscriptionId: string;
    reason: "unauthorized_secondary" | "superseded_replacement";
    error: unknown;
  },
): Promise<void> {
  const errorMessage = input.error instanceof Error ? input.error.message : String(input.error);
  const now = new Date();
  const nextRetry = new Date(now.getTime() + calculateCancellationBackoffMs(1));

  try {
    // Check if this subscription is already in the queue
    const { data: existing } = await supabase
      .from("stripe_cancellation_queue")
      .select("id, attempt_count, status")
      .eq("stripe_subscription_id", input.stripeSubscriptionId)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (!existing) {
      await supabase.from("stripe_cancellation_queue").insert({
        organization_id: input.organizationId,
        stripe_subscription_id: input.stripeSubscriptionId,
        reason: input.reason,
        attempt_count: 1,
        max_attempts: MAX_CANCELLATION_ATTEMPTS,
        status: "pending",
        last_error: errorMessage,
        next_retry_at: nextRetry.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }

    // Always record audit log for administrator visibility
    await supabase.from("audit_logs").insert({
      action: "stripe_cancellation_queued",
      resource_type: "subscription",
      resource_id: input.organizationId,
      metadata: {
        stripe_subscription_id: input.stripeSubscriptionId,
        reason: input.reason,
        error: errorMessage,
        next_retry_at: nextRetry.toISOString(),
      },
    });
  } catch (enqueueErr) {
    const isUniqueViolation =
      (enqueueErr as { code?: string })?.code === "23505" ||
      String(enqueueErr).includes("uq_stripe_cancellation_queue_active");

    if (isUniqueViolation) {
      // Already queued as pending or processing; deduplicated idempotently
      return;
    }

    console.error(
      `[cancellation-recovery] Failed to persist failed cancellation for ${input.stripeSubscriptionId}:`,
      enqueueErr,
    );
  }
}

/**
 * Processes pending items in the Stripe cancellation queue with exponential backoff.
 * Reconciles the live Stripe status before attempting cancellation,
 * and ensures the newly authorized replacement subscription is NEVER canceled.
 */
export async function processCancellationQueue(
  supabase: AdminClient,
  stripe: Stripe,
  options: { maxBatch?: number } = {},
): Promise<{ processed: number; completed: number; failed: number }> {
  const maxBatch = options.maxBatch ?? 20;
  const nowIso = new Date().toISOString();
  const results = { processed: 0, completed: 0, failed: 0 };

  let items: Array<{
    id: string;
    organization_id: string;
    stripe_subscription_id: string;
    reason: "unauthorized_secondary" | "superseded_replacement";
    attempt_count: number;
    max_attempts: number;
  }> = [];

  // Attempt atomic claiming via database RPC (FOR UPDATE SKIP LOCKED) with stuck processing recovery
  try {
    if (typeof supabase.rpc === "function") {
      const { data: rpcItems, error: rpcErr } = await supabase.rpc(
        "claim_cancellation_queue_batch",
        { p_batch_size: maxBatch },
      );
      if (!rpcErr && Array.isArray(rpcItems) && rpcItems.length > 0) {
        items = rpcItems;
      }
    }
  } catch {
    // RPC not deployed in this environment yet; fall through to query fallback
  }

  // Fallback if RPC is not deployed in current environment
  if (items.length === 0) {
    // 1. Recover stuck processing items whose worker timed out (> 10 minutes)
    try {
      const stuckCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabase
        .from("stripe_cancellation_queue")
        .update({ status: "pending", updated_at: nowIso })
        .eq("status", "processing")
        .lt("updated_at", stuckCutoff);
    } catch {
      // Non-blocking in environments without matching index/method
    }

    // 2. Query pending items ready for retry
    const { data: fallbackItems, error: fetchError } = await supabase
      .from("stripe_cancellation_queue")
      .select("id, organization_id, stripe_subscription_id, reason, attempt_count, max_attempts")
      .in("status", ["pending", "processing"])
      .lte("next_retry_at", nowIso)
      .order("next_retry_at", { ascending: true })
      .limit(maxBatch);

    if (fetchError || !fallbackItems || fallbackItems.length === 0) {
      return results;
    }
    items = fallbackItems;
  }

  for (const item of items) {
    results.processed++;

    try {
      // 1. SAFETY CHECK: Check the organization's current active subscription in the database.
      // Ensure we NEVER cancel the newly authorized replacement subscription!
      const { data: currentOrgSub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("organization_id", item.organization_id)
        .maybeSingle();

      if (
        Boolean(currentOrgSub?.stripe_subscription_id) &&
        currentOrgSub?.stripe_subscription_id === item.stripe_subscription_id &&
        (currentOrgSub?.status === "active" || currentOrgSub?.status === "trialing")
      ) {
        console.error(
          `[cancellation-recovery] SAFETY ABORT: Subscription ${item.stripe_subscription_id} is currently recorded as ACTIVE primary for org ${item.organization_id}. Refusing to cancel.`,
        );

        await supabase
          .from("stripe_cancellation_queue")
          .update({
            status: "failed",
            last_error: "Safety abort: subscription is currently recorded as primary active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        await supabase.from("audit_logs").insert({
          action: "stripe_cancellation_aborted_active_primary",
          resource_type: "subscription",
          resource_id: item.organization_id,
          metadata: {
            alert: "CRITICAL_CONFLICT_ABORTED",
            stripe_subscription_id: item.stripe_subscription_id,
          },
        });
        results.failed++;
        continue;
      }

      // 2. RECONCILE: Check live Stripe state first. If already canceled in Stripe, mark complete idempotently.
      let liveStripeSub: Stripe.Subscription | null = null;
      try {
        liveStripeSub = await stripe.subscriptions.retrieve(item.stripe_subscription_id);
      } catch (retrieveErr: unknown) {
        const stripeError = retrieveErr as { code?: string; status?: number };
        if (stripeError.code === "resource_missing" || stripeError.status === 404) {
          // Does not exist in Stripe; consider complete
          liveStripeSub = null;
        } else {
          throw retrieveErr;
        }
      }

      if (!liveStripeSub || liveStripeSub.status === "canceled") {
        await supabase
          .from("stripe_cancellation_queue")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.completed++;
        continue;
      }

      // 3. EXECUTE CANCEL: Subscription is still active in Stripe, attempt cancellation
      await stripe.subscriptions.cancel(item.stripe_subscription_id, { prorate: true });

      await supabase
        .from("stripe_cancellation_queue")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      await supabase.from("audit_logs").insert({
        action: "stripe_cancellation_retry_succeeded",
        resource_type: "subscription",
        resource_id: item.organization_id,
        metadata: {
          stripe_subscription_id: item.stripe_subscription_id,
          reason: item.reason,
          attempt_count: item.attempt_count + 1,
        },
      });

      results.completed++;
    } catch (retryError) {
      const errorMsg = retryError instanceof Error ? retryError.message : String(retryError);
      const nextAttempt = (item.attempt_count ?? 1) + 1;
      const isPermanentlyFailed = nextAttempt > (item.max_attempts ?? MAX_CANCELLATION_ATTEMPTS);

      if (isPermanentlyFailed) {
        await supabase
          .from("stripe_cancellation_queue")
          .update({
            status: "failed",
            attempt_count: nextAttempt,
            last_error: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Alert administrator of persistent unrecoverable failure
        await supabase.from("audit_logs").insert({
          action: "stripe_cancellation_permanently_failed",
          resource_type: "subscription",
          resource_id: item.organization_id,
          metadata: {
            alert: "ADMIN_ACTION_REQUIRED",
            stripe_subscription_id: item.stripe_subscription_id,
            reason: item.reason,
            attempt_count: nextAttempt,
            last_error: errorMsg,
          },
        });

        results.failed++;
      } else {
        const nextRetryMs = calculateCancellationBackoffMs(nextAttempt);
        const nextRetryDate = new Date(Date.now() + nextRetryMs).toISOString();

        await supabase
          .from("stripe_cancellation_queue")
          .update({
            status: "pending",
            attempt_count: nextAttempt,
            last_error: errorMsg,
            next_retry_at: nextRetryDate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.failed++;
      }
    }
  }

  return results;
}
