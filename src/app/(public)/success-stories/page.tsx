import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Success Stories | Hire Car" };

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Success Stories</h1>
        <p className="text-lg text-slate-600">
          Discover how independent car rental businesses have grown and thrived using the Hire Car marketplace.
          Check out our featured operators and their inspiring journeys!
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
