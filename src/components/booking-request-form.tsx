"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Loader2 } from "lucide-react";

import { createPublicBooking } from "@/app/vendor/bookings/actions";
import { Button } from "@/components/ui/button";

type BookingRequestFormProps = {
  vehicleId: string;
  organizationId: string;
  pricePerDayAud: number;
  userProfile?: {
    name: string;
    email: string;
    phone: string;
  } | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayDateInput() {
  return new Date().toISOString().split("T")[0];
}

function calculateDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return diff >= 0 ? diff + 1 : 0;
}

export function BookingRequestForm({
  vehicleId,
  organizationId,
  pricePerDayAud,
  userProfile,
}: BookingRequestFormProps) {
  const [customerName, setCustomerName] = useState(userProfile?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(userProfile?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const rentalDays = useMemo(() => calculateDays(startDate, endDate), [startDate, endDate]);
  const estimatedTotal = rentalDays * pricePerDayAud;
  const minDate = todayDateInput();

  function submitBooking() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createPublicBooking({
          vehicleId,
          organizationId,
          customerName,
          customerEmail,
          customerPhone,
          startDate,
          endDate,
          totalPrice: estimatedTotal,
        });

        setServerTotal(result.totalPrice ?? estimatedTotal);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create booking request.");
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" />
        </div>
        <h2 className="text-lg font-bold text-emerald-900">Booking request sent</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          The vendor has been notified and will confirm availability, payment, pickup details, and rental terms directly with you.
        </p>
        <div className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-emerald-900">
          Estimated total: ${serverTotal?.toLocaleString() ?? estimatedTotal.toLocaleString()} AUD
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Request a booking</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose dates and send a booking request to the operator.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Pickup
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              type="date"
              value={startDate}
              min={minDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                if (endDate && event.target.value > endDate) setEndDate(event.target.value);
              }}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Return
            </span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              type="date"
              value={endDate}
              min={startDate || minDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
        </div>

        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          placeholder="Full name"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          placeholder="Email"
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          placeholder="Phone number"
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Estimated total</span>
            <span className="font-black text-slate-950">
              {rentalDays > 0 ? `$${estimatedTotal.toLocaleString()} AUD` : "Select dates"}
            </span>
          </div>
          {rentalDays > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {rentalDays} day{rentalDays === 1 ? "" : "s"} at ${pricePerDayAud.toLocaleString()} AUD/day
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span className="leading-snug">
            I understand this is a booking request. The vendor will confirm availability, payment, deposit, and rental terms directly.
          </span>
        </label>

        <Button
          type="button"
          size="cta"
          className="w-full"
          disabled={
            isPending ||
            !acceptedTerms ||
            !customerName.trim() ||
            !customerEmail.trim() ||
            rentalDays <= 0
          }
          onClick={submitBooking}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending request...
            </>
          ) : (
            "Send booking request"
          )}
        </Button>
      </div>
    </div>
  );
}
