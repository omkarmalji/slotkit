import {
  type CalendarDate,
  type IsoWeekday,
  addDays,
  addMonths,
  addYears,
  clampDate,
  endOfWeek,
  startOfWeek,
} from '../time/calendar-date';

/**
 * The calendar's keyboard model as a pure function: given the focused date and a key,
 * where does focus go? No React, no DOM, so every key is unit tested on its own.
 */

export type CalendarKeyAction =
  { type: 'move'; date: CalendarDate } | { type: 'select' } | { type: 'none' };

export type CalendarKeyOptions = {
  firstDayOfWeek: IsoWeekday;
  /** In RTL, ArrowLeft moves to the next day, because the grid is mirrored. */
  dir: 'ltr' | 'rtl';
  min?: CalendarDate | null | undefined;
  max?: CalendarDate | null | undefined;
};

export type KeyInput = {
  key: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
};

export function calendarKeyAction(
  focused: CalendarDate,
  input: KeyInput,
  { firstDayOfWeek, dir, min, max }: CalendarKeyOptions,
): CalendarKeyAction {
  // Leave browser and assistive-tech shortcuts alone.
  if (input.altKey || input.ctrlKey || input.metaKey) return { type: 'none' };

  const inline = dir === 'rtl' ? -1 : 1;
  let next: CalendarDate | null = null;

  switch (input.key) {
    case 'ArrowRight':
      next = addDays(focused, inline);
      break;
    case 'ArrowLeft':
      next = addDays(focused, -inline);
      break;
    case 'ArrowDown':
      next = addDays(focused, 7);
      break;
    case 'ArrowUp':
      next = addDays(focused, -7);
      break;
    case 'Home':
      next = startOfWeek(focused, firstDayOfWeek);
      break;
    case 'End':
      next = endOfWeek(focused, firstDayOfWeek);
      break;
    case 'PageUp':
      next = input.shiftKey ? addYears(focused, -1) : addMonths(focused, -1);
      break;
    case 'PageDown':
      next = input.shiftKey ? addYears(focused, 1) : addMonths(focused, 1);
      break;
    case 'Enter':
    case ' ':
      return { type: 'select' };
    default:
      return { type: 'none' };
  }

  // Focus never leaves the allowed range; at an edge it stays put.
  return { type: 'move', date: clampDate(next, min, max) };
}
