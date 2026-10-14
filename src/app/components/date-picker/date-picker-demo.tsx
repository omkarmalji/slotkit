'use client';

import { useState } from 'react';
import { DemoFrame, DemoNote, KeyboardTip, Kbd } from '@/docs/doc-parts';
import { DemoLocaleScope, DemoToolbar, useDemoSettings } from '@/docs/demo-settings';
import { Calendar } from '@/slotkit/calendar/calendar';
import { DatePicker } from '@/slotkit/calendar/date-picker';
import { type CalendarDate, addDays, isoWeekday, toISODate } from '@/slotkit/time/calendar-date';
import { formatFullDate } from '@/slotkit/time/format';
import { useToday } from '@/slotkit/time/use-today';

/** Demo availability: weekends closed, and the 2nd, 5th and 9th upcoming weekdays booked out. */
function useDemoAvailability(today: CalendarDate | null) {
  const booked = new Set<string>();
  if (today) {
    let date = today;
    for (let weekday = 0; weekday < 9;) {
      date = addDays(date, 1);
      if (isoWeekday(date) >= 6) continue;
      weekday++;
      if (weekday === 2 || weekday === 5 || weekday === 9) booked.add(toISODate(date));
    }
  }
  return (date: CalendarDate) => isoWeekday(date) >= 6 || booked.has(toISODate(date));
}

export function DatePickerDemo() {
  const { locale, timeZone } = useDemoSettings();
  const today = useToday(timeZone);
  const isDateUnavailable = useDemoAvailability(today);
  const [inline, setInline] = useState<CalendarDate | null>(null);

  return (
    <div className="space-y-3">
      <KeyboardTip>
        <Kbd>Tab</Kbd> to the date field and press <Kbd>Enter</Kbd>. Arrow keys move by day and
        week, <Kbd>PageUp</Kbd> <Kbd>PageDown</Kbd> change month (add <Kbd>Shift</Kbd> for year),{' '}
        <Kbd>Enter</Kbd> picks, <Kbd>Esc</Kbd> closes.
      </KeyboardTip>
      <DemoFrame toolbar={<DemoToolbar />}>
        <DemoLocaleScope>
          <div className="grid w-full items-start justify-items-center gap-10 md:grid-cols-2">
            <div className="max-w-xs w-full space-y-2">
              <p className="text-xs tracking-caps text-ink-muted uppercase">DatePicker</p>
              <DatePicker
                label="Appointment date"
                description="Weekdays only. Some days are fully booked."
                locale={locale}
                timeZone={timeZone}
                min={today}
                isDateUnavailable={isDateUnavailable}
                name="date"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs tracking-caps text-ink-muted uppercase">Calendar (inline)</p>
              <Calendar
                aria-label="Choose a day"
                locale={locale}
                timeZone={timeZone}
                min={today}
                isDateUnavailable={isDateUnavailable}
                value={inline}
                onValueChange={setInline}
                className="rounded-lg border border-rule bg-raised p-3"
              />
              <DemoNote>
                {inline ? `Selected: ${formatFullDate(inline, locale)}` : 'Nothing selected yet.'}
              </DemoNote>
            </div>
          </div>
        </DemoLocaleScope>
      </DemoFrame>
    </div>
  );
}
