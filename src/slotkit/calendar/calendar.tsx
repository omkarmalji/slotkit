'use client';

import { Button } from '@base-ui/react/button';
import { useDirection } from '@base-ui/react/direction-provider';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/icons';
import { type CalendarDate, toISODate } from '../time/calendar-date';
import { useToday } from '../time/use-today';
import { useVisitorTimeZone } from '../time/use-visitor-time-zone';
import { cx, type StatefulClassName } from '../utils/cx';
import {
  type CalendarDay,
  type UseCalendarGridOptions,
  useCalendarGrid,
} from './use-calendar-grid';

export type CalendarState = {
  disabled: boolean;
  readOnly: boolean;
  /** A date is selected. */
  filled: boolean;
};

export type CalendarProps = Omit<UseCalendarGridOptions, 'today' | 'dir'> & {
  /** Zone used to work out "today". Defaults to the visitor's zone (detected on the client). */
  timeZone?: string | undefined;
  /** Override "today", for tests or a fixed demo. */
  today?: CalendarDate | null | undefined;
  /** Defaults to Base UI's DirectionProvider, then LTR. */
  dir?: 'ltr' | 'rtl' | undefined;
  /** Form field name. The value is submitted as YYYY-MM-DD. */
  name?: string | undefined;
  required?: boolean | undefined;
  form?: string | undefined;
  /** Extra content inside each day, under the number (for example an availability mark). */
  renderDay?: ((day: CalendarDay) => ReactNode) | undefined;
  className?: StatefulClassName<CalendarState> | undefined;
  render?: useRender.RenderProp<CalendarState> | undefined;
} & Omit<ComponentPropsWithRef<'div'>, 'className' | 'defaultValue' | 'onChange' | 'dir'>;

/** Day cell styles. Exported so docs can show single cells in forced states. */
export const calendarDayClassName = cx(
  'relative flex size-10 flex-col items-center justify-center rounded-sm text-sm text-ink tabular select-none',
  'transition duration-instant ease-standard',
  'hover:bg-hover active:scale-(--sk-motion-press-scale)',
  // Selected: ink fill, the strongest state in the system.
  'data-selected:bg-selected data-selected:font-medium data-selected:text-selected-ink data-selected:hover:bg-selected',
  'forced-colors:data-selected:forced-color-adjust-none',
  // Unavailable: readable, struck through and hatched, so it is not color alone.
  'data-unavailable:hatched data-unavailable:text-unavailable data-unavailable:line-through data-unavailable:hover:bg-transparent',
  // Outside min/max: inactive (exempt from contrast), no hover, no press.
  'data-disabled:text-ink-subtle data-disabled:hover:bg-transparent data-disabled:active:scale-100',
  'aria-disabled:cursor-not-allowed',
);

export function Calendar(props: CalendarProps) {
  const {
    locale,
    value,
    defaultValue,
    onValueChange,
    month,
    defaultMonth,
    onMonthChange,
    min,
    max,
    isDateUnavailable,
    firstDayOfWeek,
    disabled = false,
    readOnly = false,
    labels,
    timeZone,
    today: todayOverride,
    dir: dirProp,
    name,
    required,
    form,
    renderDay,
    className,
    render,
    ref,
    ...rest
  } = props;

  const contextDir = useDirection();
  const dir = dirProp ?? contextDir;
  const visitorZone = useVisitorTimeZone();
  const detectedToday = useToday(timeZone ?? visitorZone ?? 'UTC');
  // Before hydration the visitor zone is unknown, so "today" is unknown too.
  const today =
    todayOverride !== undefined ? todayOverride : timeZone || visitorZone ? detectedToday : null;

  const grid = useCalendarGrid({
    locale,
    today,
    value,
    defaultValue,
    onValueChange,
    month,
    defaultMonth,
    onMonthChange,
    min,
    max,
    isDateUnavailable,
    firstDayOfWeek,
    dir,
    disabled,
    readOnly,
    labels,
  });

  const state: CalendarState = { disabled, readOnly, filled: !!grid.selectedDate };
  const PrevIcon = dir === 'rtl' ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = dir === 'rtl' ? ChevronLeftIcon : ChevronRightIcon;

  const content = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2 ps-2">
        <div id={grid.titleId} className="text-sm font-semibold tracking-tight text-ink tabular">
          {grid.title || ' '}
        </div>
        <div className="flex items-center gap-1">
          <Button
            className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-hover hover:text-ink disabled:text-ink-subtle disabled:hover:bg-transparent"
            onClick={grid.goToPrevMonth}
            disabled={!grid.canGoPrev}
            aria-label={grid.labels.previousMonth}
          >
            <PrevIcon />
          </Button>
          <Button
            className="inline-flex size-9 items-center justify-center rounded-sm text-ink-muted hover:bg-hover hover:text-ink disabled:text-ink-subtle disabled:hover:bg-transparent"
            onClick={grid.goToNextMonth}
            disabled={!grid.canGoNext}
            aria-label={grid.labels.nextMonth}
          >
            <NextIcon />
          </Button>
        </div>
      </div>

      {/* Announces the month after the previous/next buttons; keyboard moves announce via focus instead. */}
      <div aria-live="polite" className="sr-only">
        {grid.announcement}
      </div>

      <table
        role="grid"
        aria-labelledby={grid.titleId}
        aria-readonly={readOnly || undefined}
        className="border-separate border-spacing-0.5"
      >
        <thead>
          <tr>
            {grid.weekdays.map((w) => (
              <th key={w.iso} scope="col" className="h-8 text-xs font-medium text-ink-muted">
                <span aria-hidden="true">{w.short}</span>
                <span className="sr-only">{w.long}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          key={grid.month ? toISODate(grid.month) : 'empty'}
          data-direction={grid.animate ? (grid.direction ?? undefined) : undefined}
          className="data-[direction=next]:animate-month-next data-[direction=prev]:animate-month-prev"
        >
          {grid.weeks.map((week) => (
            <tr key={week.key}>
              {week.days.map((day, i) =>
                day ? (
                  <td key={day.key} role="gridcell" aria-selected={day.isSelected} className="p-0">
                    <button
                      {...grid.getDayButtonProps(day)}
                      data-calendar-day=""
                      data-selected={day.isSelected ? '' : undefined}
                      data-today={day.isToday ? '' : undefined}
                      data-disabled={day.isDisabled ? '' : undefined}
                      data-unavailable={day.isUnavailable ? '' : undefined}
                      data-focused={day.isFocused ? '' : undefined}
                      className={calendarDayClassName}
                    >
                      <span aria-hidden="true">{day.dayNumber}</span>
                      {day.isToday && <CalendarTodayMark />}
                      {renderDay?.(day)}
                    </button>
                  </td>
                ) : (
                  <td key={`empty-${i}`} role="gridcell" className="p-0" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {name !== undefined && (
        <input
          type="hidden"
          name={name}
          value={grid.selectedDate ? toISODate(grid.selectedDate) : ''}
          form={form}
          required={required}
        />
      )}
    </>
  );

  return useRender({
    defaultTagName: 'div',
    render,
    ref,
    state,
    props: {
      ...rest,
      dir,
      'data-disabled': disabled ? '' : undefined,
      'data-readonly': readOnly ? '' : undefined,
      className: cx('inline-block', typeof className === 'function' ? className(state) : className),
      children: content,
    },
  });
}

/** A cobalt dot under today's number; switches to the selected ink color when the day is selected. */
export function CalendarTodayMark() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-1 size-1 rounded-full bg-accent in-data-selected:bg-selected-ink forced-colors:forced-color-adjust-none"
    />
  );
}
