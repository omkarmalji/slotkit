import { createDate } from './calendar-date';
import {
  AmbiguousTimeError,
  dayLengthHours,
  formatOffset,
  getOffsetMinutes,
  instantToDate,
  instantToZoned,
  isValidTimeZone,
  NonexistentTimeError,
  possibleInstants,
  zonedToInstant,
} from './zoned';

/*
 * Every expected value below was checked against the tz database shipped with Node's ICU
 * (ICU 77.1, tzdata 2025b) before being written down. Tests run with TZ=UTC so nothing
 * depends on the machine's own zone.
 */

const at = (iso: string) => Date.parse(iso);
const iso = (instant: number) => new Date(instant).toISOString().replace('.000', '');
const wall = (y: number, m: number, d: number, hour: number, minute = 0) => ({
  date: createDate(y, m, d),
  hour,
  minute,
});

describe('America/New_York', () => {
  const tz = 'America/New_York';

  describe('DST starts Sunday 8 March 2026 (02:00 EST -> 03:00 EDT)', () => {
    it('offset changes from -5h to -4h at 07:00 UTC', () => {
      expect(getOffsetMinutes(at('2026-03-08T06:59:59Z'), tz)).toBe(-300);
      expect(getOffsetMinutes(at('2026-03-08T07:00:00Z'), tz)).toBe(-240);
    });

    it('02:30 does not exist; compatible moves it forward to 03:30 EDT', () => {
      expect(possibleInstants(wall(2026, 3, 8, 2, 30), tz)).toEqual([]);
      expect(iso(zonedToInstant(wall(2026, 3, 8, 2, 30), tz))).toBe('2026-03-08T07:30:00Z');
      expect(instantToZoned(zonedToInstant(wall(2026, 3, 8, 2, 30), tz), tz)).toMatchObject({
        hour: 3,
        minute: 30,
      });
    });

    it('earlier and reject behave like Temporal', () => {
      expect(iso(zonedToInstant(wall(2026, 3, 8, 2, 30), tz, 'earlier'))).toBe(
        '2026-03-08T06:30:00Z',
      ); // 01:30 EST
      expect(() => zonedToInstant(wall(2026, 3, 8, 2, 30), tz, 'reject')).toThrow(
        NonexistentTimeError,
      );
    });

    it('times on either side resolve normally', () => {
      expect(iso(zonedToInstant(wall(2026, 3, 8, 1, 59), tz))).toBe('2026-03-08T06:59:00Z');
      expect(iso(zonedToInstant(wall(2026, 3, 8, 9, 0), tz))).toBe('2026-03-08T13:00:00Z');
    });

    it('the day is 23 hours long', () => {
      expect(dayLengthHours(createDate(2026, 3, 8), tz)).toBe(23);
    });
  });

  describe('DST ends Sunday 1 November 2026 (02:00 EDT -> 01:00 EST)', () => {
    it('offset changes from -4h to -5h at 06:00 UTC', () => {
      expect(getOffsetMinutes(at('2026-11-01T05:59:59Z'), tz)).toBe(-240);
      expect(getOffsetMinutes(at('2026-11-01T06:00:00Z'), tz)).toBe(-300);
    });

    it('01:30 happens twice; compatible picks the first (EDT)', () => {
      expect(possibleInstants(wall(2026, 11, 1, 1, 30), tz).map(iso)).toEqual([
        '2026-11-01T05:30:00Z',
        '2026-11-01T06:30:00Z',
      ]);
      expect(iso(zonedToInstant(wall(2026, 11, 1, 1, 30), tz))).toBe('2026-11-01T05:30:00Z');
      expect(iso(zonedToInstant(wall(2026, 11, 1, 1, 30), tz, 'later'))).toBe(
        '2026-11-01T06:30:00Z',
      );
      expect(() => zonedToInstant(wall(2026, 11, 1, 1, 30), tz, 'reject')).toThrow(
        AmbiguousTimeError,
      );
    });

    it('the day is 25 hours long', () => {
      expect(dayLengthHours(createDate(2026, 11, 1), tz)).toBe(25);
    });
  });
});

describe('Europe/London', () => {
  const tz = 'Europe/London';

  it('DST starts Sunday 29 March 2026: 01:00 GMT -> 02:00 BST, 01:30 is skipped', () => {
    expect(getOffsetMinutes(at('2026-03-29T00:59:59Z'), tz)).toBe(0);
    expect(getOffsetMinutes(at('2026-03-29T01:00:00Z'), tz)).toBe(60);
    expect(possibleInstants(wall(2026, 3, 29, 1, 30), tz)).toEqual([]);
    expect(iso(zonedToInstant(wall(2026, 3, 29, 1, 30), tz))).toBe('2026-03-29T01:30:00Z'); // 02:30 BST
    expect(dayLengthHours(createDate(2026, 3, 29), tz)).toBe(23);
  });

  it('DST ends Sunday 25 October 2026: 02:00 BST -> 01:00 GMT, 01:30 happens twice', () => {
    expect(getOffsetMinutes(at('2026-10-25T00:59:59Z'), tz)).toBe(60);
    expect(getOffsetMinutes(at('2026-10-25T01:00:00Z'), tz)).toBe(0);
    expect(possibleInstants(wall(2026, 10, 25, 1, 30), tz).map(iso)).toEqual([
      '2026-10-25T00:30:00Z',
      '2026-10-25T01:30:00Z',
    ]);
    expect(dayLengthHours(createDate(2026, 10, 25), tz)).toBe(25);
  });

  it('reads plain "GMT" (no digits) as a zero offset', () => {
    expect(getOffsetMinutes(at('2026-01-15T12:00:00Z'), tz)).toBe(0);
  });
});

describe('zones without DST, and with non-hour offsets', () => {
  it('Asia/Kolkata is +05:30 all year, with no gaps or repeats', () => {
    const tz = 'Asia/Kolkata';
    expect(getOffsetMinutes(at('2026-01-15T00:00:00Z'), tz)).toBe(330);
    expect(getOffsetMinutes(at('2026-07-15T00:00:00Z'), tz)).toBe(330);
    expect(formatOffset(330)).toBe('UTC+05:30');
    expect(iso(zonedToInstant(wall(2026, 3, 8, 9, 0), tz))).toBe('2026-03-08T03:30:00Z');
    expect(dayLengthHours(createDate(2026, 3, 8), tz)).toBe(24);
    expect(dayLengthHours(createDate(2026, 11, 1), tz)).toBe(24);
  });

  it('Asia/Kathmandu is +05:45', () => {
    const tz = 'Asia/Kathmandu';
    expect(getOffsetMinutes(at('2026-03-08T00:00:00Z'), tz)).toBe(345);
    expect(formatOffset(345)).toBe('UTC+05:45');
    expect(iso(zonedToInstant(wall(2026, 3, 8, 9, 0), tz))).toBe('2026-03-08T03:15:00Z');
  });

  it('formats negative offsets with a true minus sign', () => {
    expect(formatOffset(-240)).toBe('UTC−04:00');
    expect(formatOffset(0)).toBe('UTC');
  });
});

describe('Australia/Lord_Howe: a 30-minute DST shift', () => {
  const tz = 'Australia/Lord_Howe';

  it('DST starts Sunday 4 October 2026: 02:00 -> 02:30 (+10:30 -> +11:00)', () => {
    expect(getOffsetMinutes(at('2026-10-03T15:29:59Z'), tz)).toBe(630);
    expect(getOffsetMinutes(at('2026-10-03T15:30:00Z'), tz)).toBe(660);
    expect(possibleInstants(wall(2026, 10, 4, 2, 15), tz)).toEqual([]);
    // 02:15 is skipped; compatible moves it forward by the 30-minute gap, to 02:45.
    expect(instantToZoned(zonedToInstant(wall(2026, 10, 4, 2, 15), tz), tz)).toMatchObject({
      hour: 2,
      minute: 45,
    });
    expect(dayLengthHours(createDate(2026, 10, 4), tz)).toBe(23.5);
  });

  it('DST ends Sunday 5 April 2026: 02:00 -> 01:30 (+11:00 -> +10:30)', () => {
    expect(getOffsetMinutes(at('2026-04-04T14:59:59Z'), tz)).toBe(660);
    expect(getOffsetMinutes(at('2026-04-04T15:00:00Z'), tz)).toBe(630);
    // 01:45 happens twice, 30 minutes apart.
    expect(possibleInstants(wall(2026, 4, 5, 1, 45), tz).map(iso)).toEqual([
      '2026-04-04T14:45:00Z',
      '2026-04-04T15:15:00Z',
    ]);
    expect(dayLengthHours(createDate(2026, 4, 5), tz)).toBe(24.5);
  });
});

describe('the same instant on different calendar days', () => {
  const instant = at('2026-03-10T10:30:00Z');

  it('is 11 March in Kiritimati (+14), 10 March in UTC and 9 March in Pago Pago (-11)', () => {
    expect(instantToDate(instant, 'Pacific/Kiritimati')).toEqual(createDate(2026, 3, 11));
    expect(instantToDate(instant, 'UTC')).toEqual(createDate(2026, 3, 10));
    expect(instantToDate(instant, 'Pacific/Pago_Pago')).toEqual(createDate(2026, 3, 9));
  });

  it('a 09:00 slot in Kolkata on 9 March is still 8 March in Los Angeles', () => {
    const slot = zonedToInstant(wall(2026, 3, 9, 9, 0), 'Asia/Kolkata');
    expect(instantToDate(slot, 'America/Los_Angeles')).toEqual(createDate(2026, 3, 8));
    expect(instantToZoned(slot, 'America/Los_Angeles')).toMatchObject({ hour: 20, minute: 30 });
  });
});

describe('round trips', () => {
  it('every wall time that exists maps to an instant and back, across a whole DST day', () => {
    for (const tz of [
      'America/New_York',
      'Europe/London',
      'Australia/Lord_Howe',
      'Asia/Kathmandu',
    ]) {
      for (const date of [
        createDate(2026, 3, 8),
        createDate(2026, 3, 29),
        createDate(2026, 10, 4),
        createDate(2026, 11, 1),
      ]) {
        for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
          const w = { date, hour: Math.floor(minutes / 60), minute: minutes % 60 };
          for (const instant of possibleInstants(w, tz)) {
            expect(instantToZoned(instant, tz)).toMatchObject({
              date: w.date,
              hour: w.hour,
              minute: w.minute,
            });
          }
        }
      }
    }
  });
});

describe('validation', () => {
  it('accepts IANA zones and rejects garbage', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
  });
});
