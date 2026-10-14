import { type CalendarDate, fromEpochDay, toEpochDay } from './calendar-date';

/**
 * Time zones without hand-written offset tables.
 *
 * Every offset comes from `Intl.DateTimeFormat` (the browser's tz database). Nothing here
 * knows that New York is UTC-5 or when London changes its clocks.
 *
 * The one thing Intl cannot do is turn a wall-clock time ("09:00 on 8 March in New York")
 * back into an instant. `zonedToInstant` does that by asking Intl for the offsets around
 * that wall time, trying each one, and keeping only the candidates that Intl confirms
 * format back to the same wall time. See DECISIONS.md, "Time correctness".
 */

/** Milliseconds since the Unix epoch: an exact point in time, independent of zone. */
export type Instant = number;

export type WallTime = {
  date: CalendarDate;
  hour: number;
  minute: number;
  second?: number;
};

/**
 * What to do with wall times that do not exist (spring-forward gap) or exist twice
 * (fall-back overlap). Same names and meaning as Temporal's `disambiguation` option.
 *  - compatible: gap -> later, overlap -> earlier (what most calendars and Temporal default to)
 *  - earlier / later: always that side
 *  - reject: throw
 */
export type Disambiguation = 'compatible' | 'earlier' | 'later' | 'reject';

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Intl.DateTimeFormat construction is expensive; cache by locale and options. */
export function getFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/** Throws a RangeError for an identifier Intl does not know. */
export function assertTimeZone(timeZone: string): void {
  getFormatter('en-US', { timeZone });
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    assertTimeZone(timeZone);
    return true;
  } catch {
    return false;
  }
}

/**
 * The zone's UTC offset at an instant, in minutes (east positive), read from Intl's
 * `longOffset` name: "GMT+05:30", "GMT-04:00", or plain "GMT" for zero.
 */
export function getOffsetMinutes(instant: Instant, timeZone: string): number {
  const name = getFormatter('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((p) => p.type === 'timeZoneName')?.value;
  if (!name || name === 'GMT' || name === 'UTC') return 0;
  const m = /^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(name);
  if (!m) throw new Error(`Unrecognised offset name from Intl: ${name}`);
  const minutes = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === '-' ? -minutes : minutes;
}

/** "UTC+05:30", "UTC−04:00" (with a true minus sign), "UTC". */
export function formatOffset(minutes: number): string {
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

/** Wall-clock fields of an instant in a zone, read from Intl. */
export function instantToZoned(instant: Instant, timeZone: string): WallTime & { second: number } {
  // A fixed, parse-friendly locale: Gregorian calendar, Latin digits, 24-hour clock.
  const parts = getFormatter('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    era: 'short',
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const era = parts.find((p) => p.type === 'era')?.value;
  const year = era === 'BC' ? 1 - get('year') : get('year');

  return {
    date: { year, month: get('month'), day: get('day') },
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** The calendar date an instant falls on in a zone. */
export function instantToDate(instant: Instant, timeZone: string): CalendarDate {
  return instantToZoned(instant, timeZone).date;
}

/** Today's date in a zone. Pass `now` for deterministic tests and SSR. */
export function todayIn(timeZone: string, now: Instant = Date.now()): CalendarDate {
  return instantToDate(now, timeZone);
}

/**
 * The wall time read as if it were UTC. Not a real instant: only used as a starting
 * point that Intl-derived offsets are applied to.
 */
function wallAsUtc({ date, hour, minute, second = 0 }: WallTime): number {
  return toEpochDay(date) * MS_PER_DAY + ((hour * 60 + minute) * 60 + second) * 1000;
}

function sameWall(a: WallTime, b: WallTime): boolean {
  return (
    a.date.year === b.date.year &&
    a.date.month === b.date.month &&
    a.date.day === b.date.day &&
    a.hour === b.hour &&
    a.minute === b.minute &&
    (a.second ?? 0) === (b.second ?? 0)
  );
}

/**
 * All instants that display as `wall` in `timeZone`: one normally, two in a fall-back
 * overlap, none in a spring-forward gap.
 *
 * Offsets are read from Intl one day either side of the wall time. Real zones change
 * offset at most once in any 48 hours, so between them these two cover every candidate,
 * and each candidate is confirmed by formatting it back through Intl.
 */
export function possibleInstants(wall: WallTime, timeZone: string): Instant[] {
  const local = wallAsUtc(wall);
  const offsets = new Set([
    getOffsetMinutes(local - MS_PER_DAY, timeZone),
    getOffsetMinutes(local + MS_PER_DAY, timeZone),
  ]);
  const found = new Set<Instant>();
  for (const offset of offsets) {
    const candidate = local - offset * MS_PER_MINUTE;
    if (sameWall(instantToZoned(candidate, timeZone), wall)) found.add(candidate);
  }
  return [...found].sort((a, b) => a - b);
}

export class NonexistentTimeError extends RangeError {}
export class AmbiguousTimeError extends RangeError {}

/** The instant for a wall-clock time in a zone, resolving gaps and overlaps explicitly. */
export function zonedToInstant(
  wall: WallTime,
  timeZone: string,
  disambiguation: Disambiguation = 'compatible',
): Instant {
  const candidates = possibleInstants(wall, timeZone);

  if (candidates.length === 1) return candidates[0]!;

  if (candidates.length > 1) {
    if (disambiguation === 'reject')
      throw new AmbiguousTimeError(`${describe(wall)} happens twice in ${timeZone}.`);
    return disambiguation === 'later' ? candidates[candidates.length - 1]! : candidates[0]!;
  }

  // Gap: this wall time was skipped when the clocks went forward.
  if (disambiguation === 'reject')
    throw new NonexistentTimeError(`${describe(wall)} does not exist in ${timeZone}.`);
  const local = wallAsUtc(wall);
  const before = getOffsetMinutes(local - MS_PER_DAY, timeZone);
  const after = getOffsetMinutes(local + MS_PER_DAY, timeZone);
  // Reading the wall time with the pre-transition offset lands after the gap ("later");
  // with the post-transition offset it lands before it ("earlier").
  const later = local - before * MS_PER_MINUTE;
  const earlier = local - after * MS_PER_MINUTE;
  return disambiguation === 'earlier' ? earlier : later;
}

/** The instant a calendar day starts in a zone (usually 00:00; later if midnight is skipped). */
export function startOfDayInstant(date: CalendarDate, timeZone: string): Instant {
  return zonedToInstant({ date, hour: 0, minute: 0 }, timeZone, 'compatible');
}

/** Real length of a calendar day in a zone, in hours: 23, 24, 25, or 23.5 / 24.5 on Lord Howe. */
export function dayLengthHours(date: CalendarDate, timeZone: string): number {
  const next = fromEpochDay(toEpochDay(date) + 1);
  return (startOfDayInstant(next, timeZone) - startOfDayInstant(date, timeZone)) / 3_600_000;
}

function describe({ date, hour, minute }: WallTime): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.year}-${p(date.month)}-${p(date.day)} ${p(hour)}:${p(minute)}`;
}
