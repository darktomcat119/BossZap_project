"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";
import {
  WEEKDAY_KEYS,
  MONTH_KEYS,
  rangeDates,
  startOfWeek,
  dateKeyOf,
  groupEventsByDate,
  layoutDayEvents,
  STATUS_PALETTE,
} from "./utils";

const HOUR_START = 6; // 06:00
const HOUR_END = 22; // 22:00 (last hour shown)
const HOUR_HEIGHT = 56; // px

type Props = {
  anchor: Date;
  events: CalendarEvent[];
  todayIso: string;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (iso: string, hour?: number) => void;
};

export function WeekView({
  anchor,
  events,
  todayIso,
  onEventClick,
  onSlotClick,
}: Props) {
  const t = useTranslations("calendar");
  const start = startOfWeek(anchor);
  const days = rangeDates(start, 7);
  const eventsMap = groupEventsByDate(events);
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i,
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Header row */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
          <div />
          {days.map((d) => {
            const iso = dateKeyOf(d);
            const isToday = iso === todayIso;
            return (
              <button
                key={iso}
                onClick={() => onSlotClick(iso)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-center transition-colors hover:bg-background/60",
                  isToday && "bg-primary/5",
                )}
              >
                <span className="text-[11px] font-medium uppercase text-text-muted">
                  {t(`days.${WEEKDAY_KEYS[d.getDay()]}`)}
                </span>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    isToday
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "text-text-primary",
                  )}
                >
                  {d.getDate()}
                </span>
                <span className="text-[10px] text-text-muted">
                  {t(`months.${MONTH_KEYS[d.getMonth()]}`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* All-day strip */}
        <AllDayRow
          days={days}
          eventsMap={eventsMap}
          onEventClick={onEventClick}
        />

        {/* Hourly grid */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)]">
          {/* Hour labels column */}
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

          {days.map((d) => {
            const iso = dateKeyOf(d);
            const isToday = iso === todayIso;
            const dayEvents = eventsMap[iso] ?? [];
            const { timed } = layoutDayEvents(dayEvents);

            return (
              <div
                key={iso}
                className={cn(
                  "relative border-l border-border/60",
                  isToday && "bg-primary/5",
                )}
                style={{ height: HOUR_HEIGHT * hours.length }}
              >
                {/* Hour click rows */}
                {hours.map((h) => (
                  <button
                    key={h}
                    onClick={() => onSlotClick(iso, h)}
                    className="block w-full border-t border-border/60 transition-colors hover:bg-primary/5"
                    style={{ height: HOUR_HEIGHT }}
                    aria-label={`${iso} ${h}:00`}
                  />
                ))}

                {timed.map((evt) => {
                  const palette = STATUS_PALETTE[evt.status];
                  const top =
                    ((evt.startMin - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    24,
                    ((evt.endMin - evt.startMin) / 60) * HOUR_HEIGHT - 2,
                  );
                  const widthPct = 100 / evt.columnsTotal;
                  const leftPct = widthPct * evt.column;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick(evt)}
                      className={cn(
                        "absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md",
                        palette.block,
                        palette.blockBorder,
                        palette.blockText,
                        evt.status === "cancelled" && "line-through",
                      )}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                      title={evt.title}
                    >
                      <div className="truncate font-medium">{evt.title}</div>
                      {evt.event_time && (
                        <div className="truncate opacity-75">
                          {evt.event_time.slice(0, 5)}
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Now-line */}
                {isToday && <NowLine hourStart={HOUR_START} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AllDayRow({
  days,
  eventsMap,
  onEventClick,
}: {
  days: Date[];
  eventsMap: Record<string, CalendarEvent[]>;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const t = useTranslations("calendar");
  const hasAny = days.some((d) =>
    (eventsMap[dateKeyOf(d)] ?? []).some((e) => !e.event_time),
  );
  if (!hasAny) return null;

  return (
    <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border bg-background/40">
      <div className="px-2 py-1 text-right text-[10px] uppercase text-text-muted">
        {t("allDay")}
      </div>
      {days.map((d) => {
        const iso = dateKeyOf(d);
        const allDay = (eventsMap[iso] ?? []).filter((e) => !e.event_time);
        return (
          <div
            key={iso}
            className="flex flex-col gap-0.5 border-l border-border/60 p-1"
          >
            {allDay.map((evt) => {
              const palette = STATUS_PALETTE[evt.status];
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className={cn(
                    "truncate rounded border-l-2 px-1.5 py-0.5 text-left text-[11px] font-medium",
                    palette.block,
                    palette.blockBorder,
                    palette.blockText,
                    evt.status === "cancelled" && "line-through",
                  )}
                  title={evt.title}
                >
                  {evt.title}
                </button>
              );
            })}
          </div>
        );
      })}
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
