"use client";

import { useRef, useState, useMemo } from "react";
import { Send, MessageCircle, Zap, ArrowRight, Info, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Turnstile, SCRIPT_URL, DEFAULT_ONLOAD_NAME } from "@marsidev/react-turnstile";
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
}

export function EnquiryWidget({ vehicleId, vendorId, isLoggedIn, userProfile, instantBook, pricePerDay }: EnquiryWidgetProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestFormMode, setGuestFormMode] = useState<"book" | "message">("book");

  const endDateRef = useRef<HTMLInputElement>(null);

  function handleEnquirySuccess(id: string) {
    setLeadId(id);
    setSuccess(true);
    if (isLoggedIn) {
      router.push(`/messages/${id}`);
    }
  }

  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  const totalPrice = daysCount > 1 ? daysCount * pricePerDay : pricePerDay;

  const handleQuickSubmit = async (isMessage = false) => {
    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (!licenseConfirmed) {
      setError("Please confirm you hold a valid driver's license.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const msg = isMessage 
        ? "Hi, I have a question about this vehicle."
        : "I am interested in booking this vehicle.";

      const res = await fetch("/api/leads/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, vendorId, startDate, endDate, message: msg }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit interest");
      }

      if (data.leadId) {
        handleEnquirySuccess(data.leadId);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setError("Please complete the security challenge.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both a start date and an end date.");
      return;
    }
    if (!licenseConfirmed) {
      setError("Please confirm you hold a valid driver's license.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (startDate && endDate && endDate < startDate) {
      setError("End date must be on or after the start date.");
      setIsSubmitting(false);
      scrollIntoViewAndFocus(endDateRef.current);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vendorId,
          name,
          email,
          phone,
          pickupCity,
          startDate,
          endDate,
          message: guestFormMode === "book" && !message ? "I am interested in booking this vehicle." : message,
          consent: true,
          turnstileToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit enquiry");
      }

      const id = data.leadId ?? data.id;
      if (id) {
        setLeadId(id);
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setTurnstileToken("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevealGuestForm = (mode: "book" | "message") => {
    if (!startDate || !endDate) {
      setError("Please select your dates first.");
      return;
    }
    setGuestFormMode(mode);
    setShowGuestForm(true);
    setError(null);
  };

  if (success) {
    const chatPath = leadId ? `/messages/${leadId}` : "/customer/enquiries";
    const signInHref = `/auth/sign-in?redirectedFrom=${encodeURIComponent(chatPath)}`;

    return (
      <div className="bg-white p-6 pb-7 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <MessageCircle className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800">Enquiry Sent!</h3>
        <p className="mt-2 text-sm text-emerald-600">
          The vendor has been notified. {isLoggedIn ? "Opening your chat..." : "Sign in to chat with the vendor."}
        </p>
        {isLoggedIn && leadId ? (
          <button
            onClick={() => router.push(chatPath)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Open Chat
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href={signInHref}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Sign in with Google to Chat
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {!isLoggedIn && (
          <p className="mt-3 text-xs text-emerald-700">
            Use the same email ({email}) when signing in to access this conversation.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 pb-7">
      <h2 className="text-xl font-bold text-slate-900">Check your dates</h2>
      <p className="mt-1 text-[13px] text-slate-500 mb-5">
        Prices may vary depending on your selected dates.
      </p>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 font-medium">{error}</p>}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
              <input
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-[15px] font-medium focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
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
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-[15px] font-medium focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all text-slate-900"
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

        <div className="flex items-center justify-between border-y border-slate-100 py-4 my-2">
          <div>
            <p className="text-[15px] font-bold text-slate-900">Total price</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[13px] text-slate-500">Includes taxes</p>
              <Info className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
          <div className="text-right flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-[#ea580c]">${totalPrice}</span>
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              AUD {startDate && endDate && daysCount > 1 ? `/ total` : '/ day'}
            </span>
          </div>
        </div>

        {!isLoggedIn && !showGuestForm ? (
          <div className="pt-2 flex flex-col gap-3">
             <button
              type="button"
              onClick={() => handleRevealGuestForm("book")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-3.5 text-[15px] font-bold text-white hover:bg-[#c2410c] transition-colors"
            >
              <Send className="h-[18px] w-[18px]" />
              {instantBook ? "Instant Book" : "Request to Book"}
            </button>
            <button
              type="button"
              onClick={() => handleRevealGuestForm("message")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              Message the provider
            </button>
          </div>
        ) : !isLoggedIn && showGuestForm ? (
          <form className="mt-4 border-t border-slate-100 pt-5 grid gap-4" onSubmit={handleGuestSubmit}>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              {guestFormMode === "book" ? "Enter your details to book" : "Enter your details to message"}
            </p>
            
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="Full name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="Email address"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="Phone number"
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-400"
              placeholder="Pickup city"
              name="pickupCity"
              autoComplete="address-level2"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              required
            />
            <textarea
              className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[15px] font-medium focus:bg-white focus:border-[#ea580c] focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all resize-none placeholder:text-slate-400"
              placeholder={guestFormMode === "book" ? "Optional message to the vendor..." : "Type your message here..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required={guestFormMode === "message"}
            />

            <label className="flex items-start gap-3 text-[13px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer mt-2">
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

            <div className="flex justify-center mt-2">
              <Script
                src={`${SCRIPT_URL}?onload=${DEFAULT_ONLOAD_NAME}&render=explicit`}
                strategy="lazyOnload"
              />
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                injectScript={false}
                onSuccess={(token) => setTurnstileToken(token)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !licenseConfirmed || !turnstileToken}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-3.5 text-[15px] font-bold text-white hover:bg-[#c2410c] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {guestFormMode === "book" ? (instantBook ? "Instant Book" : "Request to Book") : "Send Message"}
            </button>
            
            <button
              type="button"
              onClick={() => setShowGuestForm(false)}
              className="mt-1 w-full text-center text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="pt-2 flex flex-col gap-3">
            {!licenseConfirmed && (
              <label className="flex items-start gap-3 text-[13px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#ea580c] focus:ring-[#ea580c]"
                  checked={licenseConfirmed}
                  onChange={(e) => setLicenseConfirmed(e.target.checked)}
                  required
                />
                <span className="leading-snug">
                  I confirm I hold a valid, unrestricted driver&apos;s license.
                </span>
              </label>
            )}
            
            <button
              onClick={() => handleQuickSubmit(false)}
              disabled={isSubmitting || !licenseConfirmed}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-3.5 text-[15px] font-bold text-white hover:bg-[#c2410c] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-[18px] w-[18px]" />
              )}
              {instantBook ? "Instant Book" : "Request to Book"}
            </button>
            <button
              onClick={() => handleQuickSubmit(true)}
              disabled={isSubmitting || !licenseConfirmed}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              Message the provider
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
