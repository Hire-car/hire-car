"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqCategory } from "@/lib/data/faqs";

export function FaqAccordion({ faqs }: { faqs: FaqCategory[] }) {
  const [openIndex, setOpenIndex] = useState<string | null>(
    faqs.length > 0 && faqs[0].questions.length > 0
      ? `${faqs[0].category}-0`
      : null
  );

  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="space-y-12">
      {faqs.map((section) => (
        <div key={section.category}>
          <h2 className="text-2xl font-black text-slate-900 mb-6">{section.category}</h2>
          <div className="space-y-3">
            {section.questions.map((faq, index) => {
              const id = `${section.category}-${index}`;
              const isOpen = openIndex === id;

              return (
                <div 
                  key={faq.id} 
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen ? "border-amber-400 bg-white shadow-md" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none"
                  >
                    <span className="text-base font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown 
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-amber-600" : ""
                      }`} 
                    />
                  </button>
                  <div 
                    className={`px-6 overflow-hidden transition-all duration-200 ease-in-out ${
                      isOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
