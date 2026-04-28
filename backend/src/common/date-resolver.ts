import { addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export type DateLanguage = 'pt-BR' | 'es' | 'en';

// Accept either a bare YYYY-MM-DD or a full ISO timestamp; the time
// portion is silently dropped because we only care about the calendar
// date in the subscriber's local timezone.
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;

interface WeekdayMap {
  [token: string]: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

const WEEKDAYS: Record<DateLanguage, WeekdayMap> = {
  'pt-BR': {
    domingo: 0,
    dom: 0,
    segunda: 1,
    'segunda-feira': 1,
    seg: 1,
    terca: 2,
    'terca-feira': 2,
    ter: 2,
    quarta: 3,
    'quarta-feira': 3,
    qua: 3,
    quinta: 4,
    'quinta-feira': 4,
    qui: 4,
    sexta: 5,
    'sexta-feira': 5,
    sex: 5,
    sabado: 6,
    sab: 6,
  },
  es: {
    domingo: 0,
    dom: 0,
    lunes: 1,
    lun: 1,
    martes: 2,
    mar: 2,
    miercoles: 3,
    mie: 3,
    jueves: 4,
    jue: 4,
    viernes: 5,
    vie: 5,
    sabado: 6,
    sab: 6,
  },
  en: {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  },
};

const MONTHS: Record<DateLanguage, Record<string, number>> = {
  'pt-BR': {
    janeiro: 1, jan: 1,
    fevereiro: 2, fev: 2,
    marco: 3, mar: 3,
    abril: 4, abr: 4,
    maio: 5, mai: 5,
    junho: 6, jun: 6,
    julho: 7, jul: 7,
    agosto: 8, ago: 8,
    setembro: 9, set: 9,
    outubro: 10, out: 10,
    novembro: 11, nov: 11,
    dezembro: 12, dez: 12,
  },
  es: {
    enero: 1, ene: 1,
    febrero: 2, feb: 2,
    marzo: 3, mar: 3,
    abril: 4, abr: 4,
    mayo: 5, may: 5,
    junio: 6, jun: 6,
    julio: 7, jul: 7,
    agosto: 8, ago: 8,
    septiembre: 9, sep: 9, set: 9,
    octubre: 10, oct: 10,
    noviembre: 11, nov: 11,
    diciembre: 12, dic: 12,
  },
  en: {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12,
  },
};

const NEXT_WORDS = new Set([
  'proxima', 'proximo', 'pr',
  'siguiente', 'sig',
  'next',
]);

const RELATIVE_KEYWORDS: Record<
  DateLanguage,
  Record<string, number>
> = {
  'pt-BR': {
    hoje: 0,
    amanha: 1,
    'depois de amanha': 2,
    ontem: -1,
    anteontem: -2,
  },
  es: {
    hoy: 0,
    manana: 1,
    'pasado manana': 2,
    ayer: -1,
    anteayer: -2,
  },
  en: {
    today: 0,
    tomorrow: 1,
    'day after tomorrow': 2,
    yesterday: -1,
    'day before yesterday': -2,
  },
};

/**
 * Returns today's local date (YYYY-MM-DD) in the subscriber's timezone.
 */
export function todayInZone(tz: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(new Date(), tz || DEFAULT_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Returns today's day-of-week (0=Sunday..6=Saturday) in the subscriber's timezone.
 */
export function todayWeekdayInZone(tz: string = DEFAULT_TIMEZONE): number {
  const local = toZonedTime(new Date(), tz || DEFAULT_TIMEZONE);
  return local.getDay();
}

/**
 * Adds N days to an ISO date (YYYY-MM-DD). Returns ISO date.
 */
export function addDaysToIso(iso: string, days: number): string {
  const m = iso.match(ISO_DATE_RE);
  if (!m) return iso;
  const [, y, mo, d] = m;
  // Use UTC math so we never cross a DST boundary by accident — we are
  // operating on calendar dates, not instants.
  const date = new Date(Date.UTC(+y, +mo - 1, +d));
  const shifted = addDays(date, days);
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Strip diacritics ("ç" → "c", "ã" → "a") and lower-case for token matching.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[°ºª]/g, '')
    .trim();
}

/**
 * Resolve a free-form date string to an ISO date (YYYY-MM-DD) in the
 * subscriber's local timezone. Returns null if it cannot resolve safely.
 *
 * Handles:
 *   - ISO already (2026-04-28)
 *   - dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, dd/mm (current year), dd/mm/yy
 *   - "hoje" / "amanhã" / "depois de amanhã" / "ontem" (and es/en equivalents)
 *   - Weekday names with optional "próxima/proxima/next" prefix
 *   - "28 de abril", "28 abril", "April 28", "28 de abril de 2026"
 */
export function resolveDate(
  input: unknown,
  options: {
    timezone?: string;
    language?: string;
    now?: Date;
  } = {},
): string | null {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const tz = options.timezone || DEFAULT_TIMEZONE;
  const lang: DateLanguage =
    options.language === 'es' || options.language === 'en'
      ? options.language
      : 'pt-BR';

  // 1) Already ISO?
  const iso = raw.match(ISO_DATE_RE);
  if (iso) {
    if (isValidYmd(+iso[1], +iso[2], +iso[3])) {
      return `${iso[1]}-${iso[2]}-${iso[3]}`;
    }
    return null;
  }

  const norm = normalize(raw);
  const today = todayInZone(tz);

  // 2) Relative keywords (hoje, amanhã, ...)
  const rel = RELATIVE_KEYWORDS[lang][norm];
  if (rel !== undefined) {
    return addDaysToIso(today, rel);
  }
  // Cross-language fallback (a Brazilian who types "tomorrow" should still work)
  for (const langKey of ['pt-BR', 'es', 'en'] as DateLanguage[]) {
    const v = RELATIVE_KEYWORDS[langKey][norm];
    if (v !== undefined) return addDaysToIso(today, v);
  }

  // 3) Weekday (with optional "próxima/proxima/next" prefix)
  const tokens = norm.split(/\s+/);
  let nextHint = false;
  let weekdayToken: string | null = null;
  for (const t of tokens) {
    if (NEXT_WORDS.has(t)) {
      nextHint = true;
      continue;
    }
    weekdayToken = t;
  }
  if (weekdayToken) {
    const wd =
      WEEKDAYS[lang][weekdayToken] ??
      WEEKDAYS['pt-BR'][weekdayToken] ??
      WEEKDAYS['es'][weekdayToken] ??
      WEEKDAYS['en'][weekdayToken];
    if (wd !== undefined) {
      return resolveWeekday(today, todayWeekdayInZone(tz), wd, nextHint);
    }
  }

  // 4) Numeric formats: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy, dd/mm/yy, dd/mm
  const numeric = norm.match(
    /^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/,
  );
  if (numeric) {
    const day = +numeric[1];
    const month = +numeric[2];
    let year: number;
    if (numeric[3]) {
      year = +numeric[3];
      if (year < 100) year += 2000;
    } else {
      year = +today.slice(0, 4);
    }
    if (isValidYmd(year, month, day)) {
      return formatYmd(year, month, day);
    }
    return null;
  }

  // 5) Natural: "28 de abril", "28 abril", "abril 28", optional year
  // First try "<day> [de] <monthName> [de] <year?>"
  const dayMonth = norm.match(
    /^(\d{1,2})\s+(?:de\s+|of\s+)?([a-z]+)(?:\s+(?:de\s+|of\s+)?(\d{2,4}))?$/,
  );
  if (dayMonth) {
    const day = +dayMonth[1];
    const monthName = dayMonth[2];
    const month =
      MONTHS[lang][monthName] ??
      MONTHS['pt-BR'][monthName] ??
      MONTHS['es'][monthName] ??
      MONTHS['en'][monthName];
    if (month) {
      let year: number;
      if (dayMonth[3]) {
        year = +dayMonth[3];
        if (year < 100) year += 2000;
      } else {
        year = +today.slice(0, 4);
        // If the day already passed this year, roll to next year (only
        // for future-leaning intents — but we keep it neutral here so
        // the caller can choose to reject past dates).
      }
      if (isValidYmd(year, month, day)) return formatYmd(year, month, day);
    }
  }
  // Reverse: "<monthName> <day>"
  const monthDay = norm.match(/^([a-z]+)\s+(\d{1,2})(?:[,]?\s+(\d{2,4}))?$/);
  if (monthDay) {
    const monthName = monthDay[1];
    const day = +monthDay[2];
    const month =
      MONTHS[lang][monthName] ??
      MONTHS['pt-BR'][monthName] ??
      MONTHS['es'][monthName] ??
      MONTHS['en'][monthName];
    if (month) {
      let year: number;
      if (monthDay[3]) {
        year = +monthDay[3];
        if (year < 100) year += 2000;
      } else {
        year = +today.slice(0, 4);
      }
      if (isValidYmd(year, month, day)) return formatYmd(year, month, day);
    }
  }

  return null;
}

function resolveWeekday(
  todayIso: string,
  todayWd: number,
  targetWd: number,
  nextHint: boolean,
): string {
  let diff = (targetWd - todayWd + 7) % 7;
  if (diff === 0) {
    // Same weekday: if "next/próxima" was said, jump 7 days; otherwise
    // keep today (rare but consistent).
    diff = nextHint ? 7 : 0;
  } else if (nextHint && diff < 7) {
    // "próxima segunda" when today is Sunday should still be tomorrow
    // (the closest Monday). Only bump a full week when the user clearly
    // meant the one after the imminent one — we treat "próxima" as a
    // mild emphasis, not "skip a week", since that matches Brazilian
    // usage in conversation. Leave diff unchanged.
  }
  return addDaysToIso(todayIso, diff);
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Map preferred_language to a sensible default timezone. Used as a fallback
 * when the subscriber doesn't have a timezone set yet.
 */
export function defaultTimezoneForLanguage(language: string | undefined): string {
  if (language === 'es') return 'America/Buenos_Aires';
  if (language === 'en') return 'America/New_York';
  return DEFAULT_TIMEZONE;
}

/**
 * Build a short context string for the system prompt so GPT has accurate
 * "now" anchoring (date, day-of-week, timezone) and stops guessing.
 */
export function buildTodayContext(
  language: string,
  timezone: string,
): { iso: string; weekday: string; pretty: string } {
  const tz = timezone || defaultTimezoneForLanguage(language);
  const iso = todayInZone(tz);
  const weekday = formatInTimeZone(new Date(), tz, 'EEEE');
  const pretty = formatInTimeZone(new Date(), tz, 'dd/MM/yyyy');
  return { iso, weekday, pretty };
}
