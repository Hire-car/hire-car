-- Migration: 20261117100000_phone_otp_and_discount_pricing.sql
-- Purpose: Add phone OTP challenges table, discounted pricing fields to vehicles, and price snapshot to leads.
-- All changes are forward-only, additive, and safe for existing records.

-- 1. Phone OTP challenges table
create table if not exists public.phone_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  code_hash text not null,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  vendor_id uuid references public.organizations(id) on delete cascade,
  verified boolean not null default false,
  attempt_count integer not null default 0,
  ip_hash text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Index for expiration lookups and active challenges
create index if not exists idx_phone_otp_challenges_phone_vehicle
  on public.phone_otp_challenges (phone_e164, vehicle_id);

create index if not exists idx_phone_otp_challenges_expires_at
  on public.phone_otp_challenges (expires_at);

-- Enable RLS (Service role only access via admin client)
alter table public.phone_otp_challenges enable row level security;

-- 2. Additive discount fields to vehicles
alter table public.vehicles
  add column if not exists offer_price_aud integer default null
    constraint vehicles_offer_price_check check (offer_price_aud is null or offer_price_aud > 0),
  add column if not exists offer_label text default null;

comment on column public.vehicles.offer_price_aud is 'Discounted daily rental price in AUD. When set, displayed alongside original price.';
comment on column public.vehicles.offer_label is 'Promotional offer label (e.g. Special Deal, Early Bird).';

-- 3. Additive price snapshot and phone verification tracking to leads
alter table public.leads
  add column if not exists snapshot_price_per_day_aud integer default null,
  add column if not exists snapshot_offer_price_aud integer default null,
  add column if not exists phone_verified boolean not null default false;

comment on column public.leads.snapshot_price_per_day_aud is 'Snapshot of regular daily rate at enquiry time.';
comment on column public.leads.snapshot_offer_price_aud is 'Snapshot of discounted offer rate at enquiry time if applicable.';
comment on column public.leads.phone_verified is 'Indicates whether the customer verified their phone number via OTP prior to enquiry submission.';
