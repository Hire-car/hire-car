import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import { getCachedSimilarVehicles } from "@/lib/data/public";

interface SimilarVehiclesProps {
  currentVehicleId: string;
  city: string;
  category: string;
  make: string;
}

export async function SimilarVehicles({ currentVehicleId, city, category, make }: SimilarVehiclesProps) {
  const vehicles = await getCachedSimilarVehicles(currentVehicleId, city, category, make);

  if (vehicles.length === 0) {
    return null;
  }

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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
      </div>
    </section>
  );
}