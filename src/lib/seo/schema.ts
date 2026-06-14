import { SEO_BASE_URL } from "./constants";

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
      name: "Hire Car",
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    image: input.imageUrl ?? "",
    description: input.description,
    sku: input.slug,
    offers: {
      "@type": "Offer",
      url: `${SEO_BASE_URL}/cars/${input.slug}`,
      priceCurrency: "AUD",
      price: input.pricePerDayAud,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: input.vendorName,
      },
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hire Car",
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
      name: input.authorName ?? "Hire Car Marketplace",
    },
    publisher: {
      "@type": "Organization",
      name: "Hire Car Marketplace",
      logo: {
        "@type": "ImageObject",
        url: `${base}/logo.png`,
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
  return JSON.stringify(schemas);
}
