export default function customImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Handle Supabase storage URLs (without forcing /render/image/public/ to avoid 400 errors if Image Transformation is disabled)
  if (src.includes("/storage/v1/object/public/")) {
    try {
      const url = new URL(src);
      url.searchParams.set("width", width.toString());
      if (quality) url.searchParams.set("quality", quality.toString());
      return url.href;
    } catch {
      return src;
    }
  }

  // Optimize Unsplash images natively via Imgix
  if (src.includes("images.unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", width.toString());
      if (quality) url.searchParams.set("q", quality.toString());
      url.searchParams.set("auto", "format,compress");
      return url.href;
    } catch {
      return src;
    }
  }

  // Fallback for everything else
  try {
    // If the src is a valid URL, append a dummy width parameter to satisfy Next.js loader validation
    const url = new URL(src);
    url.searchParams.set("w", width.toString());
    return url.href;
  } catch {
    // If it's a relative path (e.g. /LOGO.png), we can't parse it as a full URL easily in the loader
    // Next.js will complain if we don't append a width, so we append it as a query param
    return src.includes("?") ? `${src}&w=${width}` : `${src}?w=${width}`;
  }
}
