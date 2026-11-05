import type { NextConfig } from "next";

const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com;"
    : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com;";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/login",
        destination: "/auth/sign-in",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://upload.wikimedia.org; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://images.unsplash.com https://upload.wikimedia.org https://*.supabase.co https://api.stripe.com https://api.resend.com https://*.typesense.net https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://checkout.stripe.com https://billing.stripe.com https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/(hero.jpg|perth.png|og-image.jpg|icons/.*|manifest.json)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;