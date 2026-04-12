"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SlideItem {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
}

interface Circle3DSliderProps {
  items: SlideItem[];
  autoPlay?: boolean;
  rotationSpeed?: number; // degrees per second
  className?: string;
  featuredLabel?: string;
  showingLabel?: string;
}

export function Circle3DSlider({
  items,
  autoPlay = true,
  rotationSpeed = 8,
  className = "",
  featuredLabel = "Featured",
  showingLabel = "Showing",
}: Circle3DSliderProps) {
  const [rotation, setRotation] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const total = items.length;
  // Each item occupies 360/total degrees around the cylinder
  const anglePerItem = 360 / total;
  // Cylinder radius — distance from center to each card
  // Bigger radius = more spacing between cards
  const radius = 700;

  // Continuous smooth rotation using requestAnimationFrame
  useEffect(() => {
    if (!autoPlay || isPaused) {
      lastTimeRef.current = 0;
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const delta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      setRotation((prev) => prev + direction * rotationSpeed * delta);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
  }, [autoPlay, isPaused, rotationSpeed, direction]);

  const next = () => setRotation((prev) => prev + anglePerItem);
  const prev = () => setRotation((prev) => prev - anglePerItem);

  // Determine which item is currently closest to the front (for active state)
  const activeIndex =
    ((Math.round(-rotation / anglePerItem) % total) + total) % total;

  return (
    <div
      className={cn("relative w-full", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D scene — perspective creates the tilt visually,
          but the cylinder axis stays perfectly vertical */}
      <div
        className="relative h-[480px] flex items-center justify-center"
        style={{
          perspective: "2000px",
          perspectiveOrigin: "center center",
        }}
      >
        {/* Cylinder rotation container — only rotates around Y axis */}
        <div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            transition: isPaused
              ? "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)"
              : "none",
            width: "180px",
            height: "280px",
          }}
        >
          {items.map((item, index) => {
            // Each card sits at its angle around the cylinder
            const itemAngle = index * anglePerItem;
            // Card is positioned on the cylinder surface, then
            // counter-rotated so the photo always faces the camera
            const isActive = index === activeIndex;

            return (
              <div
                key={item.id}
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  // 1. Rotate around vertical Y axis to position
                  // 2. Push outward to cylinder surface
                  // The card face is now TANGENT to the cylinder
                  // Y axis (vertical) stays parallel to rotation axis
                  // Bottom edge stays perpendicular to floor
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Card */}
                <div
                  className={cn(
                    "relative w-full rounded-2xl overflow-hidden",
                    "transition-all duration-700",
                    isActive
                      ? "shadow-2xl shadow-black/30 ring-1 ring-gray-200"
                      : "shadow-xl shadow-black/20 ring-1 ring-white/10",
                  )}
                  style={{ height: "200px" }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="180px"
                    priority={isActive}
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

                  {/* Glow accent on active */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 via-transparent to-transparent" />
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-base font-bold text-white drop-shadow-lg leading-tight">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="mt-0.5 text-[10px] text-white/80 leading-snug">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Featured badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xl shadow-emerald-500/40 animate-pulse">
                      {featuredLabel}
                    </div>
                  )}
                </div>

                {/* Mirror reflection */}
                <div
                  className="absolute left-0 w-full overflow-hidden"
                  style={{
                    top: "201px",
                    height: "80px",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, transparent 80%)",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, transparent 80%)",
                  }}
                >
                  <div
                    className="relative w-full"
                    style={{
                      height: "200px",
                      transform: "scaleY(-1)",
                    }}
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="180px"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floor reflection / shadow */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-12 w-[600px] h-[80px] rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,212,170,0.15) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-white border border-gray-200 shadow-lg",
            "text-gray-600 hover:text-emerald-600 hover:border-emerald-300",
            "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
          )}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setDirection((d) => (d === 1 ? -1 : 1))}
          aria-label="Reverse direction"
          className={cn(
            "px-4 h-10 rounded-full flex items-center justify-center text-xs font-medium",
            "bg-emerald-50 border border-emerald-200",
            "text-emerald-700 hover:bg-emerald-100",
            "transition-all duration-200",
          )}
        >
          {direction === 1 ? "→ Auto" : "← Auto"}
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center",
            "bg-white border border-gray-200 shadow-lg",
            "text-gray-600 hover:text-emerald-600 hover:border-emerald-300",
            "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Active title display */}
      <div className="mt-4 text-center min-h-[2rem]">
        <p className="text-sm text-gray-500">
          {showingLabel}:{" "}
          <span className="font-semibold text-emerald-600">
            {items[activeIndex]?.title}
          </span>
        </p>
      </div>
    </div>
  );
}
