"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import {
  Send,
  MessageCircle,
  ArrowRight,
  Info,
  Calendar as CalendarIcon,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Mail,
  Car,
  RotateCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import { scrollIntoViewAndFocus } from "@/lib/form-utils";
import { normalizeAustralianPhone, formatAustralianPhoneDisplay } from "@/lib/phone/normalize";

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
  offerPrice?: number | null;
  offerLabel?: string | null;
  defaultCity?: string;
  vehicleTitle?: string;
  vendorName?: string;
  vendorEmail?: string | null;
}

export function EnquiryWidget({
  vehicleId,
  vendorId,
  isLoggedIn,
  userProfile,
  instantBook,
  pricePerDay,
  offerPrice,
  offerLabel,
  defaultCity,
  vehicleTitle = "Vehicle",
  vendorName = "Rental Operator",
  vendorEmail,
}: EnquiryWidgetProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form mode: Book vs Message
  const [formMode, setFormMode] = useState<"book" | "message">("book");

  // Effective pricing calculations
  const effectiveDailyPrice =
    offerPrice && offerPrice > 0 && offerPrice < pricePerDay
      ? offerPrice
      : pricePerDay;
  const hasDiscount = effectiveDailyPrice < pricePerDay;
  const dailySavings = pricePerDay - effectiveDailyPrice;

  // OTP Verification state
  // If user is logged in with an existing phone, or completes OTP, step moves to "form"
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<"phone" | "otp" | "form">("phone");

  const [otpPhone, setOtpPhone] = useState(userProfile?.phone || "");
  const [normalizedE164, setNormalizedE164] = useState<string | null>(null);
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Form fields
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

  const endDateRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Duration and total calculation
  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 1;
  }, [startDate, endDate]);

  const totalPrice = daysCount > 1 ? daysCount * effectiveDailyPrice : effectiveDailyPrice;
  const originalTotalPrice = daysCount > 1 ? daysCount * pricePerDay : pricePerDay;
  const totalSavings = originalTotalPrice - totalPrice;

  // Handle request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);

    const normalized = normalizeAustralianPhone(otpPhone);
    if (!normalized) {
      setOtpError("Please enter a valid Australian mobile number (e.g. 0412 345 678).");
      return;
    }

    setNormalizedE164(normalized);
    setOtpLoading(true);

    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: normalized,
          vehicleId,
          vendorId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code. Please try again.");
      }

      setOtpChallengeId(data.challengeId);
      setResendCountdown(data.resendAfter || 45);
      if (data.devCode) {
        setDevOtpHint(data.devCode);
      }
      setOtpStep("otp");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Error sending verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpChallengeId || otpCode.trim().length !== 6) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: otpChallengeId,
          code: otpCode.trim(),
          vehicleId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Invalid code. Please try again.");
      }

      // Verification succeeded!
      setIsPhoneVerified(true);
      setVerificationToken(data.verificationToken);
      setPhone(data.verifiedPhone || normalizedE164 || otpPhone);
      setOtpStep("form");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Quick Action Buttons (Book, Message, Email)
  const handleSelectBook = () => {
    setFormMode("book");
  };

  const handleSelectMessage = () => {
    setFormMode("message");
    if (otpStep === "form") {
      setTimeout(() => messageRef.current?.focus(), 100);
    }
  };

  const handleEmailAction = () => {
    const subject = encodeURIComponent(`Car Hire Enquiry: ${vehicleTitle}`);
    const body = encodeURIComponent(
      `Hi ${vendorName},\n\nI am interested in hiring the ${vehicleTitle} listed on Hire Car Marketplace.\n\nCould you please provide information regarding vehicle availability and booking requirements?\n\nThank you.`,
    );
    const targetEmail = vendorEmail || "support@hirecarmarketplace.com.au";
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  };

  // Validate form before submission
  const isFormValid = Boolean(
    startDate &&
      endDate &&
      endDate >= startDate &&
      name.trim().length >= 2 &&
      email.trim().length >= 3 &&
      phone.trim().length >= 8 &&
      pickupCity.trim().length >= 2 &&
      licenseConfirmed &&
      (turnstileToken || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
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
      const defaultMsg =
        formMode === "book"
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
          verificationToken: verificationToken || undefined,
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

  // SUCCESS STATE
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
              <br className="hidden sm:inline" /> The vehicle owner/vendor will review your request
              and contact you regarding the booking.
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
                Use <span className="font-medium text-slate-600">{email}</span> when signing in to
                access this conversation.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 pb-7">
      {/* 3 ACTION BUTTONS (BOOK, MESSAGE, EMAIL) */}
      <div className="grid grid-cols-3 gap-2 mb-5 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={handleSelectBook}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            formMode === "book"
              ? "bg-[#ea580c] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Car className="h-3.5 w-3.5" />
          Book
        </button>
        <button
          type="button"
          onClick={handleSelectMessage}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            formMode === "message"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Message
        </button>
        <button
          type="button"
          onClick={handleEmailAction}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all"
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </button>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-slate-900">
          {formMode === "book"
            ? instantBook
              ? "Instant Book"
              : "Check Availability & Book"
            : "Message Vendor"}
        </h2>
        {isPhoneVerified && (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </span>
        )}
      </div>

      <p className="text-[13px] text-slate-500 mb-4">
        {formMode === "book"
          ? "Reserve your vehicle with verified Australian rental operators."
          : "Send a direct message or enquiry to the provider."}
      </p>

      {/* STEP 1A: ASK FOR MOBILE NUMBER */}
      {otpStep === "phone" && !isPhoneVerified && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5 mb-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ea580c]">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verify your mobile to check availability</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                We send a 6-digit security code via SMS to unlock special discounted rates and connect you with the vendor.
              </p>
            </div>
          </div>

          {otpError && (
            <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
              {otpError}
            </p>
          )}

          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Australian Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="0412 345 678"
                  value={otpPhone}
                  onChange={(e) => setOtpPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpPhone.trim().length < 8}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#c2410c] disabled:opacity-50 transition-colors shadow-sm"
            >
              {otpLoading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Send Verification Code
            </button>
          </form>
        </div>
      )}

      {/* STEP 1B: ENTER 6-DIGIT OTP */}
      {otpStep === "otp" && !isPhoneVerified && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5 mb-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ea580c]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Enter 6-digit Code</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Sent to <span className="font-semibold text-slate-800">{formatAustralianPhoneDisplay(normalizedE164 || otpPhone)}</span>
              </p>
            </div>
          </div>

          {otpError && (
            <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 font-medium">
              {otpError}
            </p>
          )}

          {devOtpHint && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-center justify-between">
              <span>Dev Testing Code: <strong className="font-mono text-sm tracking-wider">{devOtpHint}</strong></span>
              <button
                type="button"
                onClick={() => setOtpCode(devOtpHint)}
                className="underline font-semibold text-amber-900 ml-2"
              >
                Auto-fill
              </button>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-center text-xl font-bold tracking-widest text-slate-900 focus:border-[#ea580c] focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpCode.trim().length !== 6}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {otpLoading ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Verify & Unlock Enquiry Form
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setOtpStep("phone")}
                className="text-slate-500 hover:text-slate-800 underline"
              >
                Change mobile number
              </button>
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={resendCountdown > 0 || otpLoading}
                className="text-[#ea580c] font-semibold hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCw className="h-3 w-3" />
                {resendCountdown > 0 ? `Resend code (${resendCountdown}s)` : "Resend code"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: ENQUIRY / BOOKING FORM (Unlocked after verification or pre-verified) */}
      {(otpStep === "form" || isPhoneVerified) && (
        <>
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 font-medium">
              {error}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* DATES */}
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

            {/* DISCOUNTED PRICING BREAKDOWN */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 my-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-slate-900">Total Price</p>
                    {hasDiscount && (
                      <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-bold text-[#ea580c]">
                        <Sparkles className="h-3 w-3" />
                        {offerLabel || `Save $${dailySavings}/day`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[12px] text-slate-500">Includes all taxes & standard fees</p>
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1.5">
                    {hasDiscount && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        ${daysCount > 1 ? originalTotalPrice : pricePerDay}
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-black text-[#ea580c]">
                      ${totalPrice}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      AUD {startDate && endDate && daysCount > 1 ? `/ total` : "/ day"}
                    </span>
                  </div>
                  {hasDiscount && totalSavings > 0 && (
                    <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                      You save ${totalSavings} AUD for this booking!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CUSTOMER DETAILS */}
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
                  <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Verified Phone Number</span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50/30 px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="0412 345 678"
                    type="tel"
                    name="phone"
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
                  ref={messageRef}
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

              {/* Bot protection honeypot */}
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
                  I confirm I hold a valid, unrestricted driver&apos;s license and understand the
                  vendor will require it upon pickup.
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
        </>
      )}
    </div>
  );
}
