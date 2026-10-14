'use client';

import { useSyncExternalStore } from 'react';
import { type CalendarDate, addDays, toISODate, parseISODate } from './calendar-date';
import { startOfDayInstant, todayIn } from './zoned';

/**
 * Today's date in a zone, safe for server rendering.
 *
 * "Today" depends on when and where the page is viewed, so the server cannot know it. The
 * server snapshot is `null`; React hydrates with that same `null` and then switches to the
 * real date, so there is no hydration mismatch. A timer re-renders at the zone's next
 * midnight, so a page left open overnight moves its "today" marker.
 */
export function useToday(timeZone: string): CalendarDate | null {
  const iso = useSyncExternalStore(
    (onChange) => subscribeToMidnight(timeZone, onChange),
    () => toISODate(todayIn(timeZone)),
    () => null,
  );
  return iso ? parseISODate(iso) : null;
}

function subscribeToMidnight(timeZone: string, onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    const nextMidnight = startOfDayInstant(addDays(todayIn(timeZone), 1), timeZone);
    // Cap the wait so a sleeping laptop or clock change is noticed within the hour.
    const wait = Math.min(Math.max(nextMidnight - Date.now(), 1_000), 3_600_000);
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, wait);
  };
  schedule();
  return () => clearTimeout(timer);
}
