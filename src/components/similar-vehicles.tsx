import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { VehicleCard } from "@/components/vehicle-card";
import { resolveVehicleImage } from "@/lib/image-utils";
import type { Vehicle } from "@/lib/types";
import type { VehicleImageRecord } from "@/lib/image-utils";

interface SimilarVehiclesProps {
  currentVehicleId: string;
  city: string;
  category: string;
  make: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function SimilarVehicles({ currentVehicleId, city, category: _category, make: _make }: SimilarVehiclesProps) {
  const supabase = createAdminClient();

  const { data } = await supabase
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
    .neq("id", currentVehicleId)
    .limit(4);

  if (!data || data.length === 0) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const vehicles: Vehicle[] = data.map((v) => {
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

  return (
    <section className="mt-16 pt-12 border-t border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Similar Car Hire in {city}</h2>
        <Link
          href={`/locations/${city.toLowerCase()}`}
          className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </div>
    </section>
  );
}
