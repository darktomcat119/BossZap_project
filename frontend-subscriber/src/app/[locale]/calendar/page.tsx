"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events.service";
import type { CalendarEvent, EventStatus } from "@/lib/types";

// ── Status color maps ────────────────────────────────────────
const STATUS_DOT: Record<EventStatus, string> = {
  scheduled: "bg-info",
  completed: "bg-success",
  cancelled: "bg-text-muted",
};

const STATUS_BADGE: Record<EventStatus, string> = {
  scheduled: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  cancelled: "bg-text-muted/10 text-text-muted",
};

// ── Helpers ──────────────────────────────────────────────────
const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
] as const;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function monthRange(year: number, month: number) {
  const start = `${year}-${pad2(month + 1)}-01`;
  const end = `${year}-${pad2(month + 1)}-${pad2(daysInMonth(year, month))}`;
  return { start, end };
}

// ── Skeleton ─────────────────────────────────────────────────
function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mt-4 grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-background" />
        ))}
      </div>
    </div>
  );
}

// ── Event card ───────────────────────────────────────────────
function EventCard({
  event,
  t,
}: {
  event: CalendarEvent;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <li className="rounded-lg border border-border p-3">
      <span className="text-sm font-medium text-text-primary">
        {event.title}
      </span>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {event.event_time && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Clock className="h-3 w-3" />
            {event.event_time}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
        )}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            STATUS_BADGE[event.status],
          )}
        >
          {t(event.status)}
        </span>
      </div>
      {event.description && (
        <p className="mt-1.5 text-xs text-text-secondary line-clamp-2">
          {event.description}
        </p>
      )}
    </li>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function CalendarPage() {
  const t = useTranslations("calendar");
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  // Fetch events for the visible month
  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = monthRange(y, m);
      const res = await eventsService.getEvents({
        startDate: start,
        endDate: end,
        limit: 200,
      });
      if (res.success) {
        setEvents(res.data);
      } else {
        setError(res.error?.message ?? "Unknown error");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(year, month);
  }, [year, month, fetchEvents]);

  // Group events by date
  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const evt of events) {
      const d = evt.event_date.slice(0, 10); // YYYY-MM-DD
      if (!map[d]) map[d] = [];
      map[d].push(evt);
    }
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? eventsMap[selectedDate] ?? [] : [];

  // Navigation
  const prevMonth = () => {
    setSelectedDate(null);
    setShowPanel(false);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    setSelectedDate(null);
    setShowPanel(false);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const key = dateKey(year, month, day);
    setSelectedDate(key);
    setShowPanel(true);
  };

  const todayStr = dateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Build grid cells
  const first = firstDayOfMonth(year, month);
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  // ── Render event list (shared between desktop panel & mobile sheet)
  const renderEventList = () => (
    <>
      <h3 className="text-base font-semibold text-text-primary">
        {selectedDate
          ? t("eventsFor", { date: selectedDate })
          : t("selectDate")}
      </h3>
      {selectedDate && selectedEvents.length === 0 && (
        <p className="mt-4 text-sm text-text-muted">{t("noEvents")}</p>
      )}
      <ul className="mt-4 space-y-3">
        {selectedEvents.map((evt) => (
          <EventCard key={evt.id} event={evt} t={t} />
        ))}
      </ul>
    </>
  );

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        <p className="mt-2 text-xs text-text-muted md:hidden">
          {t("swipeHint")}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {t("errorLoading")}
            <button
              onClick={() => fetchEvents(year, month)}
              className="ml-2 underline"
            >
              {t("today")}
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* ── Calendar grid ──────────────────────────────── */}
          <div className="flex-1 rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold capitalize text-text-primary">
                {t(`months.${MONTH_KEYS[month]}`)} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_KEYS.map((key) => (
                <div
                  key={key}
                  className="py-2 text-xs font-medium text-text-muted"
                >
                  {t(`days.${key}`)}
                </div>
              ))}
            </div>

            {/* Days grid or skeleton */}
            {loading ? (
              <CalendarSkeleton />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div key={`empty-${idx}`} className="aspect-square" />
                    );
                  }

                  const key = dateKey(year, month, day);
                  const dayEvents = eventsMap[key] ?? [];
                  const isToday = key === todayStr;
                  const isSelected = key === selectedDate;

                  return (
                    <button
                      key={key}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                        isSelected
                          ? "bg-primary text-white"
                          : isToday
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-text-primary hover:bg-background",
                      )}
                    >
                      <span>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="mt-0.5 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((evt) => (
                            <span
                              key={evt.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isSelected
                                  ? "bg-white/80"
                                  : STATUS_DOT[evt.status],
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-info" />
                <span className="text-xs text-text-secondary">
                  {t("scheduled")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-xs text-text-secondary">
                  {t("completed")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-text-muted" />
                <span className="text-xs text-text-secondary">
                  {t("cancelled")}
                </span>
              </div>
            </div>
          </div>

          {/* ── Desktop side panel ─────────────────────────── */}
          <div className="hidden w-80 shrink-0 rounded-xl border border-border bg-surface p-5 shadow-sm lg:block">
            {renderEventList()}
          </div>
        </div>

        {/* ── Mobile bottom sheet ──────────────────────────── */}
        {showPanel && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setShowPanel(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-lg">
              <button
                onClick={() => setShowPanel(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-text-secondary hover:bg-background"
              >
                <X className="h-5 w-5" />
              </button>
              {renderEventList()}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
