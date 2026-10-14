'use client';

import {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  type CalendarDate,
  type IsoWeekday,
  addDays,
  addMonths,
  clampDate,
  daysInMonth,
  isSameDay,
  isSameMonth,
  isWithinRange,
  isoWeekday,
  startOfMonth,
  toISODate,
} from '../time/calendar-date';
import { formatDayNumber, formatFullDate, formatMonthYear, getWeekdayNames } from '../time/format';
import { getFirstDayOfWeek } from '../time/week-info';
import { useControllableState } from '../utils/use-controllable-state';
import { calendarKeyAction } from './calendar-keyboard';

/*
 * useCalendarGrid: all calendar behaviour, no styling.
 *
 *  - which month is visible, and which weeks and days it contains
 *  - which day is focused (roving tabindex: exactly one day has tabIndex 0)
 *  - which day is selected (controlled or uncontrolled)
 *  - which days are disabled (outside min/max) or unavailable (isDateUnavailable)
 *  - keyboard handling, via the pure calendarKeyAction
 *  - moving DOM focus after a keyboard move, and only then
 *  - which way the month changed, for motion, and whether it was a key repeat
 *
 * The Calendar component only renders what this returns.
 */

export type CalendarLabels = {
  previousMonth: string;
  nextMonth: string;
  unavailable: string;
};

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  unavailable: 'unavailable',
};

export type CalendarValueChangeDetails = { reason: 'click' | 'keyboard' };

export type UseCalendarGridOptions = {
  /** BCP 47 locale for names, digits and week start. */
  locale: string;
  /** Today's date. `null` while unknown (during server render); no day is marked as today. */
  today: CalendarDate | null;
  value?: CalendarDate | null | undefined;
  defaultValue?: CalendarDate | null | undefined;
  onValueChange?: ((date: CalendarDate, details: CalendarValueChangeDetails) => void) | undefined;
  /** The visible month (any day in it). Controlled. */
  month?: CalendarDate | undefined;
  defaultMonth?: CalendarDate | undefined;
  onMonthChange?: ((month: CalendarDate) => void) | undefined;
  min?: CalendarDate | null | undefined;
  max?: CalendarDate | null | undefined;
  /** Days inside min/max that still cannot be chosen (booked out, closed). */
  isDateUnavailable?: ((date: CalendarDate) => boolean) | undefined;
  /** Overrides the locale's week start. 1 = Monday ... 7 = Sunday. */
  firstDayOfWeek?: IsoWeekday | undefined;
  dir?: 'ltr' | 'rtl' | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  labels?: Partial<CalendarLabels> | undefined;
};

export type CalendarDay = {
  date: CalendarDate;
  /** ISO date, also the React key. */
  key: string;
  /** Day of month in the locale's digits. */
  dayNumber: string;
  /** Full accessible name, e.g. "Sunday, March 8, 2026, today". */
  label: string;
  isToday: boolean;
  isSelected: boolean;
  isFocused: boolean;
  /** Outside min/max, or the whole calendar is disabled. */
  isDisabled: boolean;
  /** Inside min/max, but isDateUnavailable said no. */
  isUnavailable: boolean;
  isSelectable: boolean;
  isWeekend: boolean;
};

export type CalendarWeek = { key: string; days: (CalendarDay | null)[] };

export type MonthChangeDirection = 'prev' | 'next' | null;

export function useCalendarGrid(options: UseCalendarGridOptions) {
  const {
    locale,
    today,
    min,
    max,
    isDateUnavailable,
    dir = 'ltr',
    disabled = false,
    readOnly = false,
  } = options;
  const labels = { ...DEFAULT_CALENDAR_LABELS, ...options.labels };
  const firstDayOfWeek = options.firstDayOfWeek ?? getFirstDayOfWeek(locale);
  const titleId = useId();

  const [selected, setSelected] = useControllableState<
    CalendarDate | null,
    CalendarValueChangeDetails
  >({
    value: options.value,
    defaultValue: options.defaultValue ?? null,
    // Selection only ever sets a real date; null is only the initial "nothing chosen".
    onChange: options.onValueChange
      ? (date, details) => date && options.onValueChange?.(date, details)
      : undefined,
    name: 'value',
  });

  // The visible month. Until something tells us which month to show (a value, a default
  // month, or today once known on the client), it is null and the grid renders empty.
  const initialMonth =
    options.month ?? options.value ?? options.defaultValue ?? options.defaultMonth ?? today;
  const [month, setMonthState] = useControllableState<CalendarDate | null, undefined>({
    value: options.month,
    defaultValue: initialMonth ? startOfMonth(initialMonth) : null,
    onChange: options.onMonthChange ? (m) => m && options.onMonthChange?.(m) : undefined,
    name: 'month',
  });

  // Today arrives after hydration; if nothing else picked a month, show today's.
  useEffect(() => {
    if (month === null && today) setMonthState(startOfMonth(clampDate(today, min, max)), undefined);
  }, [month, today, min, max, setMonthState]);

  const [focusedState, setFocusedState] = useState<CalendarDate | null>(null);
  const [direction, setDirection] = useState<MonthChangeDirection>(null);
  const [animate, setAnimate] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  const dayRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef(false);

  const isSelectable = useCallback(
    (date: CalendarDate) =>
      !disabled && isWithinRange(date, min, max) && !(isDateUnavailable?.(date) ?? false),
    [disabled, min, max, isDateUnavailable],
  );

  // The focused day must be in the visible month. If the remembered one is not, fall back
  // to the selected day, then today, then the first day of the month.
  const focused = useMemo<CalendarDate | null>(() => {
    if (!month) return null;
    const candidates = [focusedState, selected, today, month];
    const inMonth = candidates.find((d): d is CalendarDate => !!d && isSameMonth(d, month));
    return clampDate(inMonth ?? month, min, max);
  }, [focusedState, selected, today, month, min, max]);

  const changeMonth = useCallback(
    (next: CalendarDate, opts: { animate: boolean }) => {
      if (!month) return;
      const target = startOfMonth(next);
      if (isSameMonth(target, month)) return;
      setDirection(
        target.year * 12 + target.month > month.year * 12 + month.month ? 'next' : 'prev',
      );
      setAnimate(opts.animate);
      setMonthState(target, undefined);
    },
    [month, setMonthState],
  );

  const select = useCallback(
    (date: CalendarDate, reason: CalendarValueChangeDetails['reason']) => {
      if (readOnly || !isSelectable(date)) return;
      setFocusedState(date);
      setSelected(date, { reason });
    },
    [readOnly, isSelectable, setSelected],
  );

  const monthStep = useCallback(
    (delta: 1 | -1) => {
      if (!month || !focused) return;
      const nextFocus = clampDate(addMonths(focused, delta), min, max);
      setFocusedState(nextFocus);
      changeMonth(nextFocus, { animate: true });
      setAnnouncement(formatMonthYear(nextFocus, locale));
    },
    [month, focused, min, max, changeMonth, locale],
  );

  const canGoPrev = !!month && !disabled && (!min || isWithinRange(addDays(month, -1), min, null));
  const canGoNext =
    !!month &&
    !disabled &&
    (!max ||
      isWithinRange(
        addDays({ ...month, day: daysInMonth(month.year, month.month) }, 1),
        null,
        max,
      ));

  const onDayKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!focused) return;
      const action = calendarKeyAction(focused, event, { firstDayOfWeek, dir, min, max });
      if (action.type === 'none') return;
      event.preventDefault();

      if (action.type === 'select') {
        select(focused, 'keyboard');
        return;
      }

      pendingFocus.current = true;
      setFocusedState(action.date);
      // Holding PageDown must not queue a slide per month (see MOTION.md).
      changeMonth(action.date, { animate: !event.repeat });
      setAnnouncement('');
    },
    [focused, firstDayOfWeek, dir, min, max, select, changeMonth],
  );

  // Move DOM focus only after a keyboard move, never on render or on pointer use.
  useLayoutEffect(() => {
    if (!pendingFocus.current || !focused) return;
    pendingFocus.current = false;
    dayRefs.current.get(toISODate(focused))?.focus();
  });

  const weekdays = useMemo(() => {
    const short = getWeekdayNames(locale, firstDayOfWeek, 'short');
    const narrow = getWeekdayNames(locale, firstDayOfWeek, 'narrow');
    const long = getWeekdayNames(locale, firstDayOfWeek, 'long');
    // Some locales' "short" names are full words (Arabic, for example) and collide in
    // 40px columns. Fall back to the narrow form there; the long name is still read out.
    const tooLong = short.some((w) => [...w.label].length > 4);
    return short.map((w, i) => ({
      iso: w.iso,
      short: tooLong ? narrow[i]!.label : w.label,
      long: long[i]!.label,
    }));
  }, [locale, firstDayOfWeek]);

  const todayWord = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day'),
    [locale],
  );

  const weeks = useMemo<CalendarWeek[]>(() => {
    if (!month) return [];
    const total = daysInMonth(month.year, month.month);
    const lead = (isoWeekday(month) - firstDayOfWeek + 7) % 7;
    const cells: (CalendarDay | null)[] = Array.from({ length: lead }, () => null);

    for (let day = 1; day <= total; day++) {
      const date: CalendarDate = { year: month.year, month: month.month, day };
      const inRange = !disabled && isWithinRange(date, min, max);
      const isUnavailable = inRange && (isDateUnavailable?.(date) ?? false);
      const isToday = !!today && isSameDay(date, today);
      const iso = isoWeekday(date);
      cells.push({
        date,
        key: toISODate(date),
        dayNumber: formatDayNumber(date, locale),
        label: [
          formatFullDate(date, locale),
          isToday && todayWord,
          isUnavailable && labels.unavailable,
        ]
          .filter(Boolean)
          .join(', '),
        isToday,
        isSelected: !!selected && isSameDay(date, selected),
        isFocused: !!focused && isSameDay(date, focused),
        isDisabled: !inRange,
        isUnavailable,
        isSelectable: inRange && !isUnavailable,
        isWeekend: iso === 6 || iso === 7,
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    return Array.from({ length: cells.length / 7 }, (_, w) => ({
      key: `${toISODate(month)}-w${w}`,
      days: cells.slice(w * 7, w * 7 + 7),
    }));
  }, [
    month,
    firstDayOfWeek,
    disabled,
    min,
    max,
    isDateUnavailable,
    today,
    locale,
    todayWord,
    labels.unavailable,
    selected,
    focused,
  ]);

  const getDayButtonProps = (day: CalendarDay) => ({
    ref: (el: HTMLButtonElement | null) => {
      if (el) dayRefs.current.set(day.key, el);
      else dayRefs.current.delete(day.key);
    },
    type: 'button' as const,
    tabIndex: day.isFocused ? 0 : -1,
    'aria-label': day.label,
    'aria-disabled': !day.isSelectable || readOnly ? true : undefined,
    'aria-current': day.isToday ? ('date' as const) : undefined,
    onKeyDown: onDayKeyDown,
    onClick: (_event: MouseEvent<HTMLButtonElement>) => select(day.date, 'click'),
    onFocus: () => {
      if (!focused || !isSameDay(day.date, focused)) setFocusedState(day.date);
    },
  });

  return {
    titleId,
    title: month ? formatMonthYear(month, locale) : '',
    month,
    weeks,
    weekdays,
    focusedDate: focused,
    selectedDate: selected,
    firstDayOfWeek,
    direction,
    animate,
    announcement,
    labels,
    canGoPrev,
    canGoNext,
    goToPrevMonth: () => monthStep(-1),
    goToNextMonth: () => monthStep(1),
    getDayButtonProps,
    isSelectable,
  };
}

export type CalendarGridState = ReturnType<typeof useCalendarGrid>;
