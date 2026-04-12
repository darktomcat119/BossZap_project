"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StripItem {
  src: string;
  alt: string;
}

interface InfiniteScrollStripProps {
  items: StripItem[];
  speed?: number; // pixels per second
  direction?: "left" | "right";
  height?: number;
  gap?: number;
  className?: string;
}

export function InfiniteScrollStrip({
  items,
  speed = 30,
  direction = "left",
  height = 220,
  gap = 16,
  className = "",
}: InfiniteScrollStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Duplicate items for seamless loop
  const allItems = [...items, ...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Calculate single set width
    const singleSetWidth = track.scrollWidth / 3;

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const movement = speed * delta;
      if (direction === "left") {
        posRef.current -= movement;
        if (posRef.current <= -singleSetWidth) {
          posRef.current += singleSetWidth;
        }
      } else {
        posRef.current += movement;
        if (posRef.current >= 0) {
          posRef.current -= singleSetWidth;
        }
      }

      track.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(animate);
    };

    // Start from correct position for right direction
    if (direction === "right") {
      posRef.current = -singleSetWidth;
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!prefersReduced) {
      animRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      lastTimeRef.current = 0;
    };
  }, [speed, direction, items.length]);

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ gap: `${gap}px` }}
      >
        {allItems.map((item, i) => (
          <div
            key={`${item.alt}-${i}`}
            className="relative flex-shrink-0 rounded-2xl overflow-hidden"
            style={{ width: `${height * 1.5}px`, height: `${height}px` }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-cover"
              sizes={`${height * 1.5}px`}
            />
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
