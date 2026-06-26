import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type FeaturedVehicle = {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  city: string;
  organizationName: string;
  imageUrl?: string;
};

export const getActiveFeaturedVehicles = unstable_cache(
  async function getActiveFeaturedVehicles(city?: string | null): Promise<FeaturedVehicle[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("featured_placements")
    .select(`
      id, city, vehicle_id,
      vehicles!inner(
        id, slug, title, make, model, year, category, price_per_day_aud, status,
        branches!inner(city, status),
        organizations!inner(name, status)
      )
    `)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .eq("vehicles.status", "approved")
    .eq("vehicles.branches.status", "approved")
    .eq("vehicles.organizations.status", "approved");

  if (city) {
    query = query.or(`city.is.null,city.ilike.${city}`);
  }

  const { data, error } = await query.limit(12);

  if (error || !data) {
    return [];
  }

  const results: FeaturedVehicle[] = [];

  for (const row of data) {
    type VehicleRow = {
      id: string;
      slug: string;
      title: string;
      make: string;
      model: string;
      year: number;
      category: string;
      price_per_day_aud: number;
      status: string;
      branches: { city: string; status: string };
      organizations: { name: string; status: string };
    };

    const v = row.vehicles as unknown as VehicleRow;

    results.push({
      id: v.id,
      slug: v.slug,
      title: v.title,
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      pricePerDay: v.price_per_day_aud,
      city: v.branches.city,
      organizationName: v.organizations.name,
    });
  }

  return results;
}, ["featured-vehicles"], { revalidate: 3600, tags: ["featured"] });

export type HomeTestimonial = {
  id: string;
  author: string;
  location: string;
  quote: string;
  rating: number;
};

/**
 * Returns genuine, approved customer reviews for use as homepage testimonials.
 * Only reviews that passed moderation (status = "approved") on approved
 * organizations are eligible, and only ratings of 4-5. Never fabricates data:
 * if there are no qualifying reviews the homepage simply hides the section.
 */
export const getApprovedTestimonials = unstable_cache(
  async function getApprovedTestimonials(limit = 4): Promise<HomeTestimonial[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id, customer_name, rating, body, created_at,
      organizations!inner(name, status, branches(city, status))
    `)
    .eq("status", "approved")
    .gte("rating", 4)
    .eq("organizations.status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  type ReviewRow = {
    id: string;
    customer_name: string | null;
    rating: number;
    body: string | null;
    organizations: {
      name: string;
      branches?: { city: string | null; status: string }[] | null;
    } | null;
  };

  const results: HomeTestimonial[] = [];

  for (const row of data as unknown as ReviewRow[]) {
    if (!row.body || !row.customer_name) continue;

    const org = row.organizations;
    const approvedBranch = org?.branches?.find((b) => b.status === "approved" && b.city);
    const location = approvedBranch?.city ?? org?.name ?? "Australia";

    results.push({
      id: row.id,
      author: row.customer_name,
      location,
      quote: row.body,
      rating: row.rating,
    });
  }

  return results;
}, ["approved-testimonials"], { revalidate: 3600, tags: ["testimonials", "reviews"] });

export type MarketplaceStats = {
  operatorCount: number;
  cityCount: number;
  vehicleCount: number;
};

/**
 * Returns live, provable marketplace counts derived only from approved records.
 * Used to render honest homepage stats. Returns zeros on error so the caller
 * can decide whether to show a stat or fall back to a qualitative claim.
 */
export const getMarketplaceStats = unstable_cache(
  async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const supabase = createAdminClient();

  const [{ count: operatorCount }, vehicleResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("vehicles")
      .select("id, branches!inner(city, status)", { count: "exact" })
      .eq("status", "approved")
      .eq("branches.status", "approved"),
  ]);

  const cities = new Set<string>();
  type CityRow = { branches?: { city: string | null } | null };
  (vehicleResult.data as unknown as CityRow[] | null)?.forEach((row) => {
    const city = row.branches?.city;
    if (city) cities.add(city.toLowerCase());
  });

  return {
    operatorCount: operatorCount ?? 0,
    cityCount: cities.size,
    vehicleCount: vehicleResult.count ?? 0,
  };
}, ["marketplace-stats"], { revalidate: 3600, tags: ["stats", "vehicles", "organizations"] });
