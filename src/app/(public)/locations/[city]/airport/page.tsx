import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { SeoCrossLinkingMatrix } from "@/components/pseo/seo-cross-linking-matrix";
import { searchVehicles } from "@/lib/search/typesense";
import {
  getCityMeta,
  buildBreadcrumbSchema,
  buildItemListSchema,
  buildFaqSchema,
  serializeSchemas,
} from "@/lib/seo";
import { Plane, MapPin } from "lucide-react";
import { getCitiesWithCounts } from "@/lib/seo/discovery";

export async function generateStaticParams() {
  const cities = await getCitiesWithCounts();
  return cities.map((c) => ({
    city: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const meta = getCityMeta(city);
  
  return {
    title: `Car Hire ${meta.title} Airport | Australian Rental Operators`,
    description: `Compare premium car hire options at ${meta.title} Airport. Book direct with verified Australian rental operators and avoid marketplace fees.`,
    alternates: { canonical: `/locations/${city}/airport` },
  };
}

export default async function AirportCarHirePage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const meta = getCityMeta(city);
  const displayCity = meta.title;

  const { vehicles, total } = await searchVehicles(
    "",
    { city: displayCity },
    { page: 1, perPage: 24 },
  );

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: displayCity, path: `/locations/${city}` },
      { name: `${displayCity} Airport`, path: `/locations/${city}/airport` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema([
      { question: `Where do I pick up my rental car at ${displayCity} Airport?`, answer: `Pick up instructions vary by operator. Many trusted Australian fleet owners on our marketplace offer direct terminal delivery, while others provide quick shuttle services from ${displayCity} Airport.` },
      { question: `Are there hidden fees for airport car hire in ${displayCity}?`, answer: `No. When you book through our marketplace, the price you see includes all taxes and basic insurance. There are zero marketplace booking fees, and you deal directly with the Australian operator.` }
    ])
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(schemas) }}
      />
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-950 to-slate-800 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
              <span>/</span>
              <Link href={`/locations/${city}`} className="hover:text-white transition-colors">{displayCity}</Link>
              <span>/</span>
              <span className="text-white font-medium">Airport</span>
            </nav>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">Airport Pickup Available</span>
              </div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                Car hire at {displayCity} Airport, Australia
              </h1>
              <p className="mt-3 text-slate-300 max-w-lg">
                Arriving at {displayCity} Airport? Skip the long queues at the rental desk and book directly with local Australian fleet operators for seamless airport delivery.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No vehicles found for ${displayCity} Airport`}
              description={`We couldn't find any rental cars available right now.`}
              actionLabel={`View all cars in ${displayCity}`}
              actionHref={`/locations/${city}`}
            />
          )}
        </section>

        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Why book your {displayCity} Airport car hire with us?</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Navigating {displayCity} Airport can be stressful enough without having to haggle over car rental prices at the terminal. 
              By booking through our marketplace, you connect directly with trusted Australian fleet owners who often offer direct terminal 
              delivery or quick shuttle services. 
            </p>
            <p className="text-slate-600 leading-relaxed">
              Support local Australian businesses and get exactly the car you booked, rather than relying on the &quot;or similar&quot; 
              fine print typical of major international rental chains.
            </p>
          </div>
        </section>

        <SeoCrossLinkingMatrix currentCity={displayCity} />
      </main>
      <SiteFooter />
    </div>
  );
}
