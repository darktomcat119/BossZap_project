"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export interface FeatureCard {
  image: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}

interface FeatureCardStripProps {
  cards: FeatureCard[];
  speed?: number;
  direction?: "left" | "right";
  className?: string;
}

export function FeatureCardStrip({
  cards,
  speed = 30,
  direction = "left",
  className = "",
}: FeatureCardStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);
  const lastTimeRef = useRef(0);

  const allCards = [...cards, ...cards, ...cards];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

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
  }, [speed, direction, cards.length]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left fade */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 lg:w-24 bg-gradient-to-r from-white to-transparent z-10" />
      {/* Right fade */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 lg:w-24 bg-gradient-to-l from-white to-transparent z-10" />

      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ gap: "20px" }}
      >
        {allCards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={`${card.title}-${i}`}
              className="flex-shrink-0 w-[300px] sm:w-[340px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300"
            >
              {/* Image */}
              <div className="relative h-[180px] overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="340px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

                {/* Icon badge */}
                <div className={cn("absolute bottom-3 left-4 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", card.iconBg)}>
                  <Icon className={cn("w-5 h-5", card.iconColor)} />
                </div>
              </div>

              {/* Content */}
              <div className="px-5 pb-5 pt-2">
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
