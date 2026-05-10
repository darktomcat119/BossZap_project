"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  CalendarDays,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { eventsService } from "@/services/events.service";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import type { CalendarEvent, EventStatus } from "@/lib/types";
import {
  MONTH_KEYS,
  pad2,
  dateKey,
  dateKeyOf,
  startOfWeek,
  addDays,
  STATUS_PALETTE,
} from "@/components/calendar/utils";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import { EventModal } from "@/components/calendar/event-modal";
import { EventDetailDrawer } from "@/components/calendar/event-detail-drawer";

type ViewMode = "month" | "week" | "day";

const STATUS_FILTERS: (EventStatus | "all")[] = [
  "all",
  "scheduled",
  "completed",
  "cancelled",
];

function isoOf(d: Date) {
  return dateKeyOf(d);
}

function rangeForView(anchor: Date, view: ViewMode): { start: string; end: string } {
  if (view === "day") {
    const iso = isoOf(anchor);
    return { start: iso, end: iso };
  }
  if (view === "week") {
    const ws = startOfWeek(anchor);
    return { start: isoOf(ws), end: isoOf(addDays(ws, 6)) };
  }
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return {
    start: `${y}-${pad2(m + 1)}-01`,
    end: `${y}-${pad2(m + 1)}-${pad2(lastDay)}`,
  };
}

function formatHeaderLabel(
  anchor: Date,
  view: ViewMode,
  t: ReturnType<typeof useTranslations>,
): string {
  if (view === "month") {
    return `${t(`months.${MONTH_KEYS[anchor.getMonth()]}`)} ${anchor.getFullYear()}`;
  }
  if (view === "week") {
    const ws = startOfWeek(anchor);
    const we = addDays(ws, 6);
    const sameMonth = ws.getMonth() === we.getMonth();
    if (sameMonth) {
      return `${ws.getDate()} – ${we.getDate()} ${t(`months.${MONTH_KEYS[ws.getMonth()]}`)} ${ws.getFullYear()}`;
    }
    return `${ws.getDate()} ${t(`months.${MONTH_KEYS[ws.getMonth()]}`)} – ${we.getDate()} ${t(`months.${MONTH_KEYS[we.getMonth()]}`)} ${we.getFullYear()}`;
  }
  return `${pad2(anchor.getDate())} ${t(`months.${MONTH_KEYS[anchor.getMonth()]}`)} ${anchor.getFullYear()}`;
}

export default function CalendarPage() {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");

  const today = useMemo(() => new Date(), []);
  const todayIso = isoOf(today);

  // Anchor date drives what month/week/day is shown.
  const [anchor, setAnchor] = useState<Date>(today);
  const [view, setView] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [search, setSearch] = useState("");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editorEvent, setEditorEvent] = useState<CalendarEvent | undefined>();
  const [editorDate, setEditorDate] = useState<string>(todayIso);

  const [drawerEvent, setDrawerEvent] = useState<CalendarEvent | null>(null);

  // Mobile day-list panel for month-view (when user taps a day)
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end } = rangeForView(anchor, view);
    const res = await eventsService.getEvents({
      startDate: start,
      endDate: end,
      limit: 500,
    });
    if (res.success) {
      const raw = res.data as any;
      const list = Array.isArray(raw) ? raw : (raw?.data ?? raw?.events ?? []);
      setEvents(list as CalendarEvent[]);
    } else {
      setError(res.error?.message ?? t("errorLoading"));
    }
    setLoading(false);
  }, [anchor, view, t]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime: refresh on event creates from anywhere in the app
  useWebSocketEvent("event:created", () => {
    fetchEvents();
  });

  // Apply client-side search + status filter on top of the API window
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (q) {
        const hay = `${e.title} ${e.location ?? ""} ${e.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, search, statusFilter]);

  // ── Navigation ─────────────────────────────────────────────
  const goPrev = () => {
    if (view === "month") {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
    } else if (view === "week") {
      setAnchor(addDays(anchor, -7));
    } else {
      setAnchor(addDays(anchor, -1));
    }
  };
  const goNext = () => {
    if (view === "month") {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
    } else if (view === "week") {
      setAnchor(addDays(anchor, 7));
    } else {
      setAnchor(addDays(anchor, 1));
    }
  };
  const goToday = () => {
    setAnchor(new Date());
    setSelectedIso(todayIso);
  };

  // ── Editor & drawer wiring ─────────────────────────────────
  const openCreate = (iso?: string) => {
    setEditorEvent(undefined);
    setEditorDate(iso ?? selectedIso ?? todayIso);
    setShowEditor(true);
  };

  const openEdit = (evt: CalendarEvent) => {
    setEditorEvent(evt);
    setEditorDate(evt.event_date.slice(0, 10));
    setShowEditor(true);
    setDrawerEvent(null);
  };

  const onEventClick = (evt: CalendarEvent) => {
    setDrawerEvent(evt);
    setShowDaySheet(false);
  };

  const onMonthDayClick = (iso: string) => {
    setSelectedIso(iso);
    // On mobile, slide a sheet up; desktop already shows side panel.
    setShowDaySheet(true);
  };

  const onSavedEvent = (next?: CalendarEvent) => {
    fetchEvents();
    if (next) setDrawerEvent(next);
  };

  const onChangedEvent = (next?: CalendarEvent) => {
    fetchEvents();
    if (next) setDrawerEvent(next);
  };

  const onDeletedEvent = () => {
    setDrawerEvent(null);
    fetchEvents();
  };

  const headerLabel = formatHeaderLabel(anchor, view, t);

  // Day list for the month-view side panel / sheet
  const dayPanelEvents = useMemo(() => {
    if (!selectedIso) return [];
    return filteredEvents
      .filter((e) => e.event_date.slice(0, 10) === selectedIso)
      .sort((a, b) => (a.event_time ?? "").localeCompare(b.event_time ?? ""));
  }, [filteredEvents, selectedIso]);

  return (
    <>
      {showEditor && (
        <EventModal
          event={editorEvent}
          initialDate={editorDate}
          onClose={() => setShowEditor(false)}
          onSaved={onSavedEvent}
        />
      )}
      {drawerEvent && (
        <EventDetailDrawer
          event={drawerEvent}
          onClose={() => setDrawerEvent(null)}
          onEdit={() => openEdit(drawerEvent)}
          onChanged={onChangedEvent}
          onDeleted={onDeletedEvent}
        />
      )}

      <div className="p-4 md:p-6 lg:p-8">
        {/* Title + primary action */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
            {t("title")}
          </h1>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addEvent")}</span>
          </button>
        </div>

        {/* Toolbar: nav + view toggle + filters */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background"
              aria-label={tCommon("previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:bg-background"
              aria-label={tCommon("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-background"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {t("today")}
            </button>
            <h2 className="ml-1 truncate text-base font-semibold capitalize text-text-primary md:text-lg">
              {headerLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tCommon("search")}
                className="h-9 w-44 rounded-lg border border-border bg-surface pl-7 pr-7 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
                  aria-label={tCommon("close")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status filter chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            const palette = s === "all" ? null : STATUS_PALETTE[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-border text-text-secondary hover:bg-background",
                )}
              >
                {palette && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      active ? "bg-white/80" : palette.dot,
                    )}
                  />
                )}
                {s === "all" ? tCommon("all") : t(s)}
              </button>
            );
          })}
          {(search || statusFilter !== "all") && (
            <span className="ml-1 text-[11px] text-text-muted">
              {t("eventsCount", { n: filteredEvents.length })}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            <span>{t("errorLoading")}</span>
            <button
              onClick={fetchEvents}
              className="shrink-0 underline hover:no-underline"
            >
              {tCommon("retry")}
            </button>
          </div>
        )}

        {/* Main content area */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-xl border border-border bg-surface p-3 shadow-sm md:p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-text-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : view === "month" ? (
              <MonthView
                year={anchor.getFullYear()}
                month={anchor.getMonth()}
                events={filteredEvents}
                todayIso={todayIso}
                selectedIso={selectedIso}
                onDayClick={onMonthDayClick}
                onEventClick={onEventClick}
                onEmptyDayCreate={openCreate}
              />
            ) : view === "week" ? (
              <WeekView
                anchor={anchor}
                events={filteredEvents}
                todayIso={todayIso}
                onEventClick={onEventClick}
                onSlotClick={(iso, hour) => {
                  setEditorEvent(undefined);
                  setEditorDate(iso);
                  setShowEditor(true);
                  // hour is hint only; current modal doesn't pre-fill time
                  void hour;
                }}
              />
            ) : (
              <DayView
                date={anchor}
                events={filteredEvents}
                todayIso={todayIso}
                onEventClick={onEventClick}
                onSlotClick={(iso) => openCreate(iso)}
              />
            )}

            {/* Empty state for filtered results in current period */}
            {!loading && filteredEvents.length === 0 && view !== "day" && (
              <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/30 px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-text-primary">
                  {search || statusFilter !== "all"
                    ? t("emptyFiltered")
                    : t("emptyPeriod")}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {t("emptyHint")}
                </p>
                <button
                  onClick={() => openCreate()}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("addEvent")}
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
              {(["scheduled", "completed", "cancelled"] as EventStatus[]).map(
                (s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        STATUS_PALETTE[s].dot,
                      )}
                    />
                    <span className="text-[11px] text-text-secondary">
                      {t(s)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Desktop side panel — selected day list (only in month view) */}
          {view === "month" && (
            <div className="hidden w-80 shrink-0 rounded-xl border border-border bg-surface p-5 shadow-sm lg:block">
              <DayList
                iso={selectedIso}
                events={dayPanelEvents}
                onEventClick={onEventClick}
                onCreate={() => openCreate(selectedIso ?? todayIso)}
              />
            </div>
          )}
        </div>

        {/* Mobile bottom sheet — selected day list (month view only) */}
        {view === "month" && showDaySheet && (
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setShowDaySheet(false)}
              aria-hidden="true"
            />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[65vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-lg">
              <button
                onClick={() => setShowDaySheet(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-text-secondary hover:bg-background"
                aria-label={tCommon("close")}
              >
                <X className="h-5 w-5" />
              </button>
              <DayList
                iso={selectedIso}
                events={dayPanelEvents}
                onEventClick={onEventClick}
                onCreate={() => openCreate(selectedIso ?? todayIso)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── View toggle ───────────────────────────────────────────────
function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const t = useTranslations("calendar");
  const items: { id: ViewMode; label: string }[] = [
    { id: "month", label: t("monthView") },
    { id: "week", label: t("weekView") },
    { id: "day", label: t("dayView") },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === item.id
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Day list panel ────────────────────────────────────────────
function DayList({
  iso,
  events,
  onEventClick,
  onCreate,
}: {
  iso: string | null;
  events: CalendarEvent[];
  onEventClick: (e: CalendarEvent) => void;
  onCreate: () => void;
}) {
  const t = useTranslations("calendar");
  if (!iso) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-text-muted">
          <CalendarDays className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-text-secondary">
          {t("selectDate")}
        </p>
      </div>
    );
  }

  const [y, m, d] = iso.split("-");
  const headerDate = `${d}/${m}/${y}`;

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">
          {t("eventsFor", { date: headerDate })}
        </h3>
        <button
          onClick={onCreate}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-background hover:text-primary"
          aria-label={t("addEvent")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-text-muted">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-text-secondary">
            {t("noEvents")}
          </p>
          <button
            onClick={onCreate}
            className="mt-3 text-xs font-medium text-primary hover:text-primary-dark"
          >
            {t("addEvent")}
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((evt) => {
            const palette = STATUS_PALETTE[evt.status];
            return (
              <li key={evt.id}>
                <button
                  onClick={() => onEventClick(evt)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border-l-2 px-3 py-2 text-left transition-colors hover:bg-background/60",
                    palette.block,
                    palette.blockBorder,
                  )}
                >
                  {evt.event_time && (
                    <span className="mt-0.5 shrink-0 text-[11px] font-semibold text-text-secondary">
                      {evt.event_time.slice(0, 5)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium text-text-primary",
                        evt.status === "cancelled" && "line-through",
                      )}
                    >
                      {evt.title}
                    </span>
                    {evt.location && (
                      <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                        {evt.location}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
