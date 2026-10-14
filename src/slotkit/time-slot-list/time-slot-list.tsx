'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useRender } from '@base-ui/react/use-render';
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useMemo,
  useRef,
} from 'react';
import { ClockIcon } from '../icons/icons';
import { type SegmentedOption, SegmentedControl } from '../segmented-control/segmented-control';
import { type CalendarDate, isSameDay } from '../time/calendar-date';
import { type HourCycle, formatDate, formatFullDate, getLocaleHourCycle } from '../time/format';
import { instantToDate } from '../time/zoned';
import { cx, type StatefulClassName } from '../utils/cx';
import { useControllableState } from '../utils/use-controllable-state';
import { type TimeSlot, findTypeaheadMatch, formatSlotLabels } from './slots';

export type TimeSlotListLabels = {
  booked: string;
  /** "8 times available" */
  summary: (available: number, total: number) => string;
  loading: string;
  empty: ReactNode;
  hourCycle: string;
  h12: string;
  h23: string;
};

export const DEFAULT_TIME_SLOT_LABELS: TimeSlotListLabels = {
  booked: 'Booked',
  summary: (available) =>
    available === 0
      ? 'No times available'
      : `${available} ${available === 1 ? 'time' : 'times'} available`,
  loading: 'Loading available times',
  empty: 'No times left on this day. Try another date.',
  hourCycle: 'Clock format',
  h12: '12h',
  h23: '24h',
};

export type TimeSlotListState = { disabled: boolean; loading: boolean; filled: boolean };

export type TimeSlotListProps = {
  slots: readonly TimeSlot[];
  /** BCP 47 locale for time formatting. */
  locale: string;
  /** The viewer's zone: slots are shown as wall-clock times here. */
  timeZone: string;
  /** Visible label for the group. */
  label: string;
  /**
   * The calendar day this list represents, in `timeZone`. Slots that fall on a different
   * local day (an evening slot from a business ahead of you, say) get a visible day marker
   * and the full date in their name, so nobody books the wrong day.
   */
  date?: CalendarDate | null;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string, slot: TimeSlot) => void;
  /** 12h / 24h. Defaults to the locale's preference until the user picks. */
  hourCycle?: HourCycle;
  defaultHourCycle?: HourCycle;
  onHourCycleChange?: (hourCycle: HourCycle) => void;
  showHourCycleToggle?: boolean;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  form?: string;
  labels?: Partial<TimeSlotListLabels>;
  className?: StatefulClassName<TimeSlotListState>;
  render?: useRender.RenderProp<TimeSlotListState>;
} & Omit<ComponentPropsWithRef<'div'>, 'className' | 'defaultValue' | 'onChange'>;

/**
 * Deliberately no motion: this list is scanned by holding arrow keys and by
 * typing, so any per-item transition would run on every key repeat. `transition-none` is
 * explicit so a future hover transition does not creep in.
 */
export const timeSlotClassName = cx(
  'flex target flex-col items-center justify-center rounded-md border border-rule bg-surface px-1.5 py-2 text-sm whitespace-nowrap text-ink tabular transition-none select-none',
  'hover:border-rule-strong hover:bg-hover',
  'data-checked:border-selected data-checked:bg-selected data-checked:font-medium data-checked:text-selected-ink',
  'forced-colors:data-checked:forced-color-adjust-none',
  // Booked: hatched, struck through and labelled in text, so the state is not color alone.
  'data-booked:cursor-not-allowed data-booked:border-rule data-booked:bg-transparent data-booked:hatched data-booked:text-unavailable',
  'data-disabled:cursor-not-allowed data-disabled:hover:border-rule data-disabled:hover:bg-surface',
  'data-booked:hover:bg-transparent',
);

const TYPEAHEAD_RESET_MS = 600;

export function TimeSlotList(props: TimeSlotListProps) {
  const {
    slots,
    locale,
    timeZone,
    label,
    date,
    value: valueProp,
    defaultValue,
    onValueChange,
    hourCycle: hourCycleProp,
    defaultHourCycle,
    onHourCycleChange,
    showHourCycleToggle = true,
    loading = false,
    disabled = false,
    name,
    required,
    form,
    labels: labelOverrides,
    className,
    render,
    ref,
    ...rest
  } = props;
  const labels = { ...DEFAULT_TIME_SLOT_LABELS, ...labelOverrides };
  const labelId = useId();
  const summaryId = useId();

  const [value, setValue] = useControllableState<string | null, TimeSlot | undefined>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange ? (next, slot) => next && slot && onValueChange(next, slot) : undefined,
  });

  // null means "follow the locale" until someone picks.
  const [hourCycleChoice, setHourCycleChoice] = useControllableState<HourCycle | null, undefined>({
    value: hourCycleProp,
    defaultValue: defaultHourCycle ?? null,
    onChange: onHourCycleChange ? (next) => next && onHourCycleChange(next) : undefined,
    name: 'hourCycle',
  });
  const hourCycle = hourCycleChoice ?? getLocaleHourCycle(locale);

  const slotLabels = useMemo(
    () => formatSlotLabels(slots, locale, timeZone, hourCycle),
    [slots, locale, timeZone, hourCycle],
  );
  const available = slots.filter((s) => s.status !== 'booked').length;
  const isEnabled = (i: number) => !disabled && slots[i]?.status !== 'booked';

  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const typeahead = useRef<{ query: string; timer?: ReturnType<typeof setTimeout> }>({ query: '' });

  const moveTo = (index: number) => {
    const slot = slots[index];
    if (!slot || index < 0) return;
    itemRefs.current[index]?.focus();
    setValue(slot.value, slot);
  };

  /*
   * Base UI's RadioGroup handles arrow keys and the single tab stop. It disables Home and
   * End and has no typeahead, so those are layered on here. Space is left to Base UI.
   */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || disabled) return;
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);

    if (event.key === 'Home' || event.key === 'End') {
      const order = slots.map((_, i) => i);
      if (event.key === 'End') order.reverse();
      const target = order.find(isEnabled);
      if (target !== undefined) {
        event.preventDefault();
        moveTo(target);
      }
      return;
    }

    if (event.key.length === 1 && event.key !== ' ') {
      const t = typeahead.current;
      clearTimeout(t.timer);
      t.query += event.key;
      t.timer = setTimeout(() => {
        t.query = '';
      }, TYPEAHEAD_RESET_MS);
      const match = findTypeaheadMatch(slotLabels, t.query, Math.max(current, 0), isEnabled);
      if (match !== -1) {
        event.preventDefault();
        moveTo(match);
      }
    }
  };

  const state: TimeSlotListState = { disabled, loading, filled: !!value };
  const options: SegmentedOption<HourCycle>[] = [
    { value: 'h12', label: labels.h12 },
    { value: 'h23', label: labels.h23 },
  ];
  const summary = loading ? labels.loading : labels.summary(available, slots.length);

  const content = (
    <>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <span id={labelId} className="block text-sm font-medium text-ink">
            {label}
          </span>
          {/* Polite: when the day changes, "6 times available" is announced without moving focus. */}
          <p id={summaryId} aria-live="polite" className="text-xs text-ink-muted">
            {summary}
          </p>
        </div>
        {showHourCycleToggle && (
          <SegmentedControl
            label={labels.hourCycle}
            options={options}
            value={hourCycle}
            onValueChange={(next) => setHourCycleChoice(next, undefined)}
            size="small"
            disabled={disabled}
          />
        )}
      </div>

      {loading ? (
        <div aria-hidden="true" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="target rounded-md bg-sunken" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-rule-strong px-4 py-6 text-sm text-ink-muted">
          <ClockIcon />
          <span>{labels.empty}</span>
        </div>
      ) : (
        <RadioGroup
          value={value}
          onValueChange={(next) => {
            const slot = slots.find((s) => s.value === next);
            if (slot) setValue(slot.value, slot);
          }}
          aria-labelledby={labelId}
          aria-describedby={summaryId}
          disabled={disabled}
          {...(name !== undefined ? { name } : {})}
          {...(form !== undefined ? { form } : {})}
          required={required}
          onKeyDown={onKeyDown}
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {slots.map((slot, i) => {
            const booked = slot.status === 'booked';
            const slotDate = instantToDate(slot.start, timeZone);
            const otherDay = !!date && !isSameDay(slotDate, date);
            const needsName = booked || otherDay;
            return (
              <Radio.Root
                key={slot.value}
                value={slot.value}
                disabled={booked}
                ref={(el: HTMLElement | null) => {
                  itemRefs.current[i] = el;
                }}
                data-booked={booked ? '' : undefined}
                data-other-day={otherDay ? '' : undefined}
                // Spans would otherwise be read run together ("10:00Booked"); the explicit name
                // also adds the full date for slots on another day.
                aria-label={
                  needsName
                    ? [
                        slotLabels[i],
                        otherDay && formatFullDate(slotDate, locale),
                        booked && labels.booked,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : undefined
                }
                className={timeSlotClassName}
              >
                {otherDay && (
                  <span className="text-2xs font-medium text-accent in-data-booked:text-unavailable in-data-checked:text-selected-ink">
                    {formatDate(slotDate, locale, { weekday: 'short', day: 'numeric' })}
                  </span>
                )}
                <span className={cx(booked && 'line-through')}>{slotLabels[i]}</span>
                {booked && <span className="text-2xs">{labels.booked}</span>}
              </Radio.Root>
            );
          })}
        </RadioGroup>
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
      'aria-busy': loading || undefined,
      'data-loading': loading ? '' : undefined,
      'data-disabled': disabled ? '' : undefined,
      className: cx('w-full', typeof className === 'function' ? className(state) : className),
      children: content,
    },
  });
}
