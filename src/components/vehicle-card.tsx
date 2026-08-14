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
  const freeCancellation = vehicle.freeCancellation !== false;
  const noHiddenFees = vehicle.noHiddenFees !== false;
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
            <h3 className="font-extrabold text-slate-900 tracking-tight truncate !text-base">
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
    <div className="min-w-0 w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#ea580c]/30 transition-all duration-300 group flex flex-col overflow-hidden">
      
      {/* 1. HERO IMAGE SECTION */}
      <div className="relative w-full aspect-[16/10] bg-slate-100 z-0">
        <Link href={`/cars/${vehicle.slug}`} className="absolute inset-0 overflow-hidden" aria-label={vehicle.title}>
          <ImageWithFallback
            src={vehicle.imageUrl}
            alt={vehicle.title}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain sm:object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none opacity-80" />
        
        {/* Top Left: Featured Badge */}
        {(variant === "featured" || priority) && (
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 bg-[#FF4D00] text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-white text-white" />
            <span className="text-[11px] font-semibold tracking-wide">Featured</span>
          </div>
        )}

        {/* Top Right: Favourite Button */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
            <SavedVehicleButton vehicleId={vehicle.id} initialSaved={saved} />
          </div>
        </div>

        {/* Bottom Left: Photo Count */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 bg-[#1E293B]/80 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <span className="text-[11px] font-semibold tracking-wide">1/{vehicle.imageCount || 1}</span>
        </div>

        {/* Bottom Right: Price Card */}
        <div className="absolute -bottom-6 right-3 sm:-bottom-8 sm:right-4 z-20 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-3 sm:p-4 flex flex-col items-center min-w-[120px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">From</span>
          <div className="flex items-baseline mt-1 mb-1.5">
            <span className="text-2xl sm:text-3xl font-black text-[#101828] leading-none">${vehicle.pricePerDayAud}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-1">/day</span>
          </div>
          {vehicle.weeklyRateAud && (
            <span className="text-[10px] font-bold text-slate-500 mt-1">Weekly from <strong className="text-[#FF4D00]">${vehicle.weeklyRateAud}</strong></span>
          )}
        </div>
      </div>

      {/* 2. BODY SECTION */}
      <div className="flex flex-1 flex-col p-4 sm:p-5 pt-8 sm:pt-10 z-10 bg-white relative">
        
        {/* Title */}
        <Link href={`/cars/${vehicle.slug}`}>
          <h2 className="text-lg sm:text-xl font-bold text-[#101828] leading-snug hover:text-[#FF4D00] transition-colors line-clamp-1">
            {vehicle.title}
          </h2>
        </Link>
        
        {/* Vendor & Rating */}
        <div className="flex items-center justify-between mt-4">
          <Link href={vehicle.vendorSlug ? `/vendors/${vehicle.vendorSlug}` : `/cars/${vehicle.slug}`} className="flex items-center gap-3">
            {vehicle.vendorLogoUrl ? (
              <Image src={vehicle.vendorLogoUrl} alt={vehicle.vendorName || 'Vendor'} width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[13px] font-bold uppercase text-slate-600">
                {vehicle.vendorName?.substring(0, 2) || "V"}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#101828] text-[13px] sm:text-sm">{vehicle.vendorName}</span>
              <BadgeCheck className="h-4 w-4 text-[#1D9BF0] fill-[#1D9BF0] stroke-white shrink-0" />
            </div>
          </Link>
          {hasRating && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Star className="h-4 w-4 fill-[#FFB800] text-[#FFB800]" />
              <span className="font-bold text-[#FFB800] text-[13px] sm:text-sm">{vehicle.avgRating!.toFixed(1)}</span>
              <span className="text-slate-500 font-semibold text-[13px] sm:text-sm">({vehicle.reviewCount})</span>
            </div>
          )}
        </div>

        <div className="w-full h-px border-t border-dashed border-slate-200 my-5" />

        {/* Specs Grid */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-slate-700" />
            <div className="flex flex-col">
              <span className="text-[#101828] font-bold text-[11px] truncate leading-tight">{vehicle.category}</span>
              <span className="text-slate-500 text-[10px] font-semibold capitalize truncate">Body Type</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
            <div className="flex flex-col">
              <span className="text-[#101828] font-bold text-[11px] truncate leading-tight">{vehicle.transmission}</span>
              <span className="text-slate-500 text-[10px] font-semibold capitalize truncate">Transmission</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><line x1="3" x2="15" y1="22" y2="22"/><line x1="4" x2="14" y1="9" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
            <div className="flex flex-col">
              <span className="text-[#101828] font-bold text-[11px] truncate leading-tight">{vehicle.fuel}</span>
              <span className="text-slate-500 text-[10px] font-semibold capitalize truncate">Fuel Type</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-700" />
            <div className="flex flex-col">
              <span className="text-[#101828] font-bold text-[11px] truncate leading-tight">{vehicle.seats} Seats</span>
              <span className="text-slate-500 text-[10px] font-semibold capitalize truncate">Seating</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px border-t border-dashed border-slate-200 my-5" />

        {/* Location & Delivery */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4 text-slate-700" />
          </div>
          <div className="flex flex-col">
            <span className="text-[#101828] font-bold text-[13px] sm:text-sm truncate">{vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}</span>
            <span className="text-slate-500 text-[11px] font-semibold capitalize">Pickup location</span>
          </div>
        </div>

        {/* Trust Chips */}
        <div className="flex items-center gap-2 mb-6 w-full">
          <div className="flex items-center justify-center gap-1.5 bg-[#EEFDF3] text-[#039855] px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex-1">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Free cancellation</span>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 bg-[#EFF8FF] text-[#175CD3] px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="truncate">No hidden fees</span>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 bg-[#F9F5FF] text-[#6941C6] px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><rect width="6" height="6" x="9" y="9" rx="1" ry="1"/></svg>
            <span className="truncate">{unlimitedKm ? "Unlimited km" : `${vehicle.dailyDistanceLimitKm} km/day`}</span>
          </div>
        </div>

        {/* Primary CTA */}
        <Link
          href={`/cars/${vehicle.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E64500] text-white py-3 rounded-xl font-bold text-[15px] shadow-[0_4px_14px_rgba(255,77,0,0.25)] transition-all group/btn mt-auto"
        >
          <CalendarCheck className="h-4 w-4" />
          Check Availability
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>

      </div>
    </div>
  );
}
