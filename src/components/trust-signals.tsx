import { ShieldCheck, DollarSign, Map, Car, Star } from "lucide-react";

const signals = [
  { icon: ShieldCheck, label: "Verified Rental Businesses" },
  { icon: DollarSign, label: "No Marketplace Fees" },
  { icon: Map, label: "Australia Wide" },
  { icon: Car, label: "Cars, Vans, Utes & Luxury Vehicles" },
];

export function TrustSignals() {
  return (
    <section className="border-y border-slate-200 bg-white py-5 mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {/* Aggregate rating pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`h-4 w-4 ${i <= 4 ? "fill-amber-400 text-amber-400" : "fill-amber-400/40 text-amber-400/40"}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-amber-800">4.8 / 5</span>
            <span className="text-xs text-amber-600 font-medium">Rated by renters</span>
          </div>

          {/* Separator */}
          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          {signals.map((signal, i) => {
            const Icon = signal.icon;
            return (
              <>
                {i > 0 && <div key={`sep-${i}`} className="hidden md:block h-6 w-px bg-slate-200" />}
                <div key={signal.label} className="flex items-center gap-2.5">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-slate-700">{signal.label}</span>
                </div>
              </>
            );
          })}
        </div>
      </div>
    </section>
  );
}
