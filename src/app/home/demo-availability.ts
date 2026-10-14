import {
  type CalendarDate,
  addDays,
  isSameDay,
  isoWeekday,
  toISODate,
} from '@/slotkit/time/calendar-date';
import { type Instant, instantToDate } from '@/slotkit/time/zoned';
import { createDaySlots, type TimeSlot } from '@/slotkit/time-slot-list/slots';

/*
 * Availability for the homepage demo: a host who works 09:00 to 17:00, Monday to Friday,
 * in Berlin, with 30-minute calls. Visitors see those hours in their own zone, so for
 * someone in Los Angeles a Berlin morning is the previous evening.
 */

export const HOST_ZONE = 'Europe/Berlin';
const MIN_NOTICE_MS = 2 * 3_600_000;

/** Deterministic "already booked" pattern, so the demo looks lived-in but never flickers. */
function isBooked(start: Instant): boolean {
  const n = Math.floor(start / 1_800_000);
  return (n * 2_654_435_761) % 97 < 30;
}

const cache = new Map<string, TimeSlot[]>();

/** Slots that fall on `date` in the viewer's zone, from any host day that overlaps it. */
export function slotsForViewerDate(
  date: CalendarDate,
  viewerZone: string,
  now: Instant,
): TimeSlot[] {
  const hourBucket = Math.floor(now / 3_600_000);
  const key = `${toISODate(date)}|${viewerZone}|${hourBucket}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const slots: TimeSlot[] = [];
  for (const hostDay of [addDays(date, -1), date, addDays(date, 1)]) {
    if (isoWeekday(hostDay) >= 6) continue;
    for (const slot of createDaySlots({
      date: hostDay,
      timeZone: HOST_ZONE,
      from: { hour: 9, minute: 0 },
      to: { hour: 17, minute: 0 },
      stepMinutes: 30,
    })) {
      if (!isSameDay(instantToDate(slot.start, viewerZone), date)) continue;
      if (slot.start < now + MIN_NOTICE_MS) continue;
      slots.push({ ...slot, status: isBooked(slot.start) ? 'booked' : 'available' });
    }
  }
  slots.sort((a, b) => a.start - b.start);
  cache.set(key, slots);
  return slots;
}

export function hasAvailability(date: CalendarDate, viewerZone: string, now: Instant): boolean {
  return slotsForViewerDate(date, viewerZone, now).some((s) => s.status !== 'booked');
}

/** The first day from `today` on that still has a free slot. */
export function firstAvailableDate(
  today: CalendarDate,
  viewerZone: string,
  now: Instant,
): CalendarDate {
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, i);
    if (hasAvailability(d, viewerZone, now)) return d;
  }
  return today;
}
