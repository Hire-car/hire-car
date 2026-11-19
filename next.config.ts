import type { NextConfig } from "next";

const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;"
    : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;";

const connectSrc =
  process.env.NODE_ENV === "development"
    ? "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https://images.unsplash.com https://upload.wikimedia.org https://*.supabase.co https://api.stripe.com https://api.resend.com https://*.typesense.net;"
    : "connect-src 'self' https://images.unsplash.com https://upload.wikimedia.org https://*.supabase.co https://api.stripe.com https://api.resend.com https://*.typesense.net;";

const imgSrc =
  process.env.NODE_ENV === "development"
    ? "img-src 'self' data: blob: http://127.0.0.1:* http://localhost:* https://images.unsplash.com https://*.supabase.co https://upload.wikimedia.org;"
    : "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://upload.wikimedia.org;";

const nextConfig: NextConfig = {
  reactStrictMode: false,
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
              `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ${imgSrc} font-src 'self' data: https://fonts.gstatic.com; ${connectSrc} frame-src https://checkout.stripe.com https://billing.stripe.com https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
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
    ];
  },
};

export default nextConfig;
