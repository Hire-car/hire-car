import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vehicle } from "@/lib/types";
import { resolveVehicleImage, type VehicleImageRecord } from "@/lib/image-utils";

export const getCachedVehicleDetails = unstable_cache(
  async function getCachedVehicleDetails(slug: string) {
    const supabase = createAdminClient();

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select(`
        id, slug, title, description, make, model, year, seats, fuel, transmission, category,
        price_per_day_aud, daily_distance_limit_km, extra_distance_fee_aud, instant_book, status, organization_id, views_count,
        organizations(id, name, slug, status, verified_at),
        branches(name, city, state, status, phone, whatsapp),
        vehicle_images(id, storage_path, alt_text, sort_order, approved),
        vehicle_features(feature)
      `)
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    if (!vehicle) {
      return null;
    }

    const [vendorSubRes, reviewsRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_code, status")
        .eq("organization_id", vehicle.organization_id)
        .in("status", ["active", "trialing"])
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("id, customer_name, rating, body, created_at")
        .eq("organization_id", vehicle.organization_id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

    return {
      vehicle,
      vendorSub: vendorSubRes.data,
      reviews: reviewsRes.data ?? []
    };
  },
  ["public-vehicle-details-v2"],
  { revalidate: 3600, tags: ["vehicles", "public"] }
);

export const getCachedVehicleMetadata = unstable_cache(
  async function getCachedVehicleMetadata(slug: string) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("vehicles")
      .select("title, make, model, year, category, price_per_day_aud, vehicle_images(storage_path, approved, sort_order), branches(city, state)")
      .eq("slug", slug)
      .eq("status", "approved")
      .single();

    return data;
  },
  ["public-vehicle-metadata"],
  { revalidate: 3600, tags: ["vehicles", "public"] }
);

export const getCachedSimilarVehicles = unstable_cache(
  async function getCachedSimilarVehicles(
    currentVehicleId: string,
    city: string,
    category: string,
    make: string
  ): Promise<Vehicle[]> {
    const supabase = createAdminClient();

    // First try: same city + same category (most relevant)
    const { data: byCategoryData } = await supabase
      .from("vehicles")
      .select(`
        id, slug, title, make, model, year, seats, fuel, transmission, category,
        price_per_day_aud, status, instant_book,
        organizations!inner(name, slug),
        branches!inner(name, city, state, status),
        vehicle_images(storage_path, approved, sort_order)
      `)
      .eq("status", "approved")
      .eq("branches.city", city)
      .eq("category", category)
      .neq("id", currentVehicleId)
      .limit(4);

    let data = byCategoryData ?? [];

    // Top up with same make if fewer than 4 results
    if (data.length < 4) {
      const existingIds = new Set([currentVehicleId, ...data.map((v) => v.id)]);
      const { data: byMakeData } = await supabase
        .from("vehicles")
        .select(`
          id, slug, title, make, model, year, seats, fuel, transmission, category,
          price_per_day_aud, status, instant_book,
          organizations!inner(name, slug),
          branches!inner(name, city, state, status),
          vehicle_images(storage_path, approved, sort_order)
        `)
        .eq("status", "approved")
        .eq("branches.city", city)
        .eq("make", make)
        .neq("id", currentVehicleId)
        .limit(4 - data.length);

      const extras = (byMakeData ?? []).filter((v) => !existingIds.has(v.id));
      data = [...data, ...extras];
    }

    if (data.length === 0) {
      return [];
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    return data.map((v) => {
      const org = v.organizations as unknown as { name: string; slug: string };
      const branch = v.branches as unknown as { name: string; city: string; state: string };
      const imgs = (v.vehicle_images as unknown as VehicleImageRecord[]) ?? [];

      return {
        id: v.id,
        slug: v.slug,
        title: v.title,
        make: v.make,
        model: v.model,
        year: v.year,
        seats: v.seats,
        fuel: v.fuel,
        transmission: v.transmission,
        category: v.category,
        pricePerDayAud: v.price_per_day_aud,
        city: branch.city,
        state: branch.state,
        imageUrl: resolveVehicleImage(supabaseUrl, imgs, v.category),
        vendorName: org.name,
        vendorSlug: org.slug,
        branchName: branch.name,
        verified: true,
        instantBook: v.instant_book || false,
      };
    });
  },
  ["similar-vehicles-v1"],
  { revalidate: 3600, tags: ["vehicles", "public"] }
);