-- Auto-approve vendors upon registration

create or replace function app_private.create_vendor_onboarding(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_business_name text,
  p_slug text,
  p_abn text,
  p_website text,
  p_address text,
  p_city text,
  p_state text,
  p_branch_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
begin
  -- Create organization (auto-approved instead of pending)
  insert into public.organizations (name, slug, abn, billing_email, website, phone, address, status)
  values (p_business_name, p_slug, p_abn, p_email, p_website, p_phone, p_address, 'approved')
  returning id into v_organization_id;

  -- Create organization member
  insert into public.organization_members (organization_id, user_id, role)
  values (v_organization_id, p_user_id, 'owner');

  -- Create initial branch (auto-approved)
  insert into public.branches (organization_id, name, slug, city, state, address, phone, status)
  values (v_organization_id, p_city || ' branch', p_branch_slug, p_city, p_state, p_address, p_phone, 'approved');

  -- Record legal acceptance
  insert into public.legal_acceptances (organization_id, user_id, document_slug, version)
  values (v_organization_id, p_user_id, 'vendor-agreement', 'vendor-agreement-v1');

  -- Log audit event
  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (p_user_id, 'vendor_onboarding_submitted', 'organization', v_organization_id, jsonb_build_object('source', 'vendor_onboarding_atomic'));

  return v_organization_id;
exception when others then
  -- Rollback happens automatically on exception in plpgsql
  raise exception 'Failed to create vendor onboarding: %', sqlerrm;
end;
$$;
