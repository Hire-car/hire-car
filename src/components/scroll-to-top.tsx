"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useMobileState } from "@/components/mobile-state-provider";

/**
 * Floating scroll-to-top button that appears after scrolling
 * past 2x the viewport height. Respects reduced motion preference.
 *
 * Performance-optimized: Uses an internal rAF check that only triggers
 * a React state update when the boolean visibility threshold transitions,
 * avoiding continuous re-renders during scrolling.
 *
 * @validates Requirements 16.4, 11.2, 13.4
 */
export function ScrollToTop() {
  const prefersReduced = useReducedMotion();
  const { isStickyCtaVisible, isMobileNavOpen, isModalOpen } = useMobileState();
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  useEffect(() => {
    let ticking = false;

    const checkVisibility = () => {
      const threshold = window.innerHeight * 2;
      const shouldBeVisible = window.scrollY > threshold;
      setIsPastThreshold((prev) => (prev !== shouldBeVisible ? shouldBeVisible : prev));
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(checkVisibility);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    checkVisibility();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const isVisible = isPastThreshold && !isMobileNavOpen && !isModalOpen;

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "instant" : "smooth",
    });
  };

  const bottomClass = isStickyCtaVisible
    ? "bottom-[calc(var(--sticky-cta-height,44px)+12px+24px+64px+env(safe-area-inset-bottom))] lg:bottom-[calc(24px+64px+env(safe-area-inset-bottom))]"
    : "bottom-[calc(24px+64px+env(safe-area-inset-bottom))]";

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to top"
      className={`fixed right-6 z-[var(--z-whatsapp,50)] flex items-center justify-center
        w-11 h-11 rounded-full bg-orange-600 text-white shadow-lg
        hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        min-w-[44px] min-h-[44px]
        ${bottomClass}
        ${prefersReduced ? "" : "transition-[opacity,transform] duration-300 ease-out"}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}