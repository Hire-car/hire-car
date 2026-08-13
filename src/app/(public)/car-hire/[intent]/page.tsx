import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VehicleCard } from "@/components/vehicle-card";
import { EmptyState } from "@/components/empty-state";
import { SeoCrossLinkingMatrix } from "@/components/pseo/seo-cross-linking-matrix";
import { searchVehicles } from "@/lib/search/typesense";
import {
  buildBreadcrumbSchema,
  buildItemListSchema,
  buildFaqSchema,
  serializeSchemas,
} from "@/lib/seo";
import { Heart, Calendar, Key, Wallet, Car } from "lucide-react";

const INTENTS: Record<string, { title: string, desc: string, icon: React.ElementType }> = {
  "wedding": {
    title: "Wedding Car Hire",
    desc: "Make your special day perfect with premium and luxury wedding car hire from Australian operators.",
    icon: Heart
  },
  "long-term": {
    title: "Long Term Car Hire",
    desc: "Need a vehicle for a month or more? Explore affordable long-term car hire options directly from local fleet owners.",
    icon: Calendar
  },
  "under-25": {
    title: "Under 25 Car Hire",
    desc: "Finding rental cars when you're under 25 in Australia can be hard. Browse operators that welcome younger drivers.",
    icon: Key
  },
  "cheap": {
    title: "Cheap Car Hire",
    desc: "Compare budget-friendly and cheap car hire options in Australia with zero marketplace booking fees.",
    icon: Wallet
  }
};

export async function generateStaticParams() {
  return Object.keys(INTENTS).map((intent) => ({
    intent,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ intent: string }>;
}): Promise<Metadata> {
  const { intent } = await params;
  const config = INTENTS[intent] || { title: `${intent} Car Hire`, desc: `Find ${intent} car hire in Australia.` };
  
  return {
    title: `${config.title} Australia | HireCar Marketplace`,
    description: config.desc,
    alternates: { canonical: `/car-hire/${intent}` },
    // Intent pages currently serve unfiltered results (all intents show the
    // same vehicles). Noindex until real intent-based filtering is implemented.
    robots: { index: false, follow: true },
  };
}

export default async function IntentCarHirePage({
  params,
}: {
  params: Promise<{ intent: string }>;
}) {
  const { intent } = await params;
  const config = INTENTS[intent] || { title: `${intent} Car Hire`, desc: `Find ${intent} car hire in Australia.`, icon: Car };
  const Icon = config.icon;

  // We fetch a generic list of vehicles since we can't filter by intent easily yet.
  // In a real SEO farming setup, you'd filter by category or tags.
  const { vehicles, total } = await searchVehicles(
    "",
    {},
    { page: 1, perPage: 24 },
  );

  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", path: "/" },
      { name: config.title, path: `/car-hire/${intent}` },
    ]),
    buildItemListSchema(vehicles.map((v) => v.slug)),
    buildFaqSchema([
      { question: `What is the best ${config.title.toLowerCase()} option in Australia?`, answer: `The best option depends on your specific needs, but by booking through our marketplace you can find ${config.title.toLowerCase()} directly from verified local Australian operators, ensuring quality and competitive rates.` },
      { question: `Are there additional fees for ${config.title.toLowerCase()}?`, answer: `Our marketplace charges zero booking fees. When arranging ${config.title.toLowerCase()}, you deal directly with the Australian fleet owner to agree on all pricing and terms upfront.` }
    ])
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas(schemas) }}
      />
      <SiteHeader />

      <main>
        <section className="bg-gradient-to-b from-slate-950 to-slate-800 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white font-medium">{config.title}</span>
            </nav>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 font-semibold text-sm">Specialty Hire Australia</span>
              </div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                {config.title} in Australia
              </h1>
              <p className="mt-3 text-slate-300 max-w-lg">
                {config.desc}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No vehicles found for ${config.title}`}
              description={`We couldn't find any rental cars matching this category right now.`}
              actionLabel={`View all cars`}
              actionHref={`/search`}
            />
          )}
        </section>

        <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">The Best {config.title} in Australia</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Booking {config.title.toLowerCase()} doesn&apos;t have to be complicated. Our marketplace connects you directly 
              with verified Australian rental operators who specialize in exactly what you need. By avoiding the big 
              international chains, you can often negotiate better terms, clearer insurance policies, and direct communication 
              with the fleet owner.
            </p>
          </div>
        </section>

        <SeoCrossLinkingMatrix />
      </main>
      <SiteFooter />
    </div>
  );
}
