"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquareText, X, Sparkles, SendHorizontal, Loader2 } from "lucide-react";
import { VehicleCard } from "@/components/vehicle-card";
import type { Vehicle } from "@/lib/types";

export function AssistantUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ message: string; vehicles: Vehicle[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (response || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [response, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null); // Clear previous to show new searching state

    try {
      const res = await fetch("/api/assistant/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get recommendations");
      }

      setResponse({ message: data.message, vehicles: data.vehicles || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 md:right-8 md:bottom-8 z-50 flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white px-5 py-3.5 shadow-xl hover:scale-105 active:scale-95 transition-all group border border-slate-700"
      >
        <Sparkles className="h-5 w-5 text-amber-400" />
        <span className="font-bold text-sm hidden sm:inline-block">Help me choose</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[400px] sm:max-h-[600px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-1.5 rounded-full">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">AI Assistant</h3>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Help me choose</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 shadow-sm">
            <p className="text-sm text-slate-700 leading-relaxed">
              Hi! Tell me what kind of car you need, your destination, and any preferences. I&apos;ll find the perfect match.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Cheap car in Sydney", "SUV for a family", "Electric vehicle"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {response && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">{response.message}</p>
              </div>

              {response.vehicles.length > 0 && (
                <div className="flex flex-col gap-3">
                  {response.vehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} variant="compact" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Searching marketplace...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <X className="h-4 w-4 text-red-600" />
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl rounded-tl-none p-3.5">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. I need an SUV in Sydney under $100"
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className="absolute right-2 p-2 bg-slate-900 text-white rounded-full disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
