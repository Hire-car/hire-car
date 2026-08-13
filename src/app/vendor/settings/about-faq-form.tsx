"use client";

import { useActionState, useState } from "react";
import { updateVendorAboutAndFaqs } from "./actions";
import { Plus, Trash2, HelpCircle, BookOpen } from "lucide-react";

type Faq = { question: string; answer: string };

interface AboutFaqFormProps {
  organizationId: string;
  defaultAbout?: string | null;
  defaultFaqs?: Faq[] | null;
}

const MAX_FAQS = 5;

const FAQ_PLACEHOLDERS: Faq[] = [
  { question: "How does pick-up and drop-off work?", answer: "" },
  { question: "What is required to rent a vehicle?", answer: "" },
  { question: "Do you require a deposit?", answer: "" },
  { question: "What is your cancellation policy?", answer: "" },
  { question: "Are vehicles available for long-term hire?", answer: "" },
];

export function AboutFaqForm({ organizationId, defaultAbout, defaultFaqs }: AboutFaqFormProps) {
  const [state, formAction, isPending] = useActionState(updateVendorAboutAndFaqs, {
    error: null,
    success: false,
  });

  const [faqs, setFaqs] = useState<Faq[]>(
    defaultFaqs && defaultFaqs.length > 0 ? defaultFaqs : []
  );

  function addFaq() {
    if (faqs.length >= MAX_FAQS) return;
    const placeholder = FAQ_PLACEHOLDERS[faqs.length] ?? { question: "", answer: "" };
    setFaqs([...faqs, { question: placeholder.question, answer: "" }]);
  }

  function removeFaq(i: number) {
    setFaqs(faqs.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, field: "question" | "answer", val: string) {
    setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, [field]: val } : f)));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      {/* Serialize current FAQ state as JSON for the server action */}
      <input type="hidden" name="vendor_faqs" value={JSON.stringify(faqs)} />

      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
          About &amp; FAQs saved successfully.
        </div>
      )}

      {/* ── About the Business ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="about_business" className="text-sm font-semibold text-foreground">
            About the Business
          </label>
        </div>
        <textarea
          id="about_business"
          name="about_business"
          defaultValue={defaultAbout ?? ""}
          rows={6}
          maxLength={2000}
          className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
          placeholder={
            "Tell customers about your rental business — your history, fleet, service areas, " +
            "what makes you different, and why they should choose you."
          }
          aria-describedby="about-helper"
        />
        <p id="about-helper" className="mt-1.5 text-xs text-muted-foreground">
          Displayed prominently on your public vendor profile page. Max 2,000 characters.
        </p>
      </div>

      {/* ── Vendor FAQs ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Frequently Asked Questions
            </span>
            <span className="text-xs text-muted-foreground">
              ({faqs.length}/{MAX_FAQS})
            </span>
          </div>
          {faqs.length < MAX_FAQS && (
            <button
              type="button"
              onClick={addFaq}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </button>
          )}
        </div>

        {faqs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
            <HelpCircle className="mx-auto h-7 w-7 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No FAQs added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add up to {MAX_FAQS} questions customers commonly ask about your business.
            </p>
            <button
              type="button"
              onClick={addFaq}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first question
            </button>
          </div>
        )}

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Question {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  aria-label={`Remove question ${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
              <div>
                <label
                  htmlFor={`faq-q-${i}`}
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Question
                </label>
                <input
                  id={`faq-q-${i}`}
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  maxLength={200}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                  placeholder="e.g., Do you offer free delivery?"
                />
              </div>
              <div>
                <label
                  htmlFor={`faq-a-${i}`}
                  className="block text-xs font-medium text-foreground mb-1"
                >
                  Answer
                </label>
                <textarea
                  id={`faq-a-${i}`}
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  rows={3}
                  maxLength={600}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all resize-none"
                  placeholder="Provide a clear, helpful answer for customers…"
                />
              </div>
            </div>
          ))}
        </div>

        {faqs.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            FAQs appear on your public vendor profile and help customers get answers instantly.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save About & FAQs"}
      </button>
    </form>
  );
}
