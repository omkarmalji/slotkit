import { createDate as d } from '../time/calendar-date';
import { calendarKeyAction, type CalendarKeyOptions } from './calendar-keyboard';

const ltrSunday: CalendarKeyOptions = { firstDayOfWeek: 7, dir: 'ltr' };
const ltrMonday: CalendarKeyOptions = { firstDayOfWeek: 1, dir: 'ltr' };
const wed = d(2026, 10, 14); // Wednesday 14 October 2026

const moveTo = (key: string, opts = ltrSunday, from = wed, extra: object = {}) => {
  const action = calendarKeyAction(from, { key, ...extra }, opts);
  if (action.type !== 'move') throw new Error(`expected a move, got ${action.type}`);
  return action.date;
};

describe('calendar keyboard model', () => {
  it('arrows move by one day horizontally and one week vertically', () => {
    expect(moveTo('ArrowRight')).toEqual(d(2026, 10, 15));
    expect(moveTo('ArrowLeft')).toEqual(d(2026, 10, 13));
    expect(moveTo('ArrowDown')).toEqual(d(2026, 10, 21));
    expect(moveTo('ArrowUp')).toEqual(d(2026, 10, 7));
  });

  it('arrows cross month and year boundaries', () => {
    expect(moveTo('ArrowRight', ltrSunday, d(2026, 10, 31))).toEqual(d(2026, 11, 1));
    expect(moveTo('ArrowDown', ltrSunday, d(2026, 12, 29))).toEqual(d(2027, 1, 5));
  });

  it('in RTL, left and right are mirrored; up and down are not', () => {
    const rtl: CalendarKeyOptions = { firstDayOfWeek: 6, dir: 'rtl' };
    expect(moveTo('ArrowLeft', rtl)).toEqual(d(2026, 10, 15));
    expect(moveTo('ArrowRight', rtl)).toEqual(d(2026, 10, 13));
    expect(moveTo('ArrowDown', rtl)).toEqual(d(2026, 10, 21));
  });

  it('Home and End go to the start and end of the week, for the locale week start', () => {
    expect(moveTo('Home', ltrSunday)).toEqual(d(2026, 10, 11)); // Sunday
    expect(moveTo('End', ltrSunday)).toEqual(d(2026, 10, 17)); // Saturday
    expect(moveTo('Home', ltrMonday)).toEqual(d(2026, 10, 12)); // Monday
    expect(moveTo('End', ltrMonday)).toEqual(d(2026, 10, 18)); // Sunday
    expect(moveTo('Home', { firstDayOfWeek: 6, dir: 'rtl' })).toEqual(d(2026, 10, 10)); // Saturday
  });

  it('PageUp and PageDown change month, keeping the day where it exists', () => {
    expect(moveTo('PageDown')).toEqual(d(2026, 11, 14));
    expect(moveTo('PageUp')).toEqual(d(2026, 9, 14));
    expect(moveTo('PageDown', ltrSunday, d(2026, 1, 31))).toEqual(d(2026, 2, 28));
  });

  it('Shift + PageUp and Shift + PageDown change year', () => {
    expect(moveTo('PageDown', ltrSunday, wed, { shiftKey: true })).toEqual(d(2027, 10, 14));
    expect(moveTo('PageUp', ltrSunday, d(2028, 2, 29), { shiftKey: true })).toEqual(d(2027, 2, 28));
  });

  it('Enter and Space select', () => {
    expect(calendarKeyAction(wed, { key: 'Enter' }, ltrSunday)).toEqual({ type: 'select' });
    expect(calendarKeyAction(wed, { key: ' ' }, ltrSunday)).toEqual({ type: 'select' });
  });

  it('focus is clamped to min and max', () => {
    const bounded = { ...ltrSunday, min: d(2026, 10, 12), max: d(2026, 10, 20) };
    expect(moveTo('ArrowUp', bounded)).toEqual(d(2026, 10, 12));
    expect(moveTo('PageDown', bounded)).toEqual(d(2026, 10, 20));
    expect(moveTo('ArrowLeft', bounded, d(2026, 10, 12))).toEqual(d(2026, 10, 12));
  });

  it('ignores other keys and modified keys so browser and screen reader shortcuts still work', () => {
    expect(calendarKeyAction(wed, { key: 'a' }, ltrSunday)).toEqual({ type: 'none' });
    expect(calendarKeyAction(wed, { key: 'Escape' }, ltrSunday)).toEqual({ type: 'none' });
    expect(calendarKeyAction(wed, { key: 'ArrowRight', ctrlKey: true }, ltrSunday)).toEqual({
      type: 'none',
    });
    expect(calendarKeyAction(wed, { key: 'ArrowLeft', metaKey: true }, ltrSunday)).toEqual({
      type: 'none',
    });
    expect(calendarKeyAction(wed, { key: 'Home', altKey: true }, ltrSunday)).toEqual({
      type: 'none',
    });
  });
});
