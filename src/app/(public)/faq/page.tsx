import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MessageCircleQuestion } from "lucide-react";
import { getFaqs } from "@/lib/data/faqs";
import { FaqAccordion } from "./faq-accordion";
import { buildFaqSchema, serializeSchemas } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Hire Car",
  description:
    "Answers to common questions about renting from and listing on Hire Car — how the marketplace works, payments, vendor verification, insurance, leads and pricing.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions | Hire Car",
    description:
      "How renting and listing on Hire Car works — payments, verification, insurance, leads and pricing.",
    url: "/faq",
  },
};

export default async function FAQPage() {
  const faqs = await getFaqs();
  
  // Flatten the grouped FAQs into FAQPage entries for the rich result.
  const faqSchema = buildFaqSchema(
    faqs.flatMap((section) => section.questions.map((item) => ({ question: item.q, answer: item.a }))),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeSchemas([faqSchema]) }}
      />
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />

        <main>
          {/* Hero */}
          <section className="bg-slate-950 py-20 px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-6">
                <MessageCircleQuestion className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">Help Center</span>
              </div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-4 text-lg text-slate-300">
                Everything you need to know about renting or listing on Hire Car.
              </p>
            </div>
          </section>

          {/* FAQ Sections */}
          <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <FaqAccordion faqs={faqs} />

            {/* Still need help? */}
            <div className="mt-16 rounded-3xl bg-amber-50 border border-amber-200 p-8 text-center sm:p-12">
              <h2 className="text-2xl font-black text-slate-900">Still have questions?</h2>
              <p className="mt-2 text-slate-600 max-w-lg mx-auto">
                If you can&apos;t find what you&apos;re looking for, our support team is ready to help you with any marketplace inquiries.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
