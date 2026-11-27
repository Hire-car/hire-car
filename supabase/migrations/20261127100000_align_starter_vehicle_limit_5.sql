-- Migration: Align Starter plan vehicle limit to 5 vehicles
-- Description: Updates the Starter plan vehicle limit in public.plans from 10 to 5,
-- matching marketing copy, FAQs, and pricing page promises.
-- Safety & Backward Compatibility:
-- 1. This change is strictly non-destructive.
-- 2. Existing vendor subscriptions, organizations, and approved vehicle listings are preserved.
-- 3. In the application code, existing listings remain approved and visible.
-- 4. Only the creation of new vehicles beyond the 5-vehicle cap will be constrained for Starter vendors.

UPDATE public.plans
SET vehicle_limit = 5
WHERE code = 'starter';
