"use client";

import { useEffect } from "react";
import { Share, Plus, X } from "lucide-react";

/**
 * Bottom sheet with step-by-step "Add to Home Screen" instructions for iOS
 * Safari, which has no programmatic install prompt.
 */
export function IosInstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Install instructions">
      <div className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" aria-hidden="true" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" aria-hidden="true" className="h-12 w-12 rounded-xl border border-slate-100" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">Install HireCar</h2>
            <p className="text-sm text-slate-500">Add it to your home screen in two steps.</p>
          </div>
        </div>

        <ol className="mt-6 space-y-4">
          <li className="flex items-center gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">1</span>
            <p className="text-sm text-slate-700">
              Tap the <span className="font-semibold text-slate-900">Share</span> button
              <Share className="mx-1 inline h-4 w-4 -mt-0.5 text-blue-600" aria-hidden="true" />
              in Safari&apos;s toolbar.
            </p>
          </li>
          <li className="flex items-center gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">2</span>
            <p className="text-sm text-slate-700">
              Choose
              <span className="mx-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-900">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add to Home Screen
              </span>
              .
            </p>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
