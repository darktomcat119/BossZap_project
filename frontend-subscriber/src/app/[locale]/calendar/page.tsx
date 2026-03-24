"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock events ────────────────────────────────────────────
type CalendarEvent = {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  status: "scheduled" | "completed" | "cancelled";
};

const mockEvents: CalendarEvent[] = [
  { id: 1, title: "Client meeting - Silva Corp", date: "2026-03-25", time: "10:00", status: "scheduled" },
  { id: 2, title: "Invoice due - Project Alpha", date: "2026-03-26", time: "12:00", status: "scheduled" },
  { id: 3, title: "Tax payment deadline", date: "2026-03-28", time: "18:00", status: "scheduled" },
  { id: 4, title: "Service delivery - Maria Santos", date: "2026-03-30", time: "14:00", status: "scheduled" },
  { id: 5, title: "Monthly report review", date: "2026-03-31", time: "09:00", status: "scheduled" },
  { id: 6, title: "Website launch - Bakery", date: "2026-03-10", time: "15:00", status: "completed" },
  { id: 7, title: "Logo delivery", date: "2026-03-08", time: "11:00", status: "completed" },
  { id: 8, title: "Cancelled consultation", date: "2026-03-12", time: "16:00", status: "cancelled" },
  { id: 9, title: "Design review", date: "2026-03-25", time: "14:00", status: "scheduled" },
  { id: 10, title: "Quarterly planning", date: "2026-04-02", time: "09:00", status: "scheduled" },
];

const STATUS_DOT_COLORS: Record<string, string> = {
  scheduled: "bg-info",
  completed: "bg-success",
  cancelled: "bg-text-muted",
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  scheduled: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  cancelled: "bg-text-muted/10 text-text-muted",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  const eventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    mockEvents.forEach((evt) => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, []);

  const selectedEvents = selectedDate ? eventsMap[selectedDate] || [] : [];

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
    setShowPanel(false);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
    setShowPanel(false);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setShowPanel(true);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          {t("title")}
        </h1>

        {/* Mobile: swipe hint */}
        <p className="mt-2 text-xs text-text-muted md:hidden">
          {t("swipeHint")}
        </p>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Calendar grid */}
          <div className="flex-1 rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold capitalize text-text-primary">
                {monthName} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-xs font-medium text-text-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsMap[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-white"
                        : isToday
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-text-primary hover:bg-background"
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
                              isSelected ? "bg-white/80" : STATUS_DOT_COLORS[evt.status]
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-info" />
                <span className="text-xs text-text-secondary">{t("scheduled")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-xs text-text-secondary">{t("completed")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-text-muted" />
                <span className="text-xs text-text-secondary">{t("cancelled")}</span>
              </div>
            </div>
          </div>

          {/* Desktop side panel */}
          <div className="hidden w-80 shrink-0 rounded-xl border border-border bg-surface p-5 shadow-sm lg:block">
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
                <li
                  key={evt.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {evt.title}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-text-muted">{evt.time}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_BADGE_COLORS[evt.status]
                      )}
                    >
                      {t(evt.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile bottom sheet */}
        {showPanel && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setShowPanel(false)}
              aria-hidden="true"
            />
            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">
                  {selectedDate
                    ? t("eventsFor", { date: selectedDate })
                    : t("selectDate")}
                </h3>
                <button
                  onClick={() => setShowPanel(false)}
                  className="rounded-lg p-1.5 text-text-secondary hover:bg-background"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {selectedEvents.length === 0 && (
                <p className="mt-4 text-sm text-text-muted">{t("noEvents")}</p>
              )}
              <ul className="mt-4 space-y-3">
                {selectedEvents.map((evt) => (
                  <li
                    key={evt.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <span className="text-sm font-medium text-text-primary">
                      {evt.title}
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-text-muted">{evt.time}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_BADGE_COLORS[evt.status]
                        )}
                      >
                        {t(evt.status)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
