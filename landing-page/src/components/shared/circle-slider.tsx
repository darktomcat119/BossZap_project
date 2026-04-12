"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CircleItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface CircleSliderProps {
  items: CircleItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function CircleSlider({
  items,
  activeId,
  onSelect,
  className = "",
}: CircleSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 8,
    );
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [items.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* Left arrow */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-20",
          "hidden md:flex h-11 w-11 items-center justify-center rounded-full",
          "bg-white border border-gray-200 shadow-lg",
          "text-gray-600 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-xl",
          "transition-all duration-200",
          "-translate-x-1/2",
          canScrollLeft
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory",
          "px-2 py-4",
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                "group/item flex flex-col items-center gap-3",
                "snap-start flex-shrink-0",
                "focus:outline-none",
              )}
            >
              {/* Outer gradient ring */}
              <div
                className={cn(
                  "relative rounded-full p-[3px] transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/40 scale-110"
                    : "bg-gray-200 group-hover/item:bg-emerald-300",
                )}
              >
                {/* Inner white circle */}
                <div
                  className={cn(
                    "relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full",
                    "bg-white transition-all duration-300",
                    "group-hover/item:scale-105",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 transition-colors duration-300",
                      isActive
                        ? item.color
                        : "text-gray-400 group-hover/item:text-gray-700",
                    )}
                  />
                </div>

                {/* Active glow */}
                {isActive && (
                  <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-xl -z-10 animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium max-w-[100px] text-center leading-tight",
                  "transition-colors duration-300",
                  isActive
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500 group-hover/item:text-gray-700",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-20",
          "hidden md:flex h-11 w-11 items-center justify-center rounded-full",
          "bg-white border border-gray-200 shadow-lg",
          "text-gray-600 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-xl",
          "transition-all duration-200",
          "translate-x-1/2",
          canScrollRight
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Edge fades */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 w-12",
          "bg-gradient-to-r from-white to-transparent",
          "transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 w-12",
          "bg-gradient-to-l from-white to-transparent",
          "transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
