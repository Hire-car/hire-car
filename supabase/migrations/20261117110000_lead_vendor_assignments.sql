-- Migration: 20261117110000_lead_vendor_assignments.sql
-- Purpose: Support multi-vendor location-based lead distribution without duplicating leads.
-- All changes are forward-only, additive, and safe for existing records.

-- Allow general location leads without a specific vehicle or primary vendor
alter table public.leads
  alter column vehicle_id drop not null,
  alter column vendor_id drop not null;

-- Align leads_archive columns so general location leads can be archived without constraint failure
alter table public.leads_archive
  alter column vehicle_id drop not null,
  alter column vendor_id drop not null;

create table if not exists public.lead_vendor_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'viewed', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  constraint lead_vendor_assignments_lead_org_unique unique (lead_id, organization_id)
);

-- Indices for performance
create index if not exists idx_lead_vendor_assignments_org
  on public.lead_vendor_assignments (organization_id, assigned_at desc);

create index if not exists idx_lead_vendor_assignments_lead
  on public.lead_vendor_assignments (lead_id);

-- Enable RLS
alter table public.lead_vendor_assignments enable row level security;

-- Vendors can view assignments for their own organizations
create policy "members read own lead assignments"
  on public.lead_vendor_assignments
  for select
  using (
    app_private.is_org_member(organization_id)
    or app_private.is_platform_admin()
  );

-- Update leads policy so vendors assigned via location can also view the lead details
drop policy if exists "members read own leads" on public.leads;

create policy "members read own leads" on public.leads
  for select using (
    customer_user_id = auth.uid()
    or lower(customer_email) = (select lower(email) from public.profiles where id = auth.uid())
    or app_private.is_org_member(vendor_id)
    or app_private.is_platform_admin()
    or exists (
      select 1 from public.lead_vendor_assignments lva
      where lva.lead_id = leads.id
        and app_private.is_org_member(lva.organization_id)
    )
  );
