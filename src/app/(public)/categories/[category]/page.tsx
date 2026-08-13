import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { searchVehicles } from "@/lib/search/typesense";
import {
  slugToCategory,
  categoryNationalTitle,
  categoryNationalDescription,
  categoryNationalRobots,
  categoryToSlug,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFaqSchema,
  buildItemListSchema,
  serializeSchemas,
  getTopCitiesForCategory,
  VEHICLE_CATEGORIES,
} from "@/lib/seo";
import { getIndexableSitemapUrls } from "@/lib/seo/discovery";
import { getCategoryFaqs } from "@/lib/seo/category-faqs";
import { Car, MapPin, ChevronDown } from "lucide-react";


export const revalidate = 3600;

export async function generateStaticParams() {
  const { categoryUrls } = await getIndexableSitemapUrls();
  return categoryUrls.map((url) => ({
    category: url.replace("/categories/", ""),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = slugToCategory(categorySlug);
  if (!category) return {};

  const { total } = await searchVehicles("", { category }, { page: 1, perPage: 1 });

  return {
    title: categoryNationalTitle(category),
    description: categoryNationalDescription(category, total),
    openGraph: {
      title: categoryNationalTitle(category),
      description: categoryNationalDescription(category, total),
    },
    alternates: { canonical: `/categories/${categorySlug}` },
    robots: categoryNationalRobots(total),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = slugToCategory(categorySlug);
  if (!category) notFound();

  const [{ vehicles, total }, topCities] = await Promise.all([
    searchVehicles("", { category }, { page: 1, perPage: 24 }),
    getTopCitiesForCategory(category),
  ]);

  const avgPrice =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((acc, v) => acc + v.pricePerDayAud, 0) / vehicles.length)
      : null;

  const categoryFaqs = getCategoryFaqs(category, avgPrice);

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: category, path: `/categories/${categorySlug}` },
    ]),
    buildCollectionPageSchema({
      name: `${category} Car Hire Australia`,
      description: categoryNationalDescription(category, total),
      url: `/categories/${categorySlug}`,
    }),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema(categoryFaqs),
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
              <span className="text-white font-medium">{category}</span>
            </nav>
            <h1 className="text-4xl font-black text-white sm:text-5xl">{category} car hire Australia</h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              {categoryNationalDescription(category, total)}
            </p>
          </div>
        </section>

        {topCities.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-500" />
              Popular cities for {category}
            </h2>
            <div className="flex flex-wrap gap-3">
              {topCities.map((c) => (
                <Link
                  key={c.citySlug}
                  href={`/locations/${c.citySlug}/${categorySlug}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-amber-300 hover:text-amber-700"
                >
                  {c.city} ({c.count})
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {vehicles.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle, index) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} priority={index < 3} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No ${category} vehicles listed yet`}
              description="Check back soon or browse all categories."
              actionHref="/search"
              actionLabel="Browse all vehicles"
            />
          )}
        </section>

        {/* FAQ Section */}
        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Frequently asked questions
            </h2>
            <p className="text-sm text-slate-500 mb-8">
              Common questions about {category.toLowerCase()} hire in Australia
            </p>
            <div className="divide-y divide-slate-200">
              {categoryFaqs.map((faq, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <span className="text-base font-semibold text-slate-900 leading-snug">
                      {faq.question}
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 mt-0.5" />
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Browse other categories */}
        <section className="bg-slate-50 border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Browse other categories
            </h2>
            <div className="flex flex-wrap gap-3">
              {VEHICLE_CATEGORIES.filter((c) => c !== category).map((c) => (
                <Link
                  key={c}
                  href={`/categories/${categoryToSlug(c)}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
