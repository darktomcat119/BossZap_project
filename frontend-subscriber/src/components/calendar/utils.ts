import type { CalendarEvent, EventStatus } from "@/lib/types";

export const WEEKDAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function dateKeyOf(date: Date): string {
  return dateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday-start week
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function rangeDates(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Convert "HH:mm[:ss]" → minutes since midnight. Returns null for empty/invalid.
 */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

/**
 * Format minutes-since-midnight back to "HH:mm".
 */
export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/**
 * Status palette. Each status maps to consistent dot / chip / block colors that
 * look right on the white surface. Uses theme tokens where possible.
 */
export const STATUS_PALETTE: Record<
  EventStatus,
  {
    dot: string;
    chip: string;
    block: string;
    blockBorder: string;
    blockText: string;
  }
> = {
  scheduled: {
    dot: "bg-info",
    chip: "bg-info/10 text-info",
    block: "bg-info/12",
    blockBorder: "border-l-info",
    blockText: "text-info",
  },
  completed: {
    dot: "bg-success",
    chip: "bg-success/10 text-success",
    block: "bg-success/12",
    blockBorder: "border-l-success",
    blockText: "text-success",
  },
  cancelled: {
    dot: "bg-text-muted",
    chip: "bg-text-muted/10 text-text-muted",
    block: "bg-text-muted/10",
    blockBorder: "border-l-text-muted",
    blockText: "text-text-muted",
  },
};

export function groupEventsByDate(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const evt of events) {
    const key = evt.event_date.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(evt);
  }
  // Sort each day chronologically (timed events first, by time)
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => {
      const ta = timeToMinutes(a.event_time);
      const tb = timeToMinutes(b.event_time);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return ta - tb;
    });
  }
  return map;
}

export type LayoutEvent = CalendarEvent & {
  startMin: number;
  endMin: number;
  column: number;
  columnsTotal: number;
};

const DEFAULT_DURATION_MIN = 60;

/**
 * Lay out timed events for a single day so overlapping ones share space side
 * by side. Returns each event annotated with its start/end (in minutes),
 * the column it should sit in, and how many concurrent columns exist at
 * that moment.
 *
 * Untimed events are excluded — render them in an "all-day" strip instead.
 */
export function layoutDayEvents(events: CalendarEvent[]): {
  timed: LayoutEvent[];
  allDay: CalendarEvent[];
} {
  const timed: LayoutEvent[] = [];
  const allDay: CalendarEvent[] = [];

  for (const evt of events) {
    const start = timeToMinutes(evt.event_time);
    if (start == null) {
      allDay.push(evt);
      continue;
    }
    timed.push({
      ...evt,
      startMin: start,
      endMin: Math.min(start + DEFAULT_DURATION_MIN, 24 * 60),
      column: 0,
      columnsTotal: 1,
    });
  }

  timed.sort((a, b) => a.startMin - b.startMin);

  // Sweep-line column assignment
  type Active = { evt: LayoutEvent; col: number };
  const active: Active[] = [];

  for (const evt of timed) {
    // Free columns whose events have ended
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].evt.endMin <= evt.startMin) active.splice(i, 1);
    }
    const usedCols = new Set(active.map((a) => a.col));
    let col = 0;
    while (usedCols.has(col)) col++;
    evt.column = col;
    active.push({ evt, col });
    const concurrent = active.length;
    for (const a of active) {
      a.evt.columnsTotal = Math.max(a.evt.columnsTotal, concurrent);
    }
  }

  return { timed, allDay };
}

/**
 * "Today", "Tomorrow", "Yesterday" or DD/MM/YYYY for distance > 1 day. Used
 * in the detail drawer header.
 */
export function relativeDayLabel(
  iso: string,
  now: Date = new Date(),
  labels: { today: string; tomorrow: string; yesterday: string },
): string {
  const target = new Date(iso + "T00:00:00");
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.tomorrow;
  if (diffDays === -1) return labels.yesterday;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
