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
  CalendarCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SavedVehicleButton } from "@/components/saved-vehicle-button";
import type { Vehicle } from "@/lib/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  variant?: "default" | "compact" | "featured" | "grid" | "list";
  saved?: boolean;
}

export function VehicleCard({ vehicle, priority = false, variant = "default", saved = false }: VehicleCardProps) {
  const hasRating = (vehicle.reviewCount ?? 0) > 0 && vehicle.avgRating != null;
  const unlimitedKm = vehicle.dailyDistanceLimitKm == null;
  const primaryFeature = vehicle.features?.includes("Air Conditioning") ? "Air Conditioning" : vehicle.features?.[0];

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

  // FLUID REFERENCE DESIGN (Always renders as reference design, perfectly fluid via flex-wrap)
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#ea580c]/30 transition-all duration-300 group flex flex-col overflow-hidden">
      
      {/* 1. HERO IMAGE SECTION */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[2.2/1] bg-slate-100 z-0">
        <Link href={`/cars/${vehicle.slug}`} className="absolute inset-0" aria-label={vehicle.title}>
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none opacity-80" />
        
        {/* Top Left: Featured Badge */}
        {(variant === "featured" || priority) && (
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10 bg-[#FF4D00] text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-white text-white" />
            <span className="text-xs font-bold tracking-wide">Featured</span>
          </div>
        )}

        {/* Top Right: Favourite Button */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
          </div>
        </div>

        {/* Bottom Left: Instant Booking */}
        {vehicle.instantBook && (
          <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-10 bg-[#101828] text-white px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-[#00E5FF] fill-[#00E5FF]" />
            <span className="text-xs sm:text-sm font-semibold">Instant Booking</span>
          </div>
        )}

        {/* Bottom Right: Floating Pricing Panel */}
        <div className="absolute -bottom-6 right-3 sm:-bottom-10 sm:right-6 z-20 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-3 sm:p-5 flex flex-col items-center min-w-[130px] sm:min-w-[160px]">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">From</span>
          <div className="flex items-baseline mt-0.5 mb-1.5 sm:mb-2">
            <span className="text-3xl sm:text-4xl font-black text-[#101828] leading-none">${vehicle.pricePerDayAud}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 ml-1">/ day</span>
          </div>
          <div className="w-full h-px bg-slate-100 mb-1.5 sm:mb-2" />
          <div className="w-full flex flex-col gap-0.5 text-center">
            {vehicle.weeklyRateAud && (
              <span className="text-[9px] sm:text-xs font-medium text-slate-500">Weekly from <strong className="text-[#FF4D00]">${vehicle.weeklyRateAud}</strong></span>
            )}
            {vehicle.monthlyRateAud && (
              <span className="text-[9px] sm:text-xs font-medium text-slate-500">Monthly from <strong className="text-[#FF4D00]">${vehicle.monthlyRateAud}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY SECTION */}
      <div className="flex flex-col p-4 sm:p-5 lg:p-6 pt-10 sm:pt-12 z-10 bg-white relative">
        
        {/* Row 1: Identity & Host */}
        <div className="flex flex-wrap items-start justify-between gap-y-4 gap-x-6 mb-5">
          <div className="flex flex-col min-w-[200px] flex-1">
            <Link href={`/cars/${vehicle.slug}`}>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#101828] leading-tight hover:text-[#FF4D00] transition-colors break-words">
                {vehicle.title}
              </h2>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              {hasRating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[#FFB800] text-[#FFB800]" />
                  <span className="font-bold text-[#101828] text-sm sm:text-base">{vehicle.avgRating!.toFixed(1)}</span>
                  <span className="text-slate-500 font-medium text-xs">({vehicle.reviewCount} Reviews)</span>
                </div>
              )}
              {hasRating && vehicle.verified && <span className="text-slate-300">|</span>}
              {vehicle.verified && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#249AA0]" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-600">Verified Host</span>
                </div>
              )}
            </div>
          </div>
          
          <Link href={vehicle.vendorSlug ? `/vendors/${vehicle.vendorSlug}` : `/cars/${vehicle.slug}`} className="flex items-center gap-3 shrink-0">
            {vehicle.vendorLogoUrl ? (
              <Image src={vehicle.vendorLogoUrl} alt={vehicle.vendorName} width={48} height={48} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold uppercase text-slate-500">
                {vehicle.vendorName.substring(0, 2)}
              </div>
            )}
            <div className="flex flex-col items-start sm:items-end">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#101828] text-sm sm:text-base">{vehicle.vendorName}</span>
                {vehicle.verified && <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF4D00] fill-[#FF4D00] stroke-white" />}
              </div>
              {vehicle.superHost && (
                <div className="flex items-center gap-1 mt-0.5 bg-[#FFF5F0] px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FF4D00]">
                  <Crown className="h-3 w-3" /> Super Host
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="w-full h-px bg-slate-100 mb-5" />

        {/* Row 2: Specs Grid - Fluid wrapping */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-5 items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <Car className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-xs sm:text-sm truncate">{vehicle.category}</span>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Body Type</span>
            </div>
          </div>
          <div className="w-px h-6 sm:h-8 bg-slate-200 hidden min-[400px]:block" />
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-xs sm:text-sm truncate">{vehicle.transmission}</span>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Transmission</span>
            </div>
          </div>
          <div className="w-px h-6 sm:h-8 bg-slate-200 hidden min-[500px]:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Fuel className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-xs sm:text-sm truncate">{vehicle.fuel}</span>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Fuel Type</span>
            </div>
          </div>
          <div className="w-px h-6 sm:h-8 bg-slate-200 hidden min-[650px]:block" />

          <div className="flex items-center gap-2 sm:gap-3">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-xs sm:text-sm truncate">{vehicle.seats} Seats</span>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Seating</span>
            </div>
          </div>
          
          {primaryFeature && (
            <>
              <div className="w-px h-6 sm:h-8 bg-slate-200 hidden min-[800px]:block" />
              <div className="flex items-center gap-2 sm:gap-3">
                <Snowflake className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[#101828] font-bold text-xs sm:text-sm truncate">{primaryFeature}</span>
                  <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Features</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-full h-px bg-slate-100 mb-5" />

        {/* Row 3: Location & Delivery */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#101828] font-bold text-sm sm:text-base truncate">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium capitalize tracking-wide">Pickup location</span>
            </div>
          </div>
          {vehicle.freeDelivery && (
            <div className="flex items-center gap-2 text-[#2E9D68] font-bold text-xs sm:text-sm bg-transparent px-0 py-0 rounded-none border-0">
              Free delivery available
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 ml-1" />
            </div>
          )}
        </div>

        {/* NO DIVIDER HERE, just like the reference! */}

        {/* Row 4: Trust Chips (Wrap beautifully) */}
        {(vehicle.freeCancellation || vehicle.noHiddenFees || unlimitedKm) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 border-t border-slate-100 pt-5">
            {vehicle.freeCancellation && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#EFFBF3] text-[#2E9D68] px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex-1 min-w-[140px]">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" /> Free cancellation
              </div>
            )}
            {vehicle.freeCancellation && (vehicle.noHiddenFees || unlimitedKm) && <div className="w-px h-6 bg-slate-200 hidden sm:block" />}
            
            {vehicle.noHiddenFees && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#EDF5FF] text-[#2072EA] px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex-1 min-w-[140px]">
                <Tag className="h-4 w-4 sm:h-5 sm:w-5" /> No hidden fees
              </div>
            )}
            {vehicle.noHiddenFees && unlimitedKm && <div className="w-px h-6 bg-slate-200 hidden sm:block" />}
            
            {unlimitedKm && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-[#F7F0FF] text-[#7B42F6] px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex-1 min-w-[140px]">
                <Route className="h-4 w-4 sm:h-5 sm:w-5" /> Unlimited km
              </div>
            )}
          </div>
        )}

        {/* Row 5: Primary CTA */}
        <Link
          href={`/cars/${vehicle.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E64500] text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,77,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,77,0,0.4)] hover:-translate-y-0.5 transition-all group/btn mt-auto"
        >
          Check Availability
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>

      </div>
    </div>
  );
}
