import { SEO_BASE_URL } from "./constants";
import { resolveSocialUrl, SOCIAL_URLS } from "@/lib/social-links";

type BreadcrumbItem = { name: string; path: string };

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SEO_BASE_URL}${item.path}`,
    })),
  };
}

export function buildItemListSchema(vehicleSlugs: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: vehicleSlugs.map((slug, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SEO_BASE_URL}/cars/${slug}`,
    })),
  };
}

export function buildFaqSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export function buildCollectionPageSchema(input: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: `${SEO_BASE_URL}${input.url}`,
    isPartOf: {
      "@type": "WebSite",
      name: "HireCar Marketplace",
      url: SEO_BASE_URL,
    },
  };
}

export function buildProductSchema(input: {
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
  pricePerDayAud: number;
  vendorName: string;
  city?: string;
  state?: string;
  /** Optional review aggregate for star rich snippets. */
  rating?: { value: number; count: number };
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    sku: input.slug,
    offers: {
      "@type": "Offer",
      url: `${SEO_BASE_URL}/cars/${input.slug}`,
      priceCurrency: "AUD",
      price: input.pricePerDayAud,
      priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: input.vendorName,
      },
    },
  };

  // Only emit `image` when we actually have one (an empty string is invalid).
  if (input.imageUrl) {
    schema.image = [input.imageUrl];
  }

  // Only emit `aggregateRating` when at least one review exists — Google flags
  // rating markup with a zero count as invalid.
  if (input.rating && input.rating.count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.rating.value,
      reviewCount: input.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HireCar Marketplace",
    url: SEO_BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SEO_BASE_URL}/search?city={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Site-wide brand Organization entity for the homepage — powers the Google
 * knowledge panel and links verified social profiles via `sameAs`.
 */
export function buildBrandOrganizationSchema() {
  // resolveSocialUrl treats empty/whitespace/"#" env values as unset so a
  // placeholder can't shadow (or drop) the real brand profile URL.
  const sameAs = [
    resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL, SOCIAL_URLS.facebook),
    resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL, SOCIAL_URLS.linkedin),
    resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL, SOCIAL_URLS.instagram),
    resolveSocialUrl(process.env.NEXT_PUBLIC_SOCIAL_X_URL),
  ].filter((url): url is string => typeof url === "string" && url.length > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HireCar Marketplace",
    alternateName: "HireCar",
    url: SEO_BASE_URL,
    logo: `${SEO_BASE_URL}/icons/icon-512.png`,
    image: `${SEO_BASE_URL}/og-image.jpg`,
    description:
      "Australia's marketplace for verified car rental operators — compare cars, vans, utes and luxury vehicles from independent local fleets.",
    areaServed: { "@type": "Country", name: "Australia" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+61434930437",
      contactType: "customer support",
      areaServed: "AU",
      availableLanguage: ["en"],
    },
    sameAs,
  };
}

export function buildOrganizationSchema(input: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: `${SEO_BASE_URL}${input.url}`,
    logo: input.logo,
    description: input.description,
  };
}

export function buildAutoRentalSchema(input: {
  name: string;
  url: string;
  city?: string;
  state?: string;
  phone?: string | null;
  email?: string | null;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    name: input.name,
    url: `${SEO_BASE_URL}${input.url}`,
  };
  
  if (input.phone) schema.telephone = input.phone;
  if (input.email) schema.email = input.email;
  
  if (input.city) {
    schema.address = {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressRegion: input.state,
      addressCountry: "AU",
    };
  }

  return schema;
}

export function buildArticleSchema(input: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string | null;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  baseUrl?: string;
}) {
  const base = input.baseUrl ?? SEO_BASE_URL;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image: input.imageUrl ? [input.imageUrl] : [],
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      "@type": "Organization",
      name: input.authorName ?? "HireCar Marketplace",
    },
    publisher: {
      "@type": "Organization",
      name: "HireCar Marketplace",
      logo: {
        "@type": "ImageObject",
        url: `${base}/icons/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${base}/blog/${input.slug}`,
    },
  };
}

export function buildBlogBreadcrumbSchema(input: {
  slug: string;
  title: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  baseUrl?: string;
}) {
  const base = input.baseUrl ?? SEO_BASE_URL;
  const items: BreadcrumbItem[] = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ];

  if (input.categoryName && input.categorySlug) {
    items.push({ name: input.categoryName, path: `/blog?category=${input.categorySlug}` });
  }

  items.push({ name: input.title, path: `/blog/${input.slug}` });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

export function serializeSchemas(schemas: object[]) {
  // Wrap in @graph per Google's best practice — avoids bare JSON arrays
  // which some rich result testing tools reject. Strip duplicate @context.
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": schemas.map((s) => {
      const { "@context": _, ...rest } = s as Record<string, unknown>;
      return rest;
    }),
  });
}
