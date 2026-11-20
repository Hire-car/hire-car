import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/server-site-header";
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
  CITY_META_OVERRIDES,
} from "@/lib/seo";
import {
  getSuburbMeta,
  getSuburbsForCity,
  evaluateSuburbIndexing,
  checkVerifiedVendorCoverage,
  getSuburbInventoryDescription,
  getSuburbLocalContext,
  getSuburbFaqs,
} from "@/lib/seo/suburbs";
import { MapPin, ShieldCheck, Compass, CheckCircle2, ChevronRight, Car } from "lucide-react";

function formatFallbackSuburbName(slug: string) {
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
  const isCityValid = Boolean(CITY_META_OVERRIDES[city.toLowerCase()]);
  if (!isCityValid) {
    return {};
  }
  const cityMeta = getCityMeta(city);
  const curated = getSuburbMeta(city, suburb);

  const displaySuburb = curated?.name || formatFallbackSuburbName(suburb);
  const displayCity = cityMeta.title;
  const state = curated?.state || cityMeta.state || "Australia";

  // Evaluate local inventory and verified service coverage separately from metropolitan inventory
  const coverage = await checkVerifiedVendorCoverage({
    city,
    suburbName: displaySuburb,
    postcode: curated?.postcode,
  });

  if (!curated && !coverage.hasVerifiedCoverage) {
    return {};
  }

  const title = curated?.title || `Car Hire ${displaySuburb} (${displayCity}, ${state}) | Hire Car Marketplace`;
  const description =
    curated?.metaDescription ||
    `Looking for car hire in ${displaySuburb}, ${displayCity}? Compare verified local Australian rental operators and book direct with zero marketplace fees.`;

  const localSearch = await searchVehicles(
    displaySuburb,
    { city: displayCity },
    { page: 1, perPage: 1 },
  );

  const metroSearch = await searchVehicles(
    "",
    { city: displayCity },
    { page: 1, perPage: 1 },
  );

  // Do not index an empty suburb page merely because other vehicles exist elsewhere in the city
  const robots = evaluateSuburbIndexing({
    localInventoryCount: localSearch.total,
    hasVerifiedCoverage: coverage.hasVerifiedCoverage,
    metroInventoryCount: metroSearch.total,
  });

  return {
    title,
    description,
    robots,
    alternates: { canonical: `/locations/${city}/suburbs/${suburb}` },
    openGraph: {
      title,
      description,
      url: `/locations/${city}/suburbs/${suburb}`,
      type: "website",
    },
  };
}

export default async function SuburbCarHirePage({
  params,
}: {
  params: Promise<{ city: string; suburb: string }>;
}) {
  const { city, suburb } = await params;
  const isCityValid = Boolean(CITY_META_OVERRIDES[city.toLowerCase()]);
  const curated = getSuburbMeta(city, suburb);
  const displaySuburb = curated?.name || formatFallbackSuburbName(suburb);

  // Verify branch coverage and prioritize local inventory
  const coverage = await checkVerifiedVendorCoverage({
    city,
    suburbName: displaySuburb,
    postcode: curated?.postcode,
  });

  if (!isCityValid || (!curated && !coverage.hasVerifiedCoverage)) {
    notFound();
  }

  const cityMeta = getCityMeta(city);
  const displayCity = cityMeta.title;
  const state = curated?.state || cityMeta.state || "Australia";

  // Prioritize inventory matching this specific suburb; fall back to metropolitan fleet
  const localSearch = await searchVehicles(
    displaySuburb,
    { city: displayCity },
    { page: 1, perPage: 24 },
  );

  const hasDirectLocalInventory = localSearch.total > 0;
  const { vehicles, total } = hasDirectLocalInventory
    ? localSearch
    : await searchVehicles("", { city: displayCity }, { page: 1, perPage: 24 });

  const inventoryDescription = getSuburbInventoryDescription({
    hasDirectLocalInventory,
    hasVerifiedCoverage: coverage.hasVerifiedCoverage,
    displayCity,
    displaySuburb,
    total,
  });

  const h1 = curated?.h1 || `Car Hire in ${displaySuburb}, ${displayCity} ${state}`;
  const introCopy =
    curated?.introCopy ||
    (coverage.hasVerifiedCoverage
      ? `Find the perfect rental vehicle near ${displaySuburb} in Greater ${displayCity}. Book directly with verified local Australian operators and avoid hidden broker markups.`
      : `Browse rental vehicles available across Greater ${displayCity} near ${displaySuburb}. Book directly with verified Australian operators with zero marketplace fees.`);

  const localContext = getSuburbLocalContext({
    curatedContext: curated?.localContext,
    displayCity,
    displaySuburb,
    state,
    hasVerifiedCoverage: coverage.hasVerifiedCoverage,
  });

  const faqs = getSuburbFaqs({
    displaySuburb,
    displayCity,
    state,
    hasVerifiedCoverage: coverage.hasVerifiedCoverage,
  });

  const nearbySuburbs = getSuburbsForCity(city).filter((s) => s.slug !== suburb);

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
      { name: displayCity, path: `/locations/${city}` },
      { name: displaySuburb, path: `/locations/${city}/suburbs/${suburb}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema(faqs),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(schemas) }}
      />
      <SiteHeader />

      <main>
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/locations" className="hover:text-white transition-colors">
                Locations
              </Link>
              <span>/</span>
              <Link href={`/locations/${city}`} className="hover:text-white transition-colors">
                {displayCity}
              </Link>
              <span>/</span>
              <span className="text-white font-medium">{displaySuburb}</span>
            </nav>

            <div className="flex flex-col gap-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 text-xs font-semibold text-orange-400 w-fit">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {coverage.hasVerifiedCoverage
                    ? `Verified Local Operators · ${displaySuburb}, ${state}`
                    : `Greater ${displayCity} Fleet · ${state}`}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white sm:text-5xl tracking-tight leading-tight">
                {h1}
              </h1>
              <p className="mt-2 text-base text-slate-300 leading-relaxed">
                {introCopy}
              </p>

              {curated?.landmarks && curated.landmarks.length > 0 && (
                <div className="flex items-center gap-2 pt-2 flex-wrap text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Key Areas:</span>
                  {curated.landmarks.map((landmark) => (
                    <span
                      key={landmark}
                      className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5"
                    >
                      <Compass className="h-3 w-3 text-orange-400" />
                      {landmark}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* VEHICLE LISTINGS SECTION */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Available Vehicles near {displaySuburb}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {inventoryDescription}
              </p>
            </div>
            {total > 0 && (
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                {total} {total === 1 ? "vehicle" : "vehicles"}
              </span>
            )}
          </div>

          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No vehicles currently found near ${displaySuburb}`}
              description={`We couldn't find vehicles available in ${displaySuburb} right now. Browse our wider fleet across ${displayCity}.`}
              actionLabel={`View all cars in ${displayCity}`}
              actionHref={`/locations/${city}`}
            />
          )}
        </section>

        {/* LOCAL DRIVING CONTEXT & TRUST SECTION */}
        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-3">
                Local Car Hire in {displaySuburb}, {state}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {localContext}
              </p>
            </div>

            {/* Why choose local operators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Verified Australian ABNs</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Every fleet provider is verified with a registered Australian Business Number.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <Car className="h-5 w-5 text-[#ea580c] mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">Zero Booking Fees</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Connect and transact directly with the vehicle owners with no hidden broker markups.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mb-2" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {coverage.hasVerifiedCoverage ? "Flexible Suburb Pickup" : "Metropolitan Fleet Range"}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {coverage.hasVerifiedCoverage
                    ? `Save travel time across ${displayCity} with verified local pickup in ${displaySuburb}.`
                    : `Wide selection of verified fleet vehicles across Greater ${displayCity} with direct owner handover.`}
                </p>
              </div>
            </div>

            {/* NEARBY SUBURBS NAVIGATION */}
            {nearbySuburbs.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Other Popular Locations in {displayCity}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nearbySuburbs.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/locations/${city}/suburbs/${sub.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-orange-300 hover:text-[#ea580c] transition-colors"
                    >
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {sub.name}
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </Link>
                  ))}
                  <Link
                    href={`/locations/${city}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#ea580c] hover:bg-orange-100 transition-colors"
                  >
                    View All {displayCity} Cars
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <SeoCrossLinkingMatrix currentCity={displayCity} />
      </main>
      <SiteFooter />
    </div>
  );
}
