"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselSlide {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageCarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function ImageCarousel({
  slides,
  autoPlay = true,
  interval = 4000,
  className = "",
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1,
    );
  }, [slides.length]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Slides */}
      <div className="relative aspect-[9/16] max-w-[280px] mx-auto">
        {/* Phone frame */}
        <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 overflow-hidden z-10">
          {/* Status bar */}
          <div className="h-6 bg-gray-900 flex items-center justify-center">
            <div className="w-16 h-1 bg-gray-700 rounded-full" />
          </div>

          {/* Screen content */}
          <div className="relative h-[calc(100%-24px)] overflow-hidden">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={cn(
                  "absolute inset-0 transition-all duration-500 ease-out",
                  i === current
                    ? "opacity-100 translate-x-0"
                    : i < current ||
                        (current === 0 &&
                          i === slides.length - 1 &&
                          direction === 1)
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 translate-x-full",
                )}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-cover"
                  sizes="280px"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Reflection glow */}
        <div className="absolute -inset-4 bg-emerald-500/5 blur-3xl rounded-full z-0" />
      </div>

      {/* Caption */}
      <div className="mt-6 text-center min-h-[3rem]">
        <p className="text-sm text-gray-400 transition-all duration-300">
          {slides[current]?.caption}
        </p>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={prev}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current
                  ? "w-6 bg-emerald-500"
                  : "w-2 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
