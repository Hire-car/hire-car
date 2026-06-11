import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Careers | Hire Car" };

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="py-24 sm:py-32 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-6">Careers at Hire Car</h1>
        <p className="text-lg text-slate-600">
          We are always looking for passionate individuals to join our mission of empowering local rental operators.
          Check back later for open positions, or send us an email to express your interest!
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
