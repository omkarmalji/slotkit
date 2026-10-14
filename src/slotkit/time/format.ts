import {
  type CalendarDate,
  type IsoWeekday,
  addDays,
  daysBetween,
  toEpochDay,
} from './calendar-date';
import { type Instant, getFormatter } from './zoned';

/**
 * Locale-aware labels, all from Intl. CalendarDates are formatted at noon UTC with
 * `timeZone: 'UTC'`, so the label can never drift to a neighbouring day.
 */

function dateAsUtcNoon(date: CalendarDate): Date {
  return new Date(toEpochDay(date) * 86_400_000 + 12 * 3_600_000);
}

export function formatDate(
  date: CalendarDate,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'long' },
): string {
  return getFormatter(locale, { ...options, timeZone: 'UTC' }).format(dateAsUtcNoon(date));
}

/** "March 2026", "März 2026", "2026年3月". */
export function formatMonthYear(date: CalendarDate, locale: string): string {
  return formatDate(date, locale, { month: 'long', year: 'numeric' });
}

/** Full, unambiguous label for screen readers: "Sunday, March 8, 2026". */
export function formatFullDate(date: CalendarDate, locale: string): string {
  return formatDate(date, locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** The day-of-month number in the locale's digits ("8", "٨"). */
export function formatDayNumber(date: CalendarDate, locale: string): string {
  return formatDate(date, locale, { day: 'numeric' });
}

/** 2026-01-05 was a Monday; used as a reference week for weekday names. */
const REFERENCE_MONDAY: CalendarDate = { year: 2026, month: 1, day: 5 };

/** Weekday names in display order for a week starting on `firstDay`. */
export function getWeekdayNames(
  locale: string,
  firstDay: IsoWeekday,
  width: 'narrow' | 'short' | 'long' = 'short',
): { iso: IsoWeekday; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = (((firstDay - 1 + i) % 7) + 1) as IsoWeekday;
    const date = addDays(REFERENCE_MONDAY, iso - 1);
    return { iso, label: formatDate(date, locale, { weekday: width }) };
  });
}

export function getMonthNames(locale: string, width: 'short' | 'long' = 'long'): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    formatDate({ year: 2026, month: i + 1, day: 1 }, locale, { month: width }),
  );
}

/** "today", "tomorrow", "in 3 days", "yesterday", in the locale's words. */
export function formatRelativeDay(date: CalendarDate, today: CalendarDate, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(daysBetween(today, date), 'day');
}

export type HourCycle = 'h12' | 'h23';

/** The hour cycle a locale prefers, from Intl ('h11' and 'h24' are folded into their usual pair). */
export function getLocaleHourCycle(locale: string): HourCycle {
  const resolved = getFormatter(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
  return resolved === 'h11' || resolved === 'h12' ? 'h12' : 'h23';
}

/**
 * Options for a time of day. 24-hour times always get two-digit hours ("03:30"): ICU pads
 * them for some locales and not others, and padded times line up in a column.
 */
export function timeOptions(timeZone: string, hourCycle?: HourCycle): Intl.DateTimeFormatOptions {
  return {
    timeZone,
    hour: hourCycle === 'h23' ? '2-digit' : 'numeric',
    minute: '2-digit',
    ...(hourCycle ? { hourCycle } : {}),
  };
}

/** A time of day at an instant, in a zone: "9:30 AM", "09:30", "٩:٣٠ ص". */
export function formatTime(
  instant: Instant,
  locale: string,
  timeZone: string,
  hourCycle?: HourCycle,
): string {
  return getFormatter(locale, timeOptions(timeZone, hourCycle)).format(instant);
}

/** The zone's localized generic name: "Eastern Time", "India Standard Time". */
export function getTimeZoneName(
  timeZone: string,
  locale: string,
  instant: Instant = Date.now(),
): string {
  const parts = getFormatter(locale, { timeZone, timeZoneName: 'longGeneric' }).formatToParts(
    instant,
  );
  return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
}

/**
 * City and region from an IANA identifier: "America/Argentina/Buenos_Aires" ->
 * { city: "Buenos Aires", region: "America / Argentina" }.
 */
export function splitTimeZoneId(timeZone: string): { city: string; region: string } {
  const segments = timeZone.split('/');
  const city = (segments.pop() ?? timeZone).replace(/_/g, ' ');
  return { city, region: segments.map((s) => s.replace(/_/g, ' ')).join(' / ') };
}
