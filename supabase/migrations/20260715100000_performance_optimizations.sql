-- 1. Vendor Dashboard Metrics
CREATE OR REPLACE FUNCTION get_vendor_dashboard_metrics(org_id UUID)
RETURNS TABLE (
    total_views BIGINT,
    active_listings BIGINT,
    pending_listings BIGINT,
    total_vehicles BIGINT,
    new_leads BIGINT,
    total_leads BIGINT,
    phone_clicks_30d BIGINT,
    whatsapp_clicks_30d BIGINT,
    total_clicks_30d BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    (SELECT COALESCE(SUM(views_count), 0) FROM public.vehicles WHERE organization_id = org_id) as total_views,
    (SELECT COUNT(*) FROM public.vehicles WHERE organization_id = org_id AND status = 'approved') as active_listings,
    (SELECT COUNT(*) FROM public.vehicles WHERE organization_id = org_id AND status = 'pending') as pending_listings,
    (SELECT COUNT(*) FROM public.vehicles WHERE organization_id = org_id) as total_vehicles,
    (SELECT COUNT(*) FROM public.leads WHERE vendor_id = org_id AND status = 'new') as new_leads,
    (SELECT COUNT(*) FROM public.leads WHERE vendor_id = org_id) as total_leads,
    (SELECT COUNT(*) FROM public.contact_clicks WHERE vendor_id = org_id AND channel = 'phone' AND created_at >= NOW() - INTERVAL '30 days') as phone_clicks_30d,
    (SELECT COUNT(*) FROM public.contact_clicks WHERE vendor_id = org_id AND channel = 'whatsapp' AND created_at >= NOW() - INTERVAL '30 days') as whatsapp_clicks_30d,
    (SELECT COUNT(*) FROM public.contact_clicks WHERE vendor_id = org_id AND created_at >= NOW() - INTERVAL '30 days') as total_clicks_30d;
$$;

-- 2. Homepage City Stats (Avoids downloading all vehicles)
CREATE OR REPLACE FUNCTION get_homepage_city_stats()
RETURNS TABLE (
    city TEXT,
    vehicle_count BIGINT,
    min_price NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    b.city,
    COUNT(v.id) as vehicle_count,
    MIN(v.price_per_day_aud) as min_price
  FROM public.vehicles v
  JOIN public.branches b ON v.branch_id = b.id
  WHERE v.status = 'approved' AND b.status = 'approved' AND b.city IS NOT NULL
  GROUP BY b.city;
$$;

-- 3. Marketplace Stats (Avoids downloading all vehicle/branch data just for counts)
CREATE OR REPLACE FUNCTION get_marketplace_stats_optimized()
RETURNS TABLE (
    operator_count BIGINT,
    city_count BIGINT,
    vehicle_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.organizations WHERE status = 'approved') as operator_count,
    (
      SELECT COUNT(DISTINCT LOWER(b.city)) 
      FROM public.vehicles v
      JOIN public.branches b ON v.branch_id = b.id
      WHERE v.status = 'approved' AND b.status = 'approved' AND b.city IS NOT NULL
    ) as city_count,
    (
      SELECT COUNT(*) 
      FROM public.vehicles v
      JOIN public.branches b ON v.branch_id = b.id
      WHERE v.status = 'approved' AND b.status = 'approved'
    ) as vehicle_count;
$$;
