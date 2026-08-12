"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageWithFallback } from "@/components/image-with-fallback";
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, X } from "lucide-react";
import { useSwipeGesture } from "@/hooks/use-swipe-gesture";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { PaginationDots } from "./pagination-dots";

interface GalleryImage {
  id: string;
  url: string;
  alt_text: string;
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Swipe gesture: left = next image, right = previous image
  useSwipeGesture(galleryRef, {
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  });

  // Pinch-to-zoom on touch devices
  const { scale, origin, isPinching } = usePinchZoom(galleryRef);

  // Apply the zoom transform whenever the image is scaled beyond its natural size
  const isZoomed = scale > 1;

  if (!images || images.length === 0) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
        <ImageIcon className="mb-2 h-12 w-12" />
        <p>No images available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        ref={galleryRef}
        className="gallery-main-frame group relative aspect-[16/10] sm:h-[420px] md:h-[480px] w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-sm touch-pan-y select-none"
      >

        <div
          style={{
            transform: isZoomed
              ? `scale(${scale})`
              : undefined,
            transformOrigin: isZoomed
              ? `${origin.x}px ${origin.y}px`
              : undefined,
            // will-change is a GPU performance hint placed on the element that is
            // actually transformed. It is only present during the active pinch
            // gesture and removed (set to "auto") once the gesture completes, so the
            // browser does not keep a compositor layer alive longer than needed.
            willChange: isPinching ? "transform" : "auto",
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 10,
          }}
          className="p-2 sm:p-4"
        >
          <ImageWithFallback
            src={images[currentIndex].url}
            alt={images[currentIndex].alt_text || "Vehicle Image"}
            fill
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 820px"
            className="object-contain drop-shadow-2xl transition-opacity duration-300 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* Expand button in the center */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label="View full screen"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md shadow-lg transition-all hover:bg-black/80 hover:scale-105 pointer-events-auto"
        >
          <Maximize2 className="h-6 w-6" strokeWidth={2.5} />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="z-30 flex absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900/90 backdrop-blur-md shadow-lg transition-all border border-white/20 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="z-30 flex absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900/90 backdrop-blur-md shadow-lg transition-all border border-white/20 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Pagination & Thumbnails */}
      {images.length > 1 && (
        <>
          <div className="md:hidden mt-2">
            <PaginationDots total={images.length} current={currentIndex} onDotClick={setCurrentIndex} />
          </div>
          <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-6">
            {images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View image ${index + 1} of ${images.length}`}
                aria-current={index === currentIndex}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all bg-white ${
                  index === currentIndex ? "border-[#FF5F00] opacity-100 shadow-sm" : "border-slate-200 opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || "Thumbnail"}
                  fill
                  sizes="128px"
                  className="object-cover object-center"
                />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm touch-none">
          {/* Close button */}
          <button
            onClick={() => setIsModalOpen(false)}
            aria-label="Close full screen"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Modal Main Image */}
          <div className="relative h-full max-h-[85vh] w-full max-w-7xl p-4 flex items-center justify-center mt-8">
            <Image
              src={images[currentIndex].url}
              alt={images[currentIndex].alt_text || "Full screen vehicle image"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Modal Navigation */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-[60] flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-[60] flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white/90 font-medium backdrop-blur-md z-[60]">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
