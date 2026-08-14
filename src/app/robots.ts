import type { MetadataRoute } from "next";

const BASE = "https://www.hirecarmarketplace.com.au";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/vendor/dashboard",
          "/vendor/leads",
          "/vendor/onboarding",
          "/vendor/upgrade",
          "/auth/",
          "/api/",
          "/messages/",
          "/customer/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
