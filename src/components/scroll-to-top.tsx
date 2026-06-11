"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { useScrollPosition } from "@/hooks/use-scroll-position";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Floating scroll-to-top button that appears after scrolling
 * past 2× the viewport height. Respects reduced motion preference.
 *
 * @validates Requirements 16.4, 11.2
 */
export function ScrollToTop() {
  const scrollY = useScrollPosition();
  const prefersReduced = useReducedMotion();
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    setViewportHeight(window.innerHeight);

    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isVisible = viewportHeight > 0 && scrollY > 2 * viewportHeight;

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "instant" : "smooth",
    });
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to top"
      className={`fixed bottom-20 right-4 z-[30] flex items-center justify-center
        w-11 h-11 rounded-full bg-orange-600 text-white shadow-lg
        hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        transition-all min-w-[44px] min-h-[44px]
        ${prefersReduced ? "" : "transition-opacity duration-300 ease-out"}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
