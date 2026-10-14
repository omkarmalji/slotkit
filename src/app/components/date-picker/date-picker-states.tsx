'use client';

import { StatesMatrix } from '@/docs/doc-parts';
import { CalendarTodayMark, calendarDayClassName } from '@/slotkit/calendar/calendar';
import { DatePicker } from '@/slotkit/calendar/date-picker';
import { createDate } from '@/slotkit/time/calendar-date';

type DayState = {
  preview?: string;
  selected?: boolean;
  today?: boolean;
  unavailable?: boolean;
  disabled?: boolean;
};

/** One day cell with the real Calendar classes and data attributes, frozen in a state. */
function Day({ preview, selected, today, unavailable, disabled }: DayState) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className={calendarDayClassName}
      data-preview={preview}
      data-selected={selected ? '' : undefined}
      data-today={today ? '' : undefined}
      data-unavailable={unavailable ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={unavailable || disabled ? true : undefined}
    >
      <span aria-hidden="true">18</span>
      {today && <CalendarTodayMark />}
    </button>
  );
}

const fixedToday = createDate(2026, 10, 14);

export function DayStates() {
  return (
    <StatesMatrix
      cells={[
        { label: 'Default', render: <Day /> },
        { label: 'Hover', render: <Day preview="hover" /> },
        { label: 'Focus visible', render: <Day preview="focus-visible" /> },
        { label: 'Active (pressed)', render: <Day preview="active hover" /> },
        { label: 'Selected', render: <Day selected /> },
        { label: 'Today', note: 'Cobalt mark plus aria-current="date"', render: <Day today /> },
        { label: 'Today, selected', render: <Day today selected /> },
        { label: 'Selected, focus visible', render: <Day selected preview="focus-visible" /> },
        {
          label: 'Unavailable',
          note: 'Struck through and hatched, still readable',
          render: <Day unavailable />,
        },
        { label: 'Disabled', note: 'Outside min / max', render: <Day disabled /> },
      ]}
    />
  );
}

export function TriggerStates() {
  const common = { label: 'Date', locale: 'en-US', today: fixedToday } as const;
  return (
    <StatesMatrix
      className="lg:grid-cols-3"
      cells={[
        { label: 'Empty', render: <DatePicker {...common} /> },
        {
          label: 'Filled',
          render: <DatePicker {...common} defaultValue={createDate(2026, 10, 20)} />,
        },
        {
          label: 'Invalid',
          render: <DatePicker {...common} invalid errorMessage="That day is fully booked." />,
        },
        { label: 'Disabled', render: <DatePicker {...common} disabled /> },
        {
          label: 'Required, with description',
          render: <DatePicker {...common} required description="Weekdays only." />,
        },
        {
          label: 'Loading',
          note: 'Before "today" is known on the client the grid is empty. Data loading belongs to BookingCard.',
          render: <span className="text-xs text-ink-muted">See BookingCard</span>,
        },
      ]}
    />
  );
}
