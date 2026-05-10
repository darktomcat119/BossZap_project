"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import {
  WEEKDAY_KEYS,
  MONTH_KEYS,
  dateKeyOf,
  groupEventsByDate,
  layoutDayEvents,
  STATUS_PALETTE,
} from "./utils";

const HOUR_START = 6;
const HOUR_END = 22;
const HOUR_HEIGHT = 64;

type Props = {
  date: Date;
  events: CalendarEvent[];
  todayIso: string;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (iso: string, hour?: number) => void;
};

export function DayView({
  date,
  events,
  todayIso,
  onEventClick,
  onSlotClick,
}: Props) {
  const t = useTranslations("calendar");
  const iso = dateKeyOf(date);
  const isToday = iso === todayIso;
  const eventsMap = groupEventsByDate(events);
  const dayEvents = eventsMap[iso] ?? [];
  const { timed, allDay } = layoutDayEvents(dayEvents);
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i,
  );

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span
          className={cn(
            "flex h-12 w-12 flex-col items-center justify-center rounded-xl text-center",
            isToday
              ? "bg-primary text-white shadow-md shadow-primary/30"
              : "border border-border text-text-primary",
          )}
        >
          <span className="text-[10px] font-medium uppercase opacity-90">
            {t(`days.${WEEKDAY_KEYS[date.getDay()]}`)}
          </span>
          <span className="text-base font-bold leading-none">
            {date.getDate()}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">
            {t(`months.${MONTH_KEYS[date.getMonth()]}`)} {date.getFullYear()}
          </h3>
          <p className="text-xs text-text-muted">
            {dayEvents.length === 0
              ? t("noEvents")
              : t("eventsCount", { n: dayEvents.length })}
          </p>
        </div>
      </div>

      {/* All-day list */}
      {allDay.length > 0 && (
        <div className="rounded-xl border border-border bg-background/40 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase text-text-muted">
            {t("allDay")}
          </p>
          <div className="flex flex-wrap gap-2">
            {allDay.map((evt) => {
              const palette = STATUS_PALETTE[evt.status];
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className={cn(
                    "rounded-lg border-l-2 px-2 py-1 text-xs font-medium",
                    palette.block,
                    palette.blockBorder,
                    palette.blockText,
                    evt.status === "cancelled" && "line-through",
                  )}
                >
                  {evt.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[64px_1fr] min-w-[320px]">
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="border-t border-border/60 pr-2 text-right text-[10px] text-text-muted"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="-translate-y-1/2 inline-block bg-surface px-1">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "relative border-l border-border/60",
              isToday && "bg-primary/[0.03]",
            )}
            style={{ height: HOUR_HEIGHT * hours.length }}
          >
            {hours.map((h) => (
              <button
                key={h}
                onClick={() => onSlotClick(iso, h)}
                className="block w-full border-t border-border/60 text-left transition-colors hover:bg-primary/5"
                style={{ height: HOUR_HEIGHT }}
                aria-label={`${iso} ${h}:00`}
              >
                <span className="sr-only">
                  {t("addEvent")} {h}:00
                </span>
              </button>
            ))}

            {timed.map((evt) => {
              const palette = STATUS_PALETTE[evt.status];
              const top = ((evt.startMin - HOUR_START * 60) / 60) * HOUR_HEIGHT;
              const height = Math.max(
                28,
                ((evt.endMin - evt.startMin) / 60) * HOUR_HEIGHT - 2,
              );
              const widthPct = 100 / evt.columnsTotal;
              const leftPct = widthPct * evt.column;
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className={cn(
                    "absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs leading-tight shadow-sm transition-shadow hover:shadow-md",
                    palette.block,
                    palette.blockBorder,
                    palette.blockText,
                    evt.status === "cancelled" && "line-through",
                  )}
                  style={{
                    top,
                    height,
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                  }}
                  title={evt.title}
                >
                  <div className="truncate font-semibold">{evt.title}</div>
                  {evt.event_time && (
                    <div className="truncate text-[11px] opacity-75">
                      {evt.event_time.slice(0, 5)}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </div>
                  )}
                </button>
              );
            })}

            {isToday && <NowLine hourStart={HOUR_START} />}
          </div>
        </div>
      </div>

      {dayEvents.length === 0 && (
        <button
          onClick={() => onSlotClick(iso)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          {t("addEvent")}
        </button>
      )}
    </div>
  );
}

function NowLine({ hourStart }: { hourStart: number }) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = ((minutes - hourStart * 60) / 60) * HOUR_HEIGHT;
  if (top < 0 || top > (HOUR_END - hourStart + 1) * HOUR_HEIGHT) return null;
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10"
      style={{ top }}
    >
      <div className="flex items-center">
        <span className="-ml-1 h-2 w-2 rounded-full bg-danger shadow-sm shadow-danger/30" />
        <span className="h-px flex-1 bg-danger" />
      </div>
    </div>
  );
}
