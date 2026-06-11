import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Blog | Hire Car" };

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Our Blog</h1>
        <p className="text-lg text-slate-600">
          Read our latest insights, travel tips, and stories from our community of independent operators.
          Coming soon!
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
