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
    <div className={cn("relative group", className)}>
      {/* Left arrow (desktop) */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10",
          "hidden md:flex h-9 w-9 items-center justify-center rounded-full",
          "bg-white border border-border shadow-md",
          "text-text-secondary hover:text-primary hover:border-primary/30",
          "transition-all duration-200",
          "-translate-x-1/2",
          canScrollLeft
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory",
          "px-1 py-2",
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
                "group/item flex flex-col items-center gap-2",
                "snap-start flex-shrink-0",
                "focus:outline-none",
              )}
            >
              {/* Circle with gradient ring */}
              <div
                className={cn(
                  "relative rounded-full p-[2px] transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-br from-primary via-emerald-400 to-primary-dark shadow-lg shadow-primary/30 scale-105"
                    : "bg-border group-hover/item:bg-primary/40",
                )}
              >
                <div
                  className={cn(
                    "relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full",
                    "bg-white transition-transform duration-300",
                    "group-hover/item:scale-105",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-300",
                      isActive ? item.color : "text-text-muted group-hover/item:text-text-secondary",
                    )}
                  />
                </div>

                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium max-w-[80px] text-center leading-tight",
                  "transition-colors duration-300",
                  isActive
                    ? "text-text-primary"
                    : "text-text-muted group-hover/item:text-text-secondary",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow (desktop) */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10",
          "hidden md:flex h-9 w-9 items-center justify-center rounded-full",
          "bg-white border border-border shadow-md",
          "text-text-secondary hover:text-primary hover:border-primary/30",
          "transition-all duration-200",
          "translate-x-1/2",
          canScrollRight
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Left fade gradient */}
      <div
        className={cn(
          "pointer-events-none absolute left-0 top-0 bottom-0 w-8",
          "bg-gradient-to-r from-surface to-transparent",
          "transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Right fade gradient */}
      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 bottom-0 w-8",
          "bg-gradient-to-l from-surface to-transparent",
          "transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
