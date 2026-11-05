import { revalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";
import { categoryToSlug } from "./categories";
import { cityToSlug } from "./slugs";

const revalidateTag = (tag: string) => {
  try {
    (nextRevalidateTag as any)(tag);
  } catch {
    // revalidateTag only functions within a Next.js request context; catch safely in standalone scripts
  }
};

export type PseoInvalidationInput = {
  city?: string | null;
  category?: string | null;
  vehicleSlug?: string | null;
  make?: string | null;
};

export async function invalidatePseo(input: PseoInvalidationInput = {}) {
  // Purge path caches
  revalidatePath("/locations");
  revalidatePath("/");

  if (input.city) {
    const citySlug = cityToSlug(input.city);
    revalidatePath(`/locations/${citySlug}`);
    if (input.category) {
      revalidatePath(`/locations/${citySlug}/${categoryToSlug(input.category)}`);
    }
    if (input.make) {
      revalidatePath(`/locations/${citySlug}/${input.make.toLowerCase().replace(/\s+/g, "-")}`);
    }
  }

  if (input.category) {
    revalidatePath(`/categories/${categoryToSlug(input.category)}`);
  }

  if (input.vehicleSlug) {
    revalidatePath(`/cars/${input.vehicleSlug}`);
  }

  revalidatePath("/sitemap.xml");

  // Purge data cache tags (unstable_cache)
  revalidateTag("vehicles");
  revalidateTag("featured");
  revalidateTag("stats");
}

export async function invalidateBlog(slug?: string) {
  revalidatePath("/blog");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
  revalidatePath("/sitemap.xml");

  // Purge data cache tag for blog
  revalidateTag("blog");
}

/** Resolve branch city from branch id for invalidation hooks. */
export async function getBranchCityForInvalidation(
  supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  branchId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("branches")
    .select("city")
    .eq("id", branchId)
    .maybeSingle();
  return data?.city ?? null;
}