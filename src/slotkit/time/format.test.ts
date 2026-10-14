import { createDate } from './calendar-date';
import {
  formatDayNumber,
  formatFullDate,
  formatMonthYear,
  formatRelativeDay,
  formatTime,
  getLocaleHourCycle,
  getMonthNames,
  getWeekdayNames,
  splitTimeZoneId,
} from './format';

/*
 * Exact strings come from the ICU data in this Node build. Assertions stick to text that is
 * stable across ICU versions (names, digits, order) rather than punctuation and spacing.
 */

describe('localized names', () => {
  it('orders weekday names from the locale week start', () => {
    expect(getWeekdayNames('en-US', 7, 'short').map((w) => w.label)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expect(getWeekdayNames('de-DE', 1, 'long').map((w) => w.label)).toEqual([
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ]);
    expect(getWeekdayNames('en-GB', 6).map((w) => w.iso)).toEqual([6, 7, 1, 2, 3, 4, 5]);
  });

  it('names months', () => {
    expect(getMonthNames('en-US')[2]).toBe('March');
    expect(getMonthNames('fr-FR')[2]).toBe('mars');
  });

  it('formats month headings and full dates without drifting a day', () => {
    expect(formatMonthYear(createDate(2026, 3, 8), 'en-US')).toBe('March 2026');
    expect(formatMonthYear(createDate(2026, 3, 8), 'de-DE')).toBe('März 2026');
    expect(formatFullDate(createDate(2026, 3, 8), 'en-US')).toBe('Sunday, March 8, 2026');
    expect(formatFullDate(createDate(2026, 1, 1), 'en-US')).toContain('January 1, 2026');
  });

  it('uses the locale digits', () => {
    expect(formatDayNumber(createDate(2026, 3, 8), 'ar-EG')).toBe('٨');
    expect(formatDayNumber(createDate(2026, 3, 8), 'en-US')).toBe('8');
  });
});

describe('relative days', () => {
  const today = createDate(2026, 10, 14);
  it('says today, tomorrow and in N days in the locale', () => {
    expect(formatRelativeDay(today, today, 'en-US')).toBe('today');
    expect(formatRelativeDay(createDate(2026, 10, 15), today, 'en-US')).toBe('tomorrow');
    expect(formatRelativeDay(createDate(2026, 10, 17), today, 'en-US')).toBe('in 3 days');
    expect(formatRelativeDay(createDate(2026, 10, 15), today, 'de-DE')).toBe('morgen');
  });
});

describe('time of day', () => {
  const nineThirtyInKolkata = Date.parse('2026-03-08T04:00:00Z');

  it('follows the locale hour cycle by default', () => {
    expect(getLocaleHourCycle('en-US')).toBe('h12');
    expect(getLocaleHourCycle('en-GB')).toBe('h23');
    expect(getLocaleHourCycle('de-DE')).toBe('h23');
  });

  it('formats in the requested zone and hour cycle', () => {
    expect(formatTime(nineThirtyInKolkata, 'en-US', 'Asia/Kolkata', 'h12')).toMatch(/^9:30\sAM$/);
    expect(formatTime(nineThirtyInKolkata, 'en-US', 'Asia/Kolkata', 'h23')).toBe('09:30');
    expect(formatTime(nineThirtyInKolkata, 'en-GB', 'America/New_York', 'h23')).toBe('23:00');
  });
});

describe('timezone ids', () => {
  it('splits city and region, including nested regions', () => {
    expect(splitTimeZoneId('America/Argentina/Buenos_Aires')).toEqual({
      city: 'Buenos Aires',
      region: 'America / Argentina',
    });
    expect(splitTimeZoneId('UTC')).toEqual({ city: 'UTC', region: '' });
  });
});
