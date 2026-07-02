import type { MetadataRoute } from "next";

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
    sitemap: "https://www.hirecarmarketplace.com.au/sitemap.xml",
  };
}
