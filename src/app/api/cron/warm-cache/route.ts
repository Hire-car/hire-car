import { NextResponse } from "next/server";
import { getIndexableSitemapUrls } from "@/lib/seo/discovery";
import { SEO_BASE_URL } from "@/lib/seo/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { cityUrls, categoryUrls, cityCategoryUrls } = await getIndexableSitemapUrls();
    
    // Select a subset to warm up so we don't blow through serverless execution time
    const urlsToWarm = [
      ...cityUrls.slice(0, 10),
      ...categoryUrls.slice(0, 5),
      ...cityCategoryUrls.slice(0, 20),
    ];

    // Fetch them all in parallel to warm the ISR cache
    const results = await Promise.allSettled(
      urlsToWarm.map((path) => fetch(`${SEO_BASE_URL}${path}`, { method: "HEAD" }))
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({
      success: true,
      message: `Successfully warmed ${successCount} out of ${urlsToWarm.length} top priority pages.`,
    });
  } catch (error) {
    console.error("Cache warming failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
