'use client';

import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { Calendar } from '@/slotkit/calendar/calendar';
import { CheckIcon, ClockIcon, GlobeIcon } from '@/slotkit/icons/icons';
import { type CalendarDate, addDays, isSameDay } from '@/slotkit/time/calendar-date';
import { formatDate, formatTime, getTimeZoneName } from '@/slotkit/time/format';
import { useToday } from '@/slotkit/time/use-today';
import { useVisitorTimeZone } from '@/slotkit/time/use-visitor-time-zone';
import type { TimeSlot } from '@/slotkit/time-slot-list/slots';
import { TimeSlotList } from '@/slotkit/time-slot-list/time-slot-list';
import { cx } from '@/slotkit/utils/cx';
import {
  HOST_ZONE,
  firstAvailableDate,
  hasAvailability,
  slotsForViewerDate,
} from './demo-availability';

const subscribeNever = () => () => {};

/** The current time, rounded down to the minute and refreshed every minute. Keeps render pure. */
const subscribeMinute = (onChange: () => void) => {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
};
const useNow = () =>
  useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
const useVisitorLocale = () =>
  useSyncExternalStore(
    subscribeNever,
    () => navigator.language || 'en-US',
    () => 'en-US',
  );

/**
 * The homepage hero: a small, real booking flow. Pick a day, pick a time in your own
 * zone, confirm. Built only from slotkit components; nothing is actually booked.
 */
export function BookingHero() {
  const locale = useVisitorLocale();
  const visitorZone = useVisitorTimeZone();
  const zone = visitorZone ?? 'UTC';
  const today = useToday(zone);
  const ready = !!visitorZone && !!today;

  const [chosenDate, setChosenDate] = useState<CalendarDate | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const headingId = useId();

  // Slot generation is cached per day and zone.
  const now = useNow();
  const date = chosenDate ?? (ready ? firstAvailableDate(today, zone, now) : null);
  const slots = date && ready ? slotsForViewerDate(date, zone, now) : [];
  const zoneName = ready ? getTimeZoneName(zone, locale) : '';

  const pickDate = (next: CalendarDate) => {
    setChosenDate(next);
    if (!date || !isSameDay(next, date)) setSlot(null);
  };

  return (
    <section
      aria-labelledby={headingId}
      className="w-full overflow-hidden rounded-lg border border-rule bg-raised shadow-popup"
    >
      {/* Host */}
      <header className="flex items-center gap-3 border-b border-rule px-5 py-4">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-selected text-sm font-semibold text-selected-ink"
        >
          LO
        </span>
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold tracking-tight text-ink">
            Intro call with Lena Ortiz
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <ClockIcon /> 30 min
            </span>
            <span className="inline-flex items-center gap-1">
              <GlobeIcon />
              {ready ? <span>Times in {zoneName}</span> : <span>Detecting your time zone…</span>}
            </span>
          </p>
        </div>
      </header>

      {confirmed && slot && date ? (
        <div
          role="status"
          className="flex min-h-96 flex-col items-center justify-center gap-4 px-6 py-10 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-success-subtle text-success">
            <CheckIcon className="size-6 shrink-0" />
          </span>
          <div>
            <p className="text-xl font-semibold tracking-tight text-ink">You&apos;re booked</p>
            <p className="mt-1 text-ink-muted tabular">
              {formatDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long' })},{' '}
              {formatTime(slot.start, locale, zone)} to{' '}
              {formatTime(slot.start + 30 * 60_000, locale, zone)}
            </p>
            <p className="mt-1 text-sm text-ink-muted tabular">
              That&apos;s {formatTime(slot.start, locale, HOST_ZONE)} for Lena in Berlin.
            </p>
          </div>
          <button
            ref={changeRef}
            type="button"
            onClick={() => {
              setConfirmed(false);
              requestAnimationFrame(() => confirmRef.current?.focus());
            }}
            className="target rounded-sm px-3 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Pick a different time
          </button>
          <p className="text-xs text-ink-muted">This is a demo. Nothing was booked.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 px-5 py-5 md:flex-row">
            <Calendar
              aria-label="Choose a day"
              locale={locale}
              timeZone={zone}
              {...(today ? { min: today, max: addDays(today, 60) } : {})}
              value={date}
              onValueChange={pickDate}
              isDateUnavailable={(d) => !hasAvailability(d, zone, now)}
              labels={{ unavailable: 'no times' }}
              className="shrink-0 self-center md:self-start"
            />
            <div className="min-w-0 flex-1 md:border-s md:border-rule md:ps-6">
              <TimeSlotList
                label={
                  date
                    ? formatDate(date, locale, { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Times'
                }
                locale={locale}
                timeZone={zone}
                date={date}
                slots={slots}
                loading={!ready}
                value={slot?.value ?? null}
                onValueChange={(_, next) => setSlot(next)}
              />
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-surface px-5 py-3">
            <p aria-live="polite" className="text-sm text-ink-muted tabular">
              {slot && date ? (
                <>
                  <span className="font-medium text-ink">
                    {formatDate(date, locale, { weekday: 'short', day: 'numeric', month: 'short' })}
                    , {formatTime(slot.start, locale, zone)}
                  </span>{' '}
                  · 30 min
                </>
              ) : (
                'Pick a day and a time.'
              )}
            </p>
            <button
              ref={confirmRef}
              type="button"
              disabled={!slot}
              onClick={() => {
                setConfirmed(true);
                requestAnimationFrame(() => changeRef.current?.focus());
              }}
              className={cx(
                'inline-flex target items-center gap-2 rounded-sm bg-accent px-4 text-sm font-medium text-accent-ink',
                'transition-colors duration-fast hover:bg-accent-hover',
                'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle',
              )}
            >
              Confirm booking
            </button>
          </footer>
        </>
      )}
    </section>
  );
}
