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
  // Route local assets through Next.js built-in optimizer
  try {
    if (src.startsWith("/") && !src.startsWith("//")) {
      return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
    }
    
    // For absolute URLs not caught above, just append width
    const url = new URL(src);
    url.searchParams.set("w", width.toString());
    if (quality) url.searchParams.set("q", quality.toString());
    return url.href;
  } catch {
    return src;
  }
}
