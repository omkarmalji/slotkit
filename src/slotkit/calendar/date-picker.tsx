'use client';

import { type ComponentPropsWithRef, type ReactNode, useId, useRef, useState } from 'react';
import { AlertIcon, CalendarIcon, ChevronDownIcon } from '../icons/icons';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '../popover/popover';
import { type CalendarDate, toISODate } from '../time/calendar-date';
import { formatDate } from '../time/format';
import { cx } from '../utils/cx';
import { useControllableState } from '../utils/use-controllable-state';
import { Calendar, type CalendarProps } from './calendar';
import type { CalendarValueChangeDetails } from './use-calendar-grid';

export type DatePickerProps = Pick<
  CalendarProps,
  | 'locale'
  | 'timeZone'
  | 'today'
  | 'min'
  | 'max'
  | 'isDateUnavailable'
  | 'firstDayOfWeek'
  | 'labels'
  | 'dir'
  | 'renderDay'
> & {
  /** Visible label. Also names the popup dialog. */
  label: string;
  description?: ReactNode;
  /** Shown when `invalid`, or when a required date is missing on submit. */
  errorMessage?: ReactNode;
  /** Mark invalid from outside (for example after server validation). */
  invalid?: boolean;
  placeholder?: string;
  value?: CalendarDate | null;
  defaultValue?: CalendarDate | null;
  onValueChange?: (date: CalendarDate, details: CalendarValueChangeDetails) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Form field name. Submitted as YYYY-MM-DD. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  form?: string;
  /** Format for the trigger text. */
  formatOptions?: Intl.DateTimeFormatOptions;
  className?: string;
  /** Forwarded to the trigger button. */
  ref?: ComponentPropsWithRef<'button'>['ref'];
};

const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

export function DatePicker({
  label,
  description,
  errorMessage = 'Choose a date.',
  invalid: invalidProp = false,
  placeholder = 'Select a date',
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  name,
  required = false,
  disabled = false,
  form,
  formatOptions = DEFAULT_FORMAT,
  className,
  ref,
  locale,
  ...calendarProps
}: DatePickerProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const triggerId = `${baseId}-trigger`;
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [value, setValue] = useControllableState<CalendarDate | null, CalendarValueChangeDetails>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange ? (date, details) => date && onValueChange(date, details) : undefined,
  });
  const [open, setOpen] = useControllableState<boolean, undefined>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange ? (next) => onOpenChange(next) : undefined,
    name: 'open',
  });
  const [missing, setMissing] = useState(false);

  const invalid = invalidProp || (missing && !value);
  const describedBy =
    [description && descriptionId, invalid && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div
      className={cx('max-w-xs flex w-full flex-col gap-1.5', className)}
      data-invalid={invalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      <span id={labelId} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-ink-muted">
            *
          </span>
        )}
      </span>

      <PopoverRoot open={open} onOpenChange={(next) => setOpen(next, undefined)} modal="trap-focus">
        <PopoverTrigger
          id={triggerId}
          ref={(el: HTMLButtonElement | null) => {
            triggerRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) ref.current = el;
          }}
          disabled={disabled}
          // Name = label + current value: "Appointment date, Sun, Mar 8, 2026".
          aria-labelledby={`${labelId} ${triggerId}`}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          className={cx(
            'group inline-flex target w-full items-center gap-2 rounded-md border border-rule-strong bg-surface px-3 text-start text-sm text-ink',
            'transition duration-fast hover:bg-hover',
            'data-popup-open:border-accent',
            'aria-invalid:border-danger',
            'disabled:cursor-not-allowed disabled:border-rule disabled:text-ink-subtle disabled:hover:bg-surface',
          )}
        >
          <span className="text-ink-muted group-disabled:text-ink-subtle">
            <CalendarIcon />
          </span>
          <span
            className={cx(
              'flex-1 truncate tabular',
              !value && 'text-ink-muted group-disabled:text-ink-subtle',
            )}
          >
            {value ? formatDate(value, locale, formatOptions) : placeholder}
          </span>
          <span className="text-ink-muted transition duration-fast group-data-popup-open:rotate-180 motion-reduce:transition-none">
            <ChevronDownIcon />
          </span>
        </PopoverTrigger>

        <PopoverContent
          ref={popupRef}
          aria-labelledby={labelId}
          // Open with focus on the selected day (or today), not on "Previous month".
          initialFocus={() =>
            popupRef.current?.querySelector<HTMLElement>('[data-calendar-day][tabindex="0"]') ??
            true
          }
        >
          <Calendar
            {...calendarProps}
            locale={locale}
            value={value}
            onValueChange={(date, details) => {
              setValue(date, details);
              setMissing(false);
              // Choosing a date completes the task: close, and Base UI returns focus to the trigger.
              setOpen(false, undefined);
            }}
          />
        </PopoverContent>
      </PopoverRoot>

      {description && (
        <p id={descriptionId} className="text-xs text-ink-muted">
          {description}
        </p>
      )}
      {invalid && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-danger">
          <AlertIcon />
          {errorMessage}
        </p>
      )}

      {/*
       * Hidden inputs ignore `required`, so the form value lives in a visually hidden text
       * input that takes part in native validation. On an invalid submit, the browser's
       * own bubble would point at an invisible element, so it is suppressed and focus moves
       * to the visible trigger, which now describes the error.
       */}
      {name !== undefined && (
        <input
          type="text"
          name={name}
          form={form}
          value={value ? toISODate(value) : ''}
          required={required}
          disabled={disabled}
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault();
            setMissing(true);
            triggerRef.current?.focus();
          }}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      )}
    </div>
  );
}
