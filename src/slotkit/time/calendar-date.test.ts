import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  compareDates,
  createDate,
  daysBetween,
  daysInMonth,
  endOfWeek,
  isoWeekday,
  isWithinRange,
  parseISODate,
  startOfWeek,
  toISODate,
} from './calendar-date';

const d = createDate;

describe('CalendarDate', () => {
  it('rejects impossible dates', () => {
    expect(() => d(2026, 2, 29)).toThrow(RangeError);
    expect(() => d(2026, 13, 1)).toThrow(RangeError);
    expect(d(2028, 2, 29)).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('round-trips the ISO form used for form values', () => {
    expect(toISODate(d(2026, 3, 8))).toBe('2026-03-08');
    expect(parseISODate('2026-03-08')).toEqual(d(2026, 3, 8));
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('8 March 2026')).toBeNull();
  });

  it('does not map years 0 to 99 into the 1900s (a Date.UTC pitfall)', () => {
    expect(toISODate(addDays(d(50, 1, 1), 1))).toBe('0050-01-02');
  });

  it('knows month lengths, including leap years', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('adds days across month and year ends', () => {
    expect(addDays(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
    expect(addDays(d(2026, 3, 1), -1)).toEqual(d(2026, 2, 28));
  });

  it('adds exactly one calendar day across DST changes (no 23- or 25-hour drift)', () => {
    // 8 March and 1 November 2026 are DST changes in New York; the date math does not care.
    expect(addDays(d(2026, 3, 7), 1)).toEqual(d(2026, 3, 8));
    expect(addDays(d(2026, 3, 8), 1)).toEqual(d(2026, 3, 9));
    expect(addDays(d(2026, 10, 31), 2)).toEqual(d(2026, 11, 2));
  });

  it('clamps the day when adding months, and rolls the year', () => {
    expect(addMonths(d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28));
    expect(addMonths(d(2028, 1, 31), 1)).toEqual(d(2028, 2, 29));
    expect(addMonths(d(2026, 11, 15), 3)).toEqual(d(2027, 2, 15));
    expect(addMonths(d(2026, 1, 15), -1)).toEqual(d(2025, 12, 15));
    expect(addYears(d(2028, 2, 29), 1)).toEqual(d(2029, 2, 28));
  });

  it('computes ISO weekdays', () => {
    expect(isoWeekday(d(2026, 3, 8))).toBe(7); // Sunday
    expect(isoWeekday(d(2026, 10, 14))).toBe(3); // Wednesday
    expect(isoWeekday(d(1970, 1, 1))).toBe(4); // Thursday
    expect(isoWeekday(d(1969, 12, 29))).toBe(1); // Monday, before the epoch
  });

  it('finds week boundaries for any week start', () => {
    const wed = d(2026, 10, 14);
    expect(startOfWeek(wed, 1)).toEqual(d(2026, 10, 12)); // Monday start
    expect(startOfWeek(wed, 7)).toEqual(d(2026, 10, 11)); // Sunday start
    expect(startOfWeek(wed, 6)).toEqual(d(2026, 10, 10)); // Saturday start
    expect(endOfWeek(wed, 7)).toEqual(d(2026, 10, 17));
    expect(startOfWeek(d(2026, 10, 11), 7)).toEqual(d(2026, 10, 11)); // already the first day
  });

  it('compares, clamps and measures ranges', () => {
    expect(compareDates(d(2026, 3, 8), d(2026, 3, 9))).toBeLessThan(0);
    expect(daysBetween(d(2026, 1, 1), d(2027, 1, 1))).toBe(365);
    expect(clampDate(d(2026, 1, 1), d(2026, 2, 1), d(2026, 3, 1))).toEqual(d(2026, 2, 1));
    expect(clampDate(d(2026, 5, 1), null, d(2026, 3, 1))).toEqual(d(2026, 3, 1));
    expect(isWithinRange(d(2026, 3, 1), d(2026, 3, 1), d(2026, 3, 1))).toBe(true);
    expect(isWithinRange(d(2026, 3, 2), undefined, d(2026, 3, 1))).toBe(false);
  });
});
