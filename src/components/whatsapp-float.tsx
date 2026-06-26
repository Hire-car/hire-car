"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useMobileState } from "@/components/mobile-state-provider";

interface WhatsAppFloatProps {
  /** Platform support WhatsApp number */
  phone?: string;
  /** Whether the sticky CTA bar is visible on the current page (mobile only) */
  stickyCtaVisible?: boolean;
  /** When true, hide the button entirely (e.g. modal or mobile nav is open) */
  hidden?: boolean;
}

// Routes where the floating support button should NOT appear
const HIDDEN_PREFIXES = ["/vendor", "/admin", "/auth", "/customer"];

/**
 * A floating WhatsApp support button shown on public-facing pages only.
 * Lets any visitor reach the Hire Car support team directly.
 *
 * Context-aware positioning:
 * - Repositions above the sticky CTA bar on mobile when visible
 * - Hides entirely when modals or mobile nav are open
 * - Respects safe area insets on modern devices
 */
export function WhatsAppFloat({
  phone = "61434930437",
  stickyCtaVisible = false,
  hidden = false,
}: WhatsAppFloatProps) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);
  const { isStickyCtaVisible, isMobileNavOpen, isModalOpen } = useMobileState();

  // Hide on certain routes
  const routeHidden = HIDDEN_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  if (routeHidden) return null;

  // Hide when modals or mobile nav are open
  const isEffectivelyHidden = hidden || isMobileNavOpen || isModalOpen;
  if (isEffectivelyHidden) return null;

  const effectivelySticky = stickyCtaVisible || isStickyCtaVisible;

  const url = buildWhatsAppUrl(
    phone,
    "Hi Hire Car team, I have a question about renting a vehicle."
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chat with us on WhatsApp"
      className={[
        "fixed right-6 z-[var(--z-whatsapp)] flex items-center gap-3 rounded-full bg-[#25D366] pl-4 pr-5 py-3.5 text-white font-bold shadow-2xl shadow-emerald-600/30 hover:bg-[#1ebe5d] hover:scale-105 transition-all",
        // On mobile: when the sticky CTA is visible, lift the button above the bar.
        // Bottom offset = CTA_height + 12px gap + 24px base offset (+ safe area).
        // `--sticky-cta-height` falls back to 44px (the standard bar height),
        // which yields the 80px offset the design property documents.
        // On lg+: always use the 24px base offset (no sticky CTA on desktop).
        effectivelySticky
          ? "bottom-[calc(var(--sticky-cta-height,44px)+12px+24px+env(safe-area-inset-bottom))] lg:bottom-[calc(24px+env(safe-area-inset-bottom))]"
          : "bottom-[calc(24px+env(safe-area-inset-bottom))]",
      ].join(" ")}
    >
      <svg
        className="h-6 w-6 shrink-0"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${hovered ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0 sm:max-w-[140px] sm:opacity-100"}`}
      >
        Chat with us
      </span>
    </a>
  );
}
