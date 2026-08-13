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
  serializeSchemas,
} from "@/lib/seo";
import { MapPin } from "lucide-react";

function formatSuburbName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; suburb: string }>;
}): Promise<Metadata> {
  const { city, suburb } = await params;
  const meta = getCityMeta(city);
  const displaySuburb = formatSuburbName(suburb);
  
  return {
    title: `Car Hire ${displaySuburb} (${meta.title}) | Australian Rentals`,
    description: `Looking for car hire in ${displaySuburb}, ${meta.title}? Compare local Australian rental operators and book direct with zero marketplace fees.`,
    alternates: { canonical: `/locations/${city}/suburbs/${suburb}` },
  };
}

export default async function SuburbCarHirePage({
  params,
}: {
  params: Promise<{ city: string; suburb: string }>;
}) {
  const { city, suburb } = await params;
  const meta = getCityMeta(city);
  const displayCity = meta.title;
  const displaySuburb = formatSuburbName(suburb);

  // We search the broader city but we could filter by suburb if we had geo-data
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
      { name: displaySuburb, path: `/locations/${city}/suburbs/${suburb}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
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
              <span className="text-white font-medium">{displaySuburb}</span>
            </nav>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">Local Australian Operators</span>
              </div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                Car hire in {displaySuburb}, Australia
              </h1>
              <p className="mt-3 text-slate-300 max-w-lg">
                Find the perfect rental vehicle near {displaySuburb} in {displayCity}. Book directly with local Australian operators and avoid hidden marketplace fees.
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
              title={`No vehicles found near ${displaySuburb}`}
              description={`We couldn't find any rental cars available right now.`}
              actionLabel={`View all cars in ${displayCity}`}
              actionHref={`/locations/${city}`}
            />
          )}
        </section>

        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Local Car Rental in {displaySuburb}</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Why travel across {displayCity} when you can pick up your rental car right near {displaySuburb}? 
              We connect you directly with Australian fleet operators servicing the {displaySuburb} area. 
              Whether you need a compact car for running errands or an SUV for a weekend getaway, you&apos;ll find competitive local rates here.
            </p>
          </div>
        </section>

        <SeoCrossLinkingMatrix currentCity={displayCity} />
      </main>
      <SiteFooter />
    </div>
  );
}
