import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllPublishedArticleSlugs } from "@/lib/blog/queries";
import { getIndexableSitemapUrls } from "@/lib/seo/discovery";

const PAGE_SIZE = 5000;
const base = "https://www.hirecar.com.au";

export async function generateSitemaps() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    const totalVehicles = count || 0;
    const vehicleChunks = Math.ceil(totalVehicles / PAGE_SIZE) || 1;

    // 0: static + PSEO
    // 1: vendors
    // 2+: vehicles
    const chunks = [{ id: 0 }, { id: 1 }];
    for (let i = 0; i < vehicleChunks; i++) {
      chunks.push({ id: 2 + i });
    }
    return chunks;
  } catch {
    return [{ id: 0 }, { id: 1 }, { id: 2 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const chunkId = typeof id === "number" ? id : 0;

  if (chunkId === 0) {
    const staticRoutes: MetadataRoute.Sitemap = [
      { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${base}/locations`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
      { url: `${base}/search`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.5 },
      { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}/faq`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${base}/for-vendors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${base}/for-vendors/api`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
      { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${base}/vendors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
      { url: `${base}/legal/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/legal/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
      { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.75 },
    ];

    let blogRoutes: MetadataRoute.Sitemap = [];
    try {
      const articles = await getAllPublishedArticleSlugs();
      blogRoutes = articles.map((a) => ({
        url: `${base}/blog/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch {
      // graceful fallback
    }

    let pseoRoutes: MetadataRoute.Sitemap = [];
    try {
      const { cityUrls, categoryUrls, cityCategoryUrls } = await getIndexableSitemapUrls();
      const now = new Date();
      
      const cityMapped = cityUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
      const categoryMapped = categoryUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));
      const cityCategoryMapped = cityCategoryUrls.map((path) => ({
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));

      // Limit PSEO to 45,000 URLs to stay safely under Google's 50k limit
      pseoRoutes = [...cityMapped, ...categoryMapped, ...cityCategoryMapped].slice(0, 45000);
    } catch {
      // graceful fallback
    }

    return [...staticRoutes, ...blogRoutes, ...pseoRoutes];
  }

  if (chunkId === 1) {
    try {
      const supabase = createAdminClient();
      const { data: vendors } = await supabase
        .from("organizations")
        .select("slug, updated_at")
        .eq("status", "approved")
        .limit(45000); // Increased limit but protected by dedicated chunk

      if (vendors) {
        return vendors.map((v) => ({
          url: `${base}/vendors/${v.slug}`,
          lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
      }
    } catch {
      // graceful fallback
    }
    return [];
  }

  // chunkId >= 2 are Vehicles
  try {
    const supabase = createAdminClient();
    const vehicleChunkIndex = chunkId - 2;
    const start = vehicleChunkIndex * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("slug, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .range(start, end);

    if (vehicles) {
      return vehicles.map((v) => ({
        url: `${base}/cars/${v.slug}`,
        lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // graceful fallback
  }

  return [];
}
