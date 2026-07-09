import Link from "next/link";
import Image from "next/image";
import { ImageWithFallback } from "@/components/image-with-fallback";
import {
  MapPin,
  ArrowRight,
  BadgeCheck,
  Zap,
  Car,
  Settings2,
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
  Heart
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

export function VehicleCard({ vehicle, priority = false, variant = "default", saved = false }: VehicleCardProps) {
  if (variant === "compact") {
    return (
      <Card variant="interactive" className="flex-row p-0 gap-0 card-lift border-slate-200/60 shadow-sm overflow-hidden bg-white/95 relative group">
        <div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-none bg-slate-100">
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={`${vehicle.title}`}
            fill
            priority={priority}
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <CardContent className="flex-1 min-w-0 py-3 px-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 tracking-tight truncate text-base">
              {vehicle.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="truncate text-sm font-medium text-slate-600">{vehicle.vendorName}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-baseline text-slate-900">
              <span className="text-lg font-black">${vehicle.pricePerDayAud}</span>
              <span className="text-xs font-bold text-slate-500 ml-1">/day</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // EXACT REFERENCE DESIGN (Applies to both default and featured to ensure it always looks perfect)
  const isTrusted = vehicle.verified;
  const hasRating = (vehicle.reviewCount ?? 0) > 0 && vehicle.avgRating != null;
  const unlimitedKm = vehicle.dailyDistanceLimitKm == null;
  const primaryFeature = vehicle.features?.includes("Air Conditioning") ? "Air Conditioning" : vehicle.features?.[0];

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#ea580c]/30 transition-all duration-300 group flex flex-col">
      {/* 1. HERO IMAGE SECTION */}
      <div className="relative w-full aspect-[16/9] md:aspect-[2.2/1] bg-slate-100 rounded-t-3xl rounded-b-none z-0">
        <Link href={`/cars/${vehicle.slug}`} className="absolute inset-0 overflow-hidden rounded-t-3xl">
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={vehicle.title}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none rounded-t-3xl opacity-80" />
        
        {/* Top Left: Featured Badge */}
        {(variant === "featured" || priority) && (
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 bg-[#FF4D00] text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-white text-white" />
            <span className="text-xs font-bold tracking-wide">Featured</span>
          </div>
        )}

        {/* Top Right: Favourite Button */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
          </div>
        </div>

        {/* Bottom Left: Instant Booking */}
        {vehicle.instantBook && (
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 bg-[#101828] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl shadow-md flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[#00E5FF] fill-[#00E5FF]" />
            <span className="text-xs md:text-sm font-semibold">Instant Booking</span>
          </div>
        )}

        {/* Bottom Right: Floating Pricing Panel (Overlaps the image bottom edge on desktop) */}
        <div className="absolute -bottom-4 right-4 md:-bottom-12 md:right-8 z-20 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-4 md:p-5 flex flex-col items-center min-w-[140px] md:min-w-[180px]">
          <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">From</span>
          <div className="flex items-baseline mt-1 mb-2">
            <span className="text-3xl md:text-5xl font-black text-[#101828] leading-none">${vehicle.pricePerDayAud}</span>
            <span className="text-[10px] md:text-xs font-bold text-slate-600 ml-1">/ day</span>
          </div>
          <div className="w-full h-px bg-slate-100 mb-2" />
          <div className="w-full flex flex-col gap-0.5 text-center">
            {vehicle.weeklyRateAud && (
              <span className="text-[10px] md:text-xs font-medium text-slate-500">Weekly from <strong className="text-[#FF4D00]">${vehicle.weeklyRateAud}</strong></span>
            )}
            {vehicle.monthlyRateAud && (
              <span className="text-[10px] md:text-xs font-medium text-slate-500">Monthly from <strong className="text-[#FF4D00]">${vehicle.monthlyRateAud}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY SECTION */}
      <div className="flex flex-col p-4 md:p-8 pt-8 md:pt-10 z-10 bg-white rounded-b-3xl relative">
        
        {/* Row 1: Identity & Host */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0 pr-0 md:pr-48">
            <Link href={`/cars/${vehicle.slug}`}>
              <h2 className="text-2xl md:text-[32px] font-extrabold text-[#101828] leading-tight truncate hover:text-[#FF4D00] transition-colors">
                {vehicle.title}
              </h2>
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {hasRating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-[#FFB800] text-[#FFB800]" />
                  <span className="font-bold text-[#101828] text-base md:text-lg">{vehicle.avgRating!.toFixed(1)}</span>
                  <span className="text-slate-500 font-medium text-sm">({vehicle.reviewCount} Reviews)</span>
                </div>
              )}
              {hasRating && vehicle.verified && <span className="text-slate-300 hidden md:block">|</span>}
              {vehicle.verified && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-[#249AA0]" />
                  <span className="text-sm font-semibold text-slate-600">Verified Host</span>
                </div>
              )}
            </div>
          </div>
          
          <Link href={vehicle.vendorSlug ? `/vendors/${vehicle.vendorSlug}` : `/cars/${vehicle.slug}`} className="flex items-center gap-3 shrink-0">
            {vehicle.vendorLogoUrl ? (
              <Image src={vehicle.vendorLogoUrl} alt={vehicle.vendorName} width={48} height={48} className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold uppercase text-slate-500">
                {vehicle.vendorName.substring(0, 2)}
              </div>
            )}
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#101828] text-sm md:text-base">{vehicle.vendorName}</span>
                {vehicle.verified && <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-[#FF4D00] fill-[#FF4D00] stroke-white" />}
              </div>
              {vehicle.superHost && (
                <div className="flex items-center gap-1 mt-0.5 bg-[#FFF5F0] px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#FF4D00]">
                  <Crown className="h-3 w-3" /> Super Host
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="w-full h-px bg-slate-100 mb-6" />

        {/* Row 2: Specs Grid */}
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-between gap-4 md:gap-2 mb-6">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm truncate">{vehicle.category}</span>
              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Body Type</span>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-slate-200" />
          
          <div className="flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm truncate">{vehicle.transmission}</span>
              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Transmission</span>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-slate-200" />

          <div className="flex items-center gap-3">
            <Fuel className="h-6 w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm truncate">{vehicle.fuel}</span>
              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Fuel Type</span>
            </div>
          </div>
          <div className="hidden md:block w-px h-8 bg-slate-200" />

          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm truncate">{vehicle.seats} Seats</span>
              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Seating</span>
            </div>
          </div>
          
          {primaryFeature && (
            <>
              <div className="hidden md:block w-px h-8 bg-slate-200" />
              <div className="flex items-center gap-3">
                <Snowflake className="h-6 w-6 text-slate-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#101828] font-bold text-sm truncate">{primaryFeature}</span>
                  <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Features</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-full h-px bg-slate-100 mb-6" />

        {/* Row 3: Location & Delivery */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm md:text-base truncate">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
              <span className="text-slate-500 text-[11px] font-medium uppercase tracking-wide">Pickup location</span>
            </div>
          </div>
          {vehicle.freeDelivery && (
            <div className="flex items-center gap-2 text-[#2E9D68] font-bold text-sm bg-[#EFFBF3] px-3 py-1.5 rounded-lg border border-[#2E9D68]/20">
              <Truck className="h-4 w-4" /> Free delivery available
            </div>
          )}
        </div>

        <div className="w-full h-px bg-slate-100 mb-6" />

        {/* Row 4: Trust Chips */}
        {(vehicle.freeCancellation || vehicle.noHiddenFees || unlimitedKm) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {vehicle.freeCancellation && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-[#EFFBF3] text-[#2E9D68] border border-[#2E9D68]/20 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" /> Free cancellation
              </div>
            )}
            {vehicle.noHiddenFees && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-[#EDF5FF] text-[#2072EA] border border-[#2072EA]/20 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm">
                <Tag className="h-4 w-4 md:h-5 md:w-5" /> No hidden fees
              </div>
            )}
            {unlimitedKm && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-[#F7F0FF] text-[#7B42F6] border border-[#7B42F6]/20 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm">
                <Route className="h-4 w-4 md:h-5 md:w-5" /> Unlimited km
              </div>
            )}
          </div>
        )}

        {/* Row 5: Primary CTA */}
        <Link
          href={`/cars/${vehicle.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E64500] text-white py-4 rounded-xl font-bold text-base shadow-[0_4px_14px_rgba(255,77,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,77,0,0.4)] hover:-translate-y-0.5 transition-all group/btn mt-auto"
        >
          Check Availability
          <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
        </Link>

      </div>
    </div>
  );
}
