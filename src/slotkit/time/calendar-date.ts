/**
 * CalendarDate: a day on the calendar, with no time and no time zone.
 *
 * A booking UI mostly reasons about *days* ("is the 8th available?"), and a JavaScript
 * `Date` is the wrong tool for that: it is an instant, so "the 8th" shifts depending on the
 * zone it is read in, and adding 24 hours across a DST change lands on the wrong day.
 *
 * Here a day is three integers. Arithmetic runs on a day count computed in UTC, which has
 * no DST, so adding one day always moves exactly one calendar day.
 */
export type CalendarDate = {
  readonly year: number;
  /** 1 to 12. */
  readonly month: number;
  /** 1 to 31. */
  readonly day: number;
};

/** ISO weekday: 1 = Monday ... 7 = Sunday. Matches `Intl.Locale` week info. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const MS_PER_DAY = 86_400_000;

/**
 * Days since 1970-01-01. Uses setUTCFullYear rather than Date.UTC, because Date.UTC maps
 * years 0 to 99 to 1900 to 1999.
 */
export function toEpochDay({ year, month, day }: CalendarDate): number {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  return Math.floor(d.getTime() / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): CalendarDate {
  const d = new Date(epochDay * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function daysInMonth(year: number, month: number): number {
  return fromEpochDay(toEpochDay({ year, month: month + 1, day: 1 }) - 1).day;
}

export function isValidDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

export function createDate(year: number, month: number, day: number): CalendarDate {
  if (!isValidDate(year, month, day)) {
    throw new RangeError(`Invalid calendar date: ${year}-${month}-${day}`);
  }
  return { year, month, day };
}

/** Parses `YYYY-MM-DD`, the format used for form values. Returns null for anything else. */
export function parseISODate(value: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return isValidDate(year, month, day) ? { year, month, day } : null;
}

export function toISODate({ year, month, day }: CalendarDate): string {
  const pad = (n: number, w: number) => String(n).padStart(w, '0');
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/**
 * Moves by whole months, clamping the day to the target month's length:
 * 31 January + 1 month is 28 February (or 29 in a leap year), never 3 March.
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

export function addYears(date: CalendarDate, years: number): CalendarDate {
  return addMonths(date, years * 12);
}

export function startOfMonth(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: 1 };
}

export function endOfMonth(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) };
}

/** Negative if a is before b, 0 if the same day, positive if after. */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

export function isSameDay(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function isSameMonth(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month;
}

export function isBefore(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) < 0;
}

export function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) > 0;
}

export function minDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return isBefore(a, b) ? a : b;
}

export function maxDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return isAfter(a, b) ? a : b;
}

/** Clamps into [min, max]; either bound may be omitted. */
export function clampDate(
  date: CalendarDate,
  min?: CalendarDate | null,
  max?: CalendarDate | null,
): CalendarDate {
  let out = date;
  if (min && isBefore(out, min)) out = min;
  if (max && isAfter(out, max)) out = max;
  return out;
}

export function isWithinRange(
  date: CalendarDate,
  min?: CalendarDate | null,
  max?: CalendarDate | null,
): boolean {
  return !(min && isBefore(date, min)) && !(max && isAfter(date, max));
}

export function isoWeekday(date: CalendarDate): IsoWeekday {
  // 1970-01-01 was a Thursday (ISO 4).
  return (((((toEpochDay(date) + 3) % 7) + 7) % 7) + 1) as IsoWeekday;
}

/** The first day of the week containing `date`, for a week that starts on `firstDay`. */
export function startOfWeek(date: CalendarDate, firstDay: IsoWeekday): CalendarDate {
  const back = (isoWeekday(date) - firstDay + 7) % 7;
  return addDays(date, -back);
}

export function endOfWeek(date: CalendarDate, firstDay: IsoWeekday): CalendarDate {
  return addDays(startOfWeek(date, firstDay), 6);
}

/** Whole days from a to b (positive if b is later). */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  return toEpochDay(b) - toEpochDay(a);
}
