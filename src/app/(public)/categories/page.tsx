import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCategoryCounts } from "@/lib/seo/discovery";
import { Car, Search, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Vehicle Categories | Hire Car",
  description:
    "Browse our extensive range of rental vehicles by category. From compact cars to luxury SUVs and commercial vans.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategoryCounts();
  const totalVehicles = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-5">
              <Car className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">All vehicle types</span>
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Browse by Vehicle Category
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              Find the perfect vehicle for your journey, from economical compacts to spacious SUVs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{totalVehicles}</p>
                <p className="text-sm text-slate-400 mt-0.5">Vehicles available</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">{categories.length}</p>
                <p className="text-sm text-slate-400 mt-0.5">Categories</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">All Categories</h2>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Search className="h-4 w-4" />
              Advanced search
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="text-slate-500 text-center py-12">
              Categories will appear here as vehicles are listed.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map(({ category, slug, count }) => {
                const hasVehicles = count > 0;
                return (
                  <Link
                    key={slug}
                    href={`/car-hire/${slug}`}
                    className={`group relative rounded-3xl border p-6 transition-all duration-200 hover:shadow-lg ${
                      hasVehicles
                        ? "border-slate-200 bg-white hover:border-amber-300 hover:-translate-y-0.5"
                        : "border-slate-100 bg-slate-50 opacity-70"
                    }`}
                  >
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors capitalize">
                      {category}
                    </h3>

                    <div className="flex items-center gap-4 text-sm mt-4">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Car className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900">{count}</span> vehicles
                      </span>
                    </div>

                    <div
                      className={`mt-4 flex items-center gap-1 text-xs font-semibold transition-colors ${
                        hasVehicles ? "text-amber-600 group-hover:text-amber-700" : "text-slate-400"
                      }`}
                    >
                      {hasVehicles ? "Browse vehicles" : "Coming soon"}
                      {hasVehicles && <ArrowRight className="h-3.5 w-3.5" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
