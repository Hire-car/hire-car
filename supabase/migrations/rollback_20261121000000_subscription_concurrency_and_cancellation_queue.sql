-- ============================================================================
-- Rollback Migration: rollback_20261121000000_subscription_concurrency_and_cancellation_queue.sql
-- Description: Reverses changes introduced in 20261121000000_subscription_concurrency_and_cancellation_queue.sql
-- PREPARED FOR REVIEW ONLY - DO NOT EXECUTE AGAINST PRODUCTION
-- ============================================================================

BEGIN;

-- 1. Precondition Guard: Protect Unresolved Cancellation Queue Records
-- Fails closed if any unresolved (pending or processing) records exist in public.stripe_cancellation_queue
DO $$
DECLARE
  v_unresolved_count integer := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'stripe_cancellation_queue'
  ) THEN
    SELECT count(*) INTO v_unresolved_count
    FROM public.stripe_cancellation_queue
    WHERE status IN ('pending', 'processing');

    IF v_unresolved_count > 0 THEN
      RAISE EXCEPTION 'Rollback Aborted: Found % unresolved cancellation record(s) with status in (pending, processing) in public.stripe_cancellation_queue. Refusing to drop cancellation queue table to prevent destroying uncompleted cancellation tasks. Process or reconcile pending cancellations before rolling back.', v_unresolved_count;
    END IF;

    -- If only resolved records exist (completed/failed), archive them to audit_logs before table deletion
    INSERT INTO public.audit_logs (action, resource_type, resource_id, metadata)
    SELECT 
      'cancellation_queue_rollback_archive',
      'stripe_cancellation_queue',
      organization_id,
      jsonb_build_object(
        'queue_id', id,
        'stripe_subscription_id', stripe_subscription_id,
        'status', status,
        'reason', reason,
        'attempt_count', attempt_count,
        'last_error', last_error,
        'created_at', created_at,
        'completed_at', completed_at
      )
    FROM public.stripe_cancellation_queue;
  END IF;
END $$;

-- 2. Drop Stored Procedures
DROP FUNCTION IF EXISTS app_private.atomic_subscription_revert_to_starter(uuid, text, integer);
DROP FUNCTION IF EXISTS app_private.claim_cancellation_queue_batch(integer, interval);

-- 3. Drop Trigger and Version Increment Function
DROP TRIGGER IF EXISTS trg_increment_subscription_version ON public.subscriptions;
DROP FUNCTION IF EXISTS app_private.trg_increment_subscription_version();

-- 4. Safe Drop of Cancellation Queue Table (Only reached if 0 unresolved records exist)
DROP TABLE IF EXISTS public.stripe_cancellation_queue CASCADE;

-- 5. Drop Monotonic Version Column
ALTER TABLE public.subscriptions DROP COLUMN IF EXISTS version;

COMMIT;
