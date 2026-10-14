'use client';

import { useState } from 'react';
import { DemoFrame, DemoNote, KeyboardTip, Kbd } from '@/docs/doc-parts';
import { DemoLocaleScope, DemoToolbar, useDemoSettings } from '@/docs/demo-settings';
import { addDays, parseISODate, toISODate } from '@/slotkit/time/calendar-date';
import { formatFullDate, formatTime } from '@/slotkit/time/format';
import { useToday } from '@/slotkit/time/use-today';
import { createDaySlots, type TimeSlot } from '@/slotkit/time-slot-list/slots';
import { TimeSlotList } from '@/slotkit/time-slot-list/time-slot-list';

const BUSINESS_ZONE = 'Asia/Kolkata';

/** Tomorrow's slots, 09:00 to 17:00 in Kolkata, with deterministic demo bookings. */
function buildDemoSlots(dateKey: string | null): TimeSlot[] {
  const day = dateKey ? parseISODate(dateKey) : null;
  if (!day) return [];
  return createDaySlots({
    date: day,
    timeZone: BUSINESS_ZONE,
    from: { hour: 9, minute: 0 },
    to: { hour: 17, minute: 0 },
    stepMinutes: 30,
  }).map((slot, i) => ([2, 7, 8, 13].includes(i) ? { ...slot, status: 'booked' as const } : slot));
}

export function TimeSlotListDemo() {
  const { locale, timeZone } = useDemoSettings();
  const businessToday = useToday(BUSINESS_ZONE);
  // Tomorrow in the business zone. Keyed by its ISO string so slots are rebuilt only when it changes.
  const dateKey = businessToday ? toISODate(addDays(businessToday, 1)) : null;
  const date = dateKey ? parseISODate(dateKey) : null;
  const [selected, setSelected] = useState<TimeSlot | null>(null);

  const slots = buildDemoSlots(dateKey);

  return (
    <div className="space-y-3">
      <KeyboardTip>
        <Kbd>Tab</Kbd> into the list. Arrows move and select (booked times are skipped),{' '}
        <Kbd>Home</Kbd> <Kbd>End</Kbd> jump to the first and last free time, and typing digits such
        as <Kbd>1</Kbd> <Kbd>4</Kbd> jumps to 14:00.
      </KeyboardTip>
      <DemoFrame toolbar={<DemoToolbar />}>
        <DemoLocaleScope>
          <div className="max-w-md mx-auto w-full space-y-3">
            <TimeSlotList
              label={date ? `Times on ${formatFullDate(date, locale)}` : 'Available times'}
              locale={locale}
              timeZone={timeZone}
              slots={slots}
              date={date}
              loading={!date}
              value={selected?.value ?? null}
              onValueChange={(_, slot) => setSelected(slot)}
              name="slot"
            />
            <DemoNote>
              Business hours are 09:00 to 17:00 in Kolkata, shown in {timeZone.replace(/_/g, ' ')}.
              {selected &&
                ` Selected: ${formatTime(selected.start, locale, BUSINESS_ZONE, 'h23')} in Kolkata.`}
            </DemoNote>
          </div>
        </DemoLocaleScope>
      </DemoFrame>
    </div>
  );
}
