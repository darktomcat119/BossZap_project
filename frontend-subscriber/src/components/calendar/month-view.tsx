"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import {
  WEEKDAY_KEYS,
  daysInMonth,
  dateKey,
  STATUS_PALETTE,
  groupEventsByDate,
} from "./utils";

const MAX_INLINE = 3;

type Props = {
  year: number;
  month: number;
  events: CalendarEvent[];
  todayIso: string;
  selectedIso: string | null;
  onDayClick: (iso: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEmptyDayCreate: (iso: string) => void;
};

export function MonthView({
  year,
  month,
  events,
  todayIso,
  selectedIso,
  onDayClick,
  onEventClick,
  onEmptyDayCreate,
}: Props) {
  const t = useTranslations("calendar");
  const eventsMap = groupEventsByDate(events);
  const first = new Date(year, month, 1).getDay();
  const total = daysInMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="py-2 text-xs font-medium text-text-muted"
          >
            {t(`days.${key}`)}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="aspect-square rounded-lg bg-background/40 md:aspect-auto md:min-h-[110px]"
              />
            );
          }

          const iso = dateKey(year, month, day);
          const dayEvents = eventsMap[iso] ?? [];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          const overflow = dayEvents.length - MAX_INLINE;

          return (
            <button
              key={iso}
              onClick={() => onDayClick(iso)}
              className={cn(
                // Mobile: square cell with dots. Desktop: tall cell with chips.
                "group flex aspect-square flex-col items-stretch overflow-hidden rounded-lg border text-left transition-colors",
                "md:aspect-auto md:min-h-[110px]",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-surface hover:border-border hover:bg-background/60",
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-1.5 pt-1 md:px-2 md:pt-1.5">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium md:h-6 md:w-6",
                    isToday
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : isSelected
                        ? "text-primary"
                        : "text-text-primary",
                  )}
                >
                  {day}
                </span>
                {dayEvents.length === 0 ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmptyDayCreate(iso);
                    }}
                    className="hidden h-5 w-5 items-center justify-center rounded text-text-muted opacity-0 transition-opacity hover:text-primary group-hover:opacity-100 md:flex"
                    aria-label={t("addEvent")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="hidden text-[10px] font-medium text-text-muted md:inline">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event chips on desktop */}
              <div className="mt-0.5 hidden flex-1 flex-col gap-0.5 px-1 pb-1 md:flex">
                {dayEvents.slice(0, MAX_INLINE).map((evt) => {
                  const palette = STATUS_PALETTE[evt.status];
                  return (
                    <span
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(evt);
                      }}
                      className={cn(
                        "flex items-center gap-1 truncate rounded border-l-2 px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80",
                        palette.block,
                        palette.blockBorder,
                        palette.blockText,
                      )}
                      title={evt.title}
                    >
                      {evt.event_time && (
                        <span className="shrink-0 opacity-70">
                          {evt.event_time.slice(0, 5)}
                        </span>
                      )}
                      <span className="truncate">{evt.title}</span>
                    </span>
                  );
                })}
                {overflow > 0 && (
                  <span className="px-1.5 text-[10px] font-medium text-text-muted">
                    +{overflow} {t("more")}
                  </span>
                )}
              </div>

              {/* Dots on mobile */}
              {dayEvents.length > 0 && (
                <div className="mt-auto flex items-center justify-center gap-0.5 pb-1.5 md:hidden">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <span
                      key={evt.id}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_PALETTE[evt.status].dot,
                      )}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
