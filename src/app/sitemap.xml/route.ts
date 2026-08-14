import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE = "https://www.hirecarmarketplace.com.au";
const PAGE_SIZE = 5000;

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  let vehicleChunks = 1;
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");
    
    vehicleChunks = Math.ceil((count || 0) / PAGE_SIZE) || 1;
  } catch (err) {
    console.error("Failed to fetch vehicle count for sitemap index", err);
  }

  const totalChunks = 2 + vehicleChunks; // 0 for static/blog/pseo, 1 for vendors, 2+ for vehicles
  const lastMod = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  for (let i = 0; i < totalChunks; i++) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${BASE}/sitemap/${i}.xml</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }
  
  xml += `</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
