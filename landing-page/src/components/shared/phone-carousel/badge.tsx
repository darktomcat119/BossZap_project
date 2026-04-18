import { cn } from "@/lib/utils";
import type { FloatingBadge } from "./types";

const PDF_PATH =
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" +
  "a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19" +
  "a2 2 0 01-2 2z";

const REVENUE_PATH = "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";

export function Badge({
  badge,
  visible,
}: {
  badge: FloatingBadge;
  visible: boolean;
}) {
  const isTopLeft = badge.position === "top-left";

  return (
    <div
      className={cn(
        "absolute z-20 flex items-center gap-2.5 " + "rounded-xl px-3 py-2",
        "bg-white/95 backdrop-blur-md shadow-xl shadow-black/10",
        "border border-gray-100",
        "transition-all duration-500",
        isTopLeft
          ? "top-24 left-2 sm:-left-4"
          : "bottom-28 right-2 sm:-right-4",
        visible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-75 translate-y-4",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center " + "rounded-lg",
          badge.icon === "pdf" ? "bg-emerald-50" : "bg-blue-50",
        )}
      >
        {badge.icon === "pdf" ? (
          <svg
            className="w-4 h-4 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={PDF_PATH} />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={REVENUE_PATH}
            />
          </svg>
        )}
      </div>
      <div>
        <p
          className={
            "text-[11px] font-bold text-gray-900 " +
            "leading-tight whitespace-nowrap"
          }
        >
          {badge.title}
        </p>
        <p
          className={
            "text-[9px] text-gray-500 leading-tight " + "whitespace-nowrap"
          }
        >
          {badge.subtitle}
        </p>
      </div>
    </div>
  );
}
