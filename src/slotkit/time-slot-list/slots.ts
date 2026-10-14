import type { CalendarDate } from '../time/calendar-date';
import { type HourCycle, formatTime, timeOptions } from '../time/format';
import { type Instant, getFormatter, possibleInstants } from '../time/zoned';

/*
 * Time slots as data. Pure functions only; the component lives in time-slot-list.tsx.
 */

export type TimeSlotStatus = 'available' | 'booked';

export type TimeSlot = {
  /** Stable identifier, submitted with the form. ISO instants work well. */
  value: string;
  /** When the slot starts. An instant, so it is correct in every zone. */
  start: Instant;
  status?: TimeSlotStatus;
};

export type WallClock = { hour: number; minute: number };

/**
 * Slots for one calendar day in a business's zone, stepping by wall-clock time
 * ("every 30 minutes from 09:00 to 17:00 in Europe/London").
 *
 * On DST days, wall times that do not exist are skipped (no 02:30 slot on the New York
 * spring-forward day), and wall times that happen twice get one slot, at the first
 * occurrence. A business that schedules "09:00" means one 09:00.
 */
export function createDaySlots({
  date,
  timeZone,
  from,
  to,
  stepMinutes,
  isBooked,
}: {
  date: CalendarDate;
  timeZone: string;
  from: WallClock;
  /** Exclusive: the last slot starts before this time. */
  to: WallClock;
  stepMinutes: number;
  isBooked?: (start: Instant) => boolean;
}): TimeSlot[] {
  if (stepMinutes <= 0) throw new RangeError('stepMinutes must be positive');
  const slots: TimeSlot[] = [];
  const end = to.hour * 60 + to.minute;
  for (let m = from.hour * 60 + from.minute; m < end; m += stepMinutes) {
    const [start] = possibleInstants({ date, hour: Math.floor(m / 60), minute: m % 60 }, timeZone);
    if (start === undefined) continue; // skipped by a spring-forward change
    slots.push({
      value: new Date(start).toISOString(),
      start,
      status: isBooked?.(start) ? 'booked' : 'available',
    });
  }
  return slots;
}

/**
 * Display labels for slots in a zone and hour cycle. When two slots would show the same
 * time (two 1:30s on a fall-back day), both get their zone abbreviation ("1:30 AM EDT",
 * "1:30 AM EST"), so the choice is never ambiguous.
 */
export function formatSlotLabels(
  slots: readonly TimeSlot[],
  locale: string,
  timeZone: string,
  hourCycle: HourCycle,
): string[] {
  const plain = slots.map((s) => formatTime(s.start, locale, timeZone, hourCycle));
  const counts = new Map<string, number>();
  for (const label of plain) counts.set(label, (counts.get(label) ?? 0) + 1);
  return plain.map((label, i) => {
    if ((counts.get(label) ?? 0) < 2) return label;
    return getFormatter(locale, {
      ...timeOptions(timeZone, hourCycle),
      timeZoneName: 'short',
    }).format(slots[i]!.start);
  });
}

/** Lowercased letters and digits only: "9:30 AM" -> "930am", "14:00" -> "1400". */
export function typeaheadKey(label: string): string {
  return label
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Typeahead over slot labels, like a native select:
 *  - typing builds a query ("1", "14", "143") matched against the start of each label
 *  - repeating one character ("1", "1", "1") cycles through matches
 *  - search starts after the current item and wraps
 * Returns the index to move to, or -1.
 */
export function findTypeaheadMatch(
  labels: readonly string[],
  query: string,
  currentIndex: number,
  isEnabled: (index: number) => boolean,
): number {
  const q = typeaheadKey(query);
  if (!q) return -1;
  const cycling = q.length > 1 && [...q].every((ch) => ch === q[0]);
  const needle = cycling ? q[0]! : q;
  const keys = labels.map(typeaheadKey);
  const n = labels.length;
  // A longer query refines the current match, so it may stay put; a new or cycling one moves on.
  const startOffset = q.length > 1 && !cycling ? 0 : 1;
  for (let step = 0; step < n; step++) {
    const i = (((currentIndex + startOffset + step) % n) + n) % n;
    if (isEnabled(i) && keys[i]!.startsWith(needle)) return i;
  }
  return -1;
}
