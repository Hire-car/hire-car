"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const VISIT_COUNT_KEY = "hirecar_visit_count";
const DISMISSED_KEY = "hirecar_a2hs_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Add to Home Screen banner that listens for the `beforeinstallprompt` event.
 * Shows only after 2+ visits and if not previously dismissed.
 * Animates in from the bottom; respects reduced motion.
 *
 * @validates Requirements 10.5
 */
export function A2HSBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Track visit count
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));

    // Only show after 2+ visits
    if (visitCount < 2) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShowBanner(true);

      // Trigger animation after mount
      requestAnimationFrame(() => {
        setIsAnimatingIn(true);
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }

    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[55] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]
        transform will-change-transform
        ${prefersReduced ? "" : "transition-transform duration-300 ease-out"}
        ${isAnimatingIn ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="mx-auto max-w-md rounded-xl bg-white border border-gray-200 shadow-xl p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
          <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-orange-100">
            <Download className="h-5 w-5 text-orange-600" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              Install HireCar
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Add to your home screen for quick access
            </p>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors min-h-[44px]"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors min-h-[44px]"
              >
                Not now
              </button>
            </div>
          </div>

          {/* Dismiss X button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="flex shrink-0 items-center justify-center rounded-full p-1 hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
          >
            <X className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
