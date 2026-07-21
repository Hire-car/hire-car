export default function customImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If it's a Supabase storage URL, rewrite to the render (transformation) endpoint
  if (src.includes("/storage/v1/object/public/")) {
    try {
      const url = new URL(src);
      url.pathname = url.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/"
      );
      url.searchParams.set("width", width.toString());
      url.searchParams.set("resize", "cover");
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

  // Fallback for everything else (e.g. local images)
  // We MUST append width/quality to ensure the URL is unique per size in the srcset.
  // Otherwise, some browsers (like Safari) fail to load images on the first visit
  // because they get confused by identical URLs with different width descriptors.
  try {
    // Check if it's an absolute URL
    if (src.startsWith("http://") || src.startsWith("https://")) {
      const url = new URL(src);
      url.searchParams.set("w", width.toString());
      if (quality) url.searchParams.set("q", quality.toString());
      return url.href;
    }
    
    // For relative URLs (e.g., /LOGO.png), append as query parameters
    const [basePath, search] = src.split("?");
    const params = new URLSearchParams(search || "");
    params.set("w", width.toString());
    if (quality) params.set("q", quality.toString());
    return `${basePath}?${params.toString()}`;
  } catch {
    return src;
  }
}
