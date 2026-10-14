import { createDate } from '@/slotkit/time/calendar-date';
import { instantToZoned } from '@/slotkit/time/zoned';
import { firstAvailableDate, hasAvailability, slotsForViewerDate } from './demo-availability';

// Wednesday 14 October 2026, 08:00 UTC.
const now = Date.parse('2026-10-14T08:00:00Z');

describe('homepage demo availability', () => {
  it('shows the Berlin working day in the viewer zone', () => {
    const slots = slotsForViewerDate(createDate(2026, 10, 15), 'Europe/Berlin', now);
    expect(instantToZoned(slots[0]!.start, 'Europe/Berlin')).toMatchObject({ hour: 9, minute: 0 });
    expect(slots).toHaveLength(16);
  });

  it('moves Berlin mornings onto the previous evening for Los Angeles', () => {
    // 09:00 Berlin on Friday 16 October is 00:00 Friday in LA; nothing on Saturday (host weekend).
    const thursday = slotsForViewerDate(createDate(2026, 10, 15), 'America/Los_Angeles', now);
    expect(
      thursday.every((s) => instantToZoned(s.start, 'America/Los_Angeles').date.day === 15),
    ).toBe(true);
    expect(hasAvailability(createDate(2026, 10, 17), 'America/Los_Angeles', now)).toBe(false);
  });

  it('respects minimum notice and skips weekends', () => {
    const today = slotsForViewerDate(createDate(2026, 10, 14), 'Europe/Berlin', now);
    expect(today.every((s) => s.start >= now + 2 * 3_600_000)).toBe(true);
    expect(hasAvailability(createDate(2026, 10, 18), 'Europe/Berlin', now)).toBe(false);
  });

  it('is deterministic, so the demo never flickers between renders', () => {
    const a = slotsForViewerDate(createDate(2026, 10, 20), 'Asia/Kolkata', now);
    const b = slotsForViewerDate(createDate(2026, 10, 20), 'Asia/Kolkata', now + 60_000);
    expect(a.map((s) => s.status)).toEqual(b.map((s) => s.status));
    expect(a.some((s) => s.status === 'booked')).toBe(true);
  });

  it('finds the first day with a free slot', () => {
    const saturday = createDate(2026, 10, 17);
    expect(firstAvailableDate(saturday, 'Europe/Berlin', now)).toEqual(createDate(2026, 10, 19));
  });
});
