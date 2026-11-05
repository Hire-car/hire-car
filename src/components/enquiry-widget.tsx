"use client";

import { useRef, useState, useMemo } from "react";
import { Send, MessageCircle, ArrowRight, Info, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { scrollIntoViewAndFocus } from "@/lib/form-utils";

interface EnquiryWidgetProps {
  vehicleId: string;
  vendorId: string;
  isLoggedIn: boolean;
  userProfile?: {
    name: string;
    email: string;
    phone: string;
  } | null;
  instantBook?: boolean;
  pricePerDay: number;
  defaultCity?: string;
}

export function EnquiryWidget({
  vehicleId,
  vendorId,
  isLoggedIn,
  userProfile,
  instantBook,
  pricePerDay,
  defaultCity,
}: EnquiryWidgetProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [name, setName] = useState(userProfile?.name || "");
  const [email, setEmail] = useState(userProfile?.email || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [pickupCity, setPickupCity] = useState(defaultCity || "");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [formMode, setFormMode] = useState<"book" | "message">("book");

  const endDateRef = useRef<HTMLInputElement>(null);

  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  const totalPrice = daysCount > 1 ? daysCount * pricePerDay : pricePerDay;

  const isFormValid = Boolean(
    startDate &&
    endDate &&
    endDate >= startDate &&
    name.trim().length >= 2 &&
    email.trim().length >= 3 &&
    phone.trim().length >= 8 &&
    pickupCity.trim().length >= 2 &&
    licenseConfirmed &&
    (turnstileToken || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      scrollIntoViewAndFocus(endDateRef.current);
      return;
    }
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!pickupCity.trim()) {
      setError("Please enter your pickup city.");
      return;
    }
    if (!licenseConfirmed) {
      setError("Please confirm you hold a valid driver's license.");
      return;
    }
    if (!turnstileToken && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setError("Please complete the security challenge before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const defaultMsg = formMode === "book"
        ? "I am interested in booking this vehicle."
        : "Hi, I have an enquiry about this vehicle.";

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vendorId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          pickupCity: pickupCity.trim(),
          startDate,
          endDate,
          message: message.trim() || defaultMsg,
          consent: true,
          turnstileToken: turnstileToken || undefined,
          honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          (typeof data.error === "string" ? data.error : null) ||
          data.error?.formErrors?.[0] ||
          data.message ||
          "Failed to submit booking request. Please check your details and try again.";
        throw new Error(errorMsg);
      }

      const id = data.leadId ?? data.id;
      if (id) {
        setLeadId(id);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setTurnstileToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const chatPath = leadId ? `/messages/${leadId}` : "/customer/enquiries";
    const signInHref = `/auth/sign-in?redirectedFrom=${encodeURIComponent(chatPath)}`;
    const isBooking = formMode === "book";

    return (
      <div className="bg-white p-6 pb-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {isBooking ? "Booking Request Submitted!" : "Enquiry Sent!"}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {isBooking ? (
            <>
              Your booking request has been submitted successfully!
              <br className="hidden sm:inline" />{" "}
              The vehicle owner/vendor will review your request and contact you regarding the booking.
            </>
          ) : (
            "The vendor has been notified of your enquiry and will respond shortly."
          )}
        </p>
        {isLoggedIn && leadId ? (
          <button
            onClick={() => router.push(chatPath)}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Open Chat
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3">
              Want to chat directly with the vendor or track updates?
            </p>
            <Link
              href={signInHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Sign in with Google to Chat
              <ArrowRight className="h-4 w-4" />
            </Link>
            {email && (
              <p className="mt-2.5 text-xs text-slate-400">
                Use <span className="font-medium text-slate-600">{email}</span> when signing in to access this conversation.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 pb-7">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900">
          {formMode === "book" ? (instantBook ? "Instant Book" : "Book Vehicle") : "Ask a Question"}
        </h2>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFormMode("book")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              formMode === "book"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Book
          </button>
          <button
            type="button"
            onClick={() => setFormMode("message")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              formMode === "message"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Message
          </button>
        </div>
      </div>
      <p className="text-[13px] text-slate-500 mb-5">
        {formMode === "book"
          ? "Reserve your vehicle with verified local rental operators."
          : "Send a direct message or enquiry to the provider."}
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 font-medium">
          {error}
        </p>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm font-medium focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">End date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm font-medium focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
                type="date"
                ref={endDateRef}
                value={endDate}
                min={startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-y border-slate-100 py-3.5 my-2">
          <div>
            <p className="text-[14px] font-bold text-slate-900">Total price</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[12px] text-slate-500">Includes all taxes</p>
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
          <div className="text-right flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#ea580c]">${totalPrice}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              AUD {startDate && endDate && daysCount > 1 ? `/ total` : "/ day"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Full Name</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="e.g. Sarah Jenkins"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Email Address</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
                placeholder="name@example.com"
                type="email"
                name="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Phone Number</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
                placeholder="0412 345 678"
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Pickup City</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="e.g. Melbourne"
              name="pickupCity"
              autoComplete="address-level2"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              {formMode === "book" ? "Special Requests (Optional)" : "Your Message"}
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all resize-none placeholder:text-slate-400"
              placeholder={
                formMode === "book"
                  ? "Any notes or requests for the vehicle provider..."
                  : "Type your questions or enquiries here..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required={formMode === "message"}
            />
          </div>

          {/* Hidden honeypot field for bot protection */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <label className="flex items-start gap-3 text-[13px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 cursor-pointer mt-1">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c]"
              checked={licenseConfirmed}
              onChange={(e) => setLicenseConfirmed(e.target.checked)}
              required
            />
            <span className="leading-snug">
              I confirm I hold a valid, unrestricted driver&apos;s license and understand the vendor will require it upon pickup.
            </span>
          </label>

          <div className="flex justify-center mt-1 min-h-[65px]">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => {
                setTurnstileToken(token);
                setError(null);
              }}
              onExpire={() => {
                setTurnstileToken("");
                setError("Security challenge expired. Please verify again.");
              }}
              onError={() => {
                setTurnstileToken("");
                setError("Security verification failed to load. Please disable ad-blockers and refresh.");
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !licenseConfirmed || !isFormValid}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-3.5 text-[15px] font-bold text-white hover:bg-[#c2410c] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : formMode === "book" ? (
              <Send className="h-4 w-4" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {formMode === "book"
              ? instantBook
                ? "Instant Book"
                : "Request to Book"
              : "Send Message"}
          </button>
        </div>
      </form>
    </div>
  );
}
