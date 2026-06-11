import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Press | Hire Car" };

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Press & Media</h1>
        <p className="text-lg text-slate-600">
          Get the latest news, press releases, and media resources for Hire Car.
          For press inquiries, please visit our contact page.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
