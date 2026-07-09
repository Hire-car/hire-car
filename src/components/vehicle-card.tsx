
import Link from "next/link";
import Image from "next/image";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MapPin,
  ArrowRight,
  BadgeCheck,
  Zap,
  Car,
  Cog,
  Fuel,
  Users,
  Snowflake,
  Star,
  ShieldCheck,
  Crown,
  Truck,
  Route,
  Tag,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedVehicleButton } from "@/components/saved-vehicle-button";
import type { Vehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  variant?: "default" | "compact" | "featured";
  saved?: boolean;
}

// A single spec cell in the icon row (body type / transmission / fuel / seats / feature).
function Spec({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-900">{value}</span>
        <span className="block truncate text-[11px] text-slate-400">{label}</span>
      </span>
    </div>
  );
}

// A trust chip (free cancellation / no hidden fees / unlimited km).
function Chip({ icon: Icon, label, tone }: { icon: typeof Car; label: string; tone: "emerald" | "blue" | "violet" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${tones[tone]}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

function RichVehicleCard({ vehicle, priority = false, saved = false, showFeaturedBadge = false }: VehicleCardProps & { showFeaturedBadge?: boolean }) {
  const href = `/cars/${vehicle.slug}`;
  const hasRating = (vehicle.reviewCount ?? 0) > 0 && vehicle.avgRating != null;
  const unlimitedKm = vehicle.dailyDistanceLimitKm == null;
  // Surface Air Conditioning first if present, else the first listed feature.
  const primaryFeature = vehicle.features?.includes("Air Conditioning")
    ? "Air Conditioning"
    : vehicle.features?.[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ea580c]/30 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <Link href={href} className="absolute inset-0" aria-label={vehicle.title}>
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={`${vehicle.title} available from ${vehicle.vendorName}`}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {showFeaturedBadge && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#ea580c] px-3 py-1.5 text-xs font-bold text-white shadow-md">
            <Star className="h-3.5 w-3.5 fill-white" aria-hidden="true" /> Featured
          </span>
        )}

        <div className="absolute right-3 top-3 z-10">
          <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
        </div>

        {vehicle.instantBook && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> Instant Booking
          </span>
        )}

        {/* Price block */}
        <div className="absolute bottom-3 right-3 z-10 rounded-2xl bg-white/95 px-4 py-2.5 text-right shadow-lg backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</p>
          <p className="leading-none">
            <span className="text-2xl font-black text-slate-900">${vehicle.pricePerDayAud}</span>
            <span className="text-xs font-semibold text-slate-500"> /day</span>
          </p>
          {(vehicle.weeklyRateAud || vehicle.monthlyRateAud) && (
            <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1.5 text-[11px] font-medium text-slate-500">
              {vehicle.weeklyRateAud ? <p>Weekly from <span className="font-bold text-[#ea580c]">${vehicle.weeklyRateAud}</span></p> : null}
              {vehicle.monthlyRateAud ? <p>Monthly from <span className="font-bold text-[#ea580c]">${vehicle.monthlyRateAud}</span></p> : null}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Title + vendor */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href}>
              <h3 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-[#ea580c]">{vehicle.title}</h3>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {hasRating && (
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900 whitespace-nowrap">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {vehicle.avgRating!.toFixed(1)}
                  <span className="font-normal text-slate-400">({vehicle.reviewCount} Reviews)</span>
                </span>
              )}
              {hasRating && vehicle.verified && <span className="text-slate-200 hidden sm:inline">|</span>}
              {vehicle.verified && (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 whitespace-nowrap">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Verified Host
                </span>
              )}
            </div>
          </div>

          {/* Vendor identity */}
          <Link href={vehicle.vendorSlug ? `/vendors/${vehicle.vendorSlug}` : href} className="flex shrink-0 items-center gap-2">
            {vehicle.vendorLogoUrl ? (
              <Image
                src={vehicle.vendorLogoUrl}
                alt={vehicle.vendorName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : null}
            <span className="max-w-[120px] text-right">
              <span className="flex items-center justify-end gap-1 truncate text-sm font-bold text-slate-900">
                <span className="truncate">{vehicle.vendorName}</span>
                {vehicle.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#ea580c]" aria-hidden="true" />}
              </span>
              {vehicle.superHost && (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  <Crown className="h-3 w-3" aria-hidden="true" /> Super Host
                </span>
              )}
            </span>
          </Link>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 md:grid-cols-5">
          <Spec icon={Car} label="Body Type" value={vehicle.category} />
          <Spec icon={Cog} label="Transmission" value={vehicle.transmission} />
          <Spec icon={Fuel} label="Fuel Type" value={vehicle.fuel} />
          <Spec icon={Users} label="Seating" value={`${vehicle.seats} Seats`} />
          {primaryFeature && <Spec icon={Snowflake} label="Features" value={primaryFeature} />}
        </div>

        {/* Location + delivery */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-[#ea580c]" aria-hidden="true" />
            <span className="font-medium text-slate-900">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
          </span>
          {vehicle.freeDelivery && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
              <Truck className="h-4 w-4" aria-hidden="true" /> Free delivery available
            </span>
          )}
        </div>

        {/* Trust chips */}
        {(vehicle.freeCancellation || vehicle.noHiddenFees || unlimitedKm) && (
          <div className="flex flex-wrap gap-2">
            {vehicle.freeCancellation && <Chip icon={CalendarCheck} label="Free cancellation" tone="emerald" />}
            {vehicle.noHiddenFees && <Chip icon={Tag} label="No hidden fees" tone="blue" />}
            {unlimitedKm && <Chip icon={Route} label="Unlimited km" tone="violet" />}
          </div>
        )}

        {/* CTA */}
        <Link
          href={href}
          className="mt-auto flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#ea580c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#c2410c]"
        >
          Check Availability
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function VehicleCard({ vehicle, priority = false, variant = "default", saved = false }: VehicleCardProps) {
  if (variant === "compact") {
    return (
      <Card variant="interactive" className="flex-row p-0 gap-0 card-lift border-slate-200/60 shadow-sm overflow-hidden bg-white/95">
        <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-none bg-slate-100">
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={`${vehicle.title} available from ${vehicle.vendorName}`}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="112px"
            className="object-cover"
          />
        </div>
        <CardContent className="flex-1 min-w-0 py-3 px-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-foreground truncate text-base flex items-center gap-1.5">
              {vehicle.title}
              {vehicle.instantBook && <span title="Instant Book"><Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /></span>}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info">{vehicle.category}</Badge>
              <span className="text-sm text-muted-foreground truncate">{vehicle.vendorName}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-lg font-extrabold text-foreground shrink-0 whitespace-nowrap">${vehicle.pricePerDayAud}<span className="text-xs font-medium text-muted-foreground">/day</span></span>
            <Link
              href={`/cars/${vehicle.slug}`}
              className="touch-target inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "featured") {
    return (
      <RichVehicleCard
        vehicle={vehicle}
        priority={priority}
        saved={saved}
        showFeaturedBadge={true}
      />
    );
  }

  // DEFAULT VARIANT (Clean Marketplace Grid Design)
  const isTrusted = vehicle.verified;
  return (
    <Link href={`/cars/${vehicle.slug}`} className="block group h-full">
      <div className="bg-white border border-slate-200/80 rounded-[1.5rem] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#ea580c]/40 transition-all duration-300 h-full flex flex-col">
        {/* Vehicle Image */}
        <div className="relative h-[220px] bg-slate-50 overflow-hidden shrink-0">
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={`${vehicle.title} available from ${vehicle.vendorName}`}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-40 transition-opacity" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="bg-white/95 backdrop-blur-md text-slate-700 text-[11px] font-black tracking-widest px-2.5 py-1 rounded shadow-sm border border-white/50">
              {vehicle.year || "2023"}
            </div>
          </div>
          <div className="absolute top-3 right-3 z-10">
            <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
          </div>

          {/* Trust Badge overlay */}
          {isTrusted && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded shadow-sm border border-white/50">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Trusted</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight truncate flex items-center gap-1.5">
                {vehicle.title}
                {vehicle.instantBook && <span title="Instant Book"><Zap className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" /></span>}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 text-[#ea580c] shrink-0" />
                <span className="truncate">{vehicle.city}</span>
              </div>
            </div>
            <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              <div className="flex items-baseline text-slate-900">
                <span className="font-black text-xl">${vehicle.pricePerDayAud}</span>
                <span className="text-xs font-bold text-slate-500 ml-1">/day</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 mb-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 truncate">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" /> <span className="truncate">{vehicle.seats} Seats</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 truncate">
              <Cog className="h-3.5 w-3.5 shrink-0 text-slate-400" /> <span className="truncate">{vehicle.transmission}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 truncate">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-slate-400" /> <span className="truncate">{vehicle.fuel}</span>
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-700">
            {vehicle.vendorLogoUrl ? (
              <Image src={vehicle.vendorLogoUrl} alt={vehicle.vendorName} width={24} height={24} className="h-6 w-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-[10px] text-slate-500 uppercase">
                {vehicle.vendorName.substring(0, 2)}
              </div>
            )}
            <span className="truncate">{vehicle.vendorName}</span>
            {vehicle.verified && (
              <BadgeCheck className="h-4 w-4 text-white fill-blue-500 shrink-0 drop-shadow-sm" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
