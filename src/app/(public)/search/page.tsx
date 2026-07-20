import { SearchClient } from "./search-client";
import { searchVehicles } from "@/lib/search/typesense";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse params
  const q = typeof params.q === "string" ? params.q : "";
  const city = typeof params.city === "string" ? params.city : undefined;
  const state = typeof params.state === "string" ? params.state : undefined;
  const category = typeof params.category === "string" ? params.category as any : undefined;
  const make = typeof params.make === "string" ? params.make : undefined;
  const minPrice = typeof params.minPrice === "string" ? parseInt(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? parseInt(params.maxPrice) : undefined;
  const seats = typeof params.seats === "string" ? parseInt(params.seats) : undefined;
  const transmission = typeof params.transmission === "string" ? params.transmission as any : undefined;
  const fuel = typeof params.fuel === "string" ? params.fuel as any : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const perPage = typeof params.perPage === "string" ? parseInt(params.perPage) : 20;
  
  const rawSortBy = typeof params.sortBy === "string" ? params.sortBy : "price_per_day_aud:asc";
  // We need to support the client-side sort values too ("price-asc", "price-desc", "newest", "rating") 
  // since the client passes them to /api/search in a mapped way, but wait...
  // The search page client component updates URL using `router.push("...?sortBy=xxx")`
  // Ah! wait, `SearchContent` in `page.tsx` doesn't put `sortBy` in the URL!
  // It only puts `city`, `category`, `make`, `minPrice`, `maxPrice`, `seats`, `pickup`, `returnDate`, `page`.
  // Wait, let's check `search-client.tsx` to see if `sortBy` is in the URL.
  // In `handleFilterChange`: it only pushes filters. `handlePageChange` pushes page.
  // Sort state is local! `const [sortBy, setSortBy] = useState<SortOption>("price-asc");`
  // So initial server-side load ALWAYS defaults to "price_per_day_aud:asc".
  
  try {
    const results = await searchVehicles(
      q,
      { city, state, category, make, minPrice, maxPrice, seats, transmission, fuel },
      { page: isNaN(page) ? 1 : page, perPage: isNaN(perPage) ? 20 : perPage, sortBy: "price_per_day_aud:asc" }
    );

    return (
      <SearchClient
        initialVehicles={results.vehicles}
        initialTotal={results.total}
        initialFacetCounts={results.facetCounts || {}}
      />
    );
  } catch (err) {
    console.error("Search Server Component Error:", err);
    return <SearchClient initialVehicles={[]} initialTotal={0} initialFacetCounts={{}} />;
  }
}
