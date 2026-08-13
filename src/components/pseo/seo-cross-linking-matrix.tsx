import Link from "next/link";
import { getCitiesWithCounts } from "@/lib/seo/discovery";
import { VEHICLE_CATEGORIES, categoryToSlug, cityToSlug } from "@/lib/seo";

export async function SeoCrossLinkingMatrix({ currentCity }: { currentCity?: string }) {
  // Fetch cities for linking
  const cities = await getCitiesWithCounts();
  const topCities = cities.sort((a, b) => b.vehicleCount - a.vehicleCount).slice(0, 10);
  
  // Popular Intents
  const intents = [
    { name: "Wedding Car Hire", slug: "wedding" },
    { name: "Long Term Car Hire", slug: "long-term" },
    { name: "Under 25 Car Hire", slug: "under-25" },
    { name: "Cheap Car Hire", slug: "cheap" }
  ];

  // Top Airports dynamically generated from cities
  const airports = topCities.map((city) => ({
    name: `${city.city} Airport`,
    citySlug: city.slug,
  }));

  return (
    <section className="bg-slate-100 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Explore Car Hire in Australia</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Top Cities */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Top Locations</h3>
            <ul className="space-y-2">
              {topCities.map(city => (
                <li key={city.slug}>
                  <Link href={`/locations/${city.slug}`} className="text-slate-600 hover:text-amber-600 text-sm">
                    Car Hire {city.city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Vehicle Types</h3>
            <ul className="space-y-2">
              {VEHICLE_CATEGORIES.map(cat => (
                <li key={cat}>
                  <Link href={`/categories/${categoryToSlug(cat)}`} className="text-slate-600 hover:text-amber-600 text-sm">
                    {cat} Hire Australia
                  </Link>
                  {currentCity && (
                    <Link href={`/locations/${cityToSlug(currentCity)}/${categoryToSlug(cat)}`} className="text-slate-400 hover:text-amber-600 text-xs ml-2 block mt-1">
                      ↳ in {currentCity}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Airports */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Airport Car Hire</h3>
            <ul className="space-y-2">
              {airports.map(airport => (
                <li key={airport.name}>
                  <Link href={`/locations/${airport.citySlug}/airport`} className="text-slate-600 hover:text-amber-600 text-sm">
                    {airport.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Use Cases */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Specialty Hire</h3>
            <ul className="space-y-2">
              {intents.map(intent => (
                <li key={intent.slug}>
                  <Link href={`/car-hire/${intent.slug}`} className="text-slate-600 hover:text-amber-600 text-sm">
                    {intent.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
