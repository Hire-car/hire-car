-- ============================================================================
-- Migration: 20261121000000_subscription_concurrency_and_cancellation_queue.sql
-- Description: Adds monotonic version column with database-level auto-increment trigger,
-- creates the stripe_cancellation_queue table with deduplication and RLS,
-- implements atomic queue-item claiming with stuck-item recovery,
-- and defines app_private.atomic_subscription_revert_to_starter with restricted permissions.
-- PREPARED FOR REVIEW ONLY - DO NOT EXECUTE AGAINST PRODUCTION
-- ============================================================================

-- 1. Add monotonic version column for optimistic concurrency control (OCC)
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- 2. Database-level trigger to guarantee automatic version increment on EVERY update
CREATE OR REPLACE FUNCTION app_private.trg_increment_subscription_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically increment monotonic version on every update
  NEW.version := COALESCE(OLD.version, 1) + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_subscription_version ON public.subscriptions;
CREATE TRIGGER trg_increment_subscription_version
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION app_private.trg_increment_subscription_version();

-- 3. Create dedicated queue table for failed Stripe subscription cancellations
CREATE TABLE IF NOT EXISTS public.stripe_cancellation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('unauthorized_secondary', 'superseded_replacement')),
  attempt_count integer DEFAULT 0 NOT NULL,
  max_attempts integer DEFAULT 5 NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  last_error text,
  next_retry_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Unique partial index to prevent duplicate active queue entries for the same subscription
CREATE UNIQUE INDEX IF NOT EXISTS uq_stripe_cancellation_queue_active 
  ON public.stripe_cancellation_queue (stripe_subscription_id) 
  WHERE status IN ('pending', 'processing');

-- Index for polling eligible items
CREATE INDEX IF NOT EXISTS idx_stripe_cancellation_queue_status_retry 
  ON public.stripe_cancellation_queue (status, next_retry_at) 
  WHERE status IN ('pending', 'processing');

-- Index for organization and subscription lookup
CREATE INDEX IF NOT EXISTS idx_stripe_cancellation_queue_org_sub 
  ON public.stripe_cancellation_queue (organization_id, stripe_subscription_id);

-- Enable RLS and restrict queue table access strictly to service_role
ALTER TABLE public.stripe_cancellation_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.stripe_cancellation_queue FROM PUBLIC;
REVOKE ALL ON TABLE public.stripe_cancellation_queue FROM anon;
REVOKE ALL ON TABLE public.stripe_cancellation_queue FROM authenticated;
GRANT ALL ON TABLE public.stripe_cancellation_queue TO service_role;

-- 4. Stored Procedure: Atomic queue-item claiming with stuck processing recovery (FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION app_private.claim_cancellation_queue_batch(
  p_batch_size integer DEFAULT 20,
  p_stuck_interval interval DEFAULT interval '10 minutes'
)
RETURNS SETOF public.stripe_cancellation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Auto-recover stuck processing items whose worker crashed or timed out
  UPDATE public.stripe_cancellation_queue
  SET 
    status = 'pending',
    last_error = COALESCE(last_error, '') || ' [Auto-recovered from stuck processing state]',
    updated_at = now()
  WHERE status = 'processing'
    AND updated_at < (now() - p_stuck_interval);

  -- 2. Atomically claim eligible items with FOR UPDATE SKIP LOCKED
  RETURN QUERY
  WITH claimable AS (
    SELECT id
    FROM public.stripe_cancellation_queue
    WHERE status = 'pending'
      AND next_retry_at <= now()
    ORDER BY next_retry_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.stripe_cancellation_queue q
  SET 
    status = 'processing',
    updated_at = now()
  FROM claimable
  WHERE q.id = claimable.id
  RETURNING q.*;
END;
$$;

REVOKE ALL ON FUNCTION app_private.claim_cancellation_queue_batch(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.claim_cancellation_queue_batch(integer, interval) FROM anon;
REVOKE ALL ON FUNCTION app_private.claim_cancellation_queue_batch(integer, interval) FROM authenticated;
GRANT EXECUTE ON FUNCTION app_private.claim_cancellation_queue_batch(integer, interval) TO service_role;

-- 5. Stored Procedure: Atomic subscription reversion to Starter with PostgreSQL row lock
CREATE OR REPLACE FUNCTION app_private.atomic_subscription_revert_to_starter(
  p_organization_id uuid,
  p_stripe_subscription_id text,
  p_expected_version integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_id uuid;
  v_current_sub_id text;
  v_current_version integer;
BEGIN
  -- Acquire row-level exclusive lock on the organization's subscription
  SELECT id, stripe_subscription_id, version
  INTO v_current_id, v_current_sub_id, v_current_version
  FROM public.subscriptions
  WHERE organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- 1. Verify identity: If stripe_subscription_id does not match, subscription was already superseded or deleted
  IF v_current_sub_id IS DISTINCT FROM p_stripe_subscription_id THEN
    RETURN false;
  END IF;

  -- 2. Verify version: If an expected version was provided, ensure row has not been mutated
  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RETURN false;
  END IF;

  -- 3. Atomically revert to Starter (trigger will auto-increment version and update updated_at)
  UPDATE public.subscriptions
  SET 
    plan_code = 'starter',
    status = 'active',
    billing_interval = 'monthly',
    stripe_subscription_id = NULL,
    cancel_at_period_end = false,
    canceled_at = now()
  WHERE id = v_current_id;

  RETURN true;
END;
$$;

-- Restrict execution strictly to service_role; revoke from public, anon, and authenticated
REVOKE ALL ON FUNCTION app_private.atomic_subscription_revert_to_starter(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.atomic_subscription_revert_to_starter(uuid, text, integer) FROM anon;
REVOKE ALL ON FUNCTION app_private.atomic_subscription_revert_to_starter(uuid, text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION app_private.atomic_subscription_revert_to_starter(uuid, text, integer) TO service_role;
