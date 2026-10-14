'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { StatesMatrix } from '@/docs/doc-parts';
import { TimeSlotList, timeSlotClassName } from '@/slotkit/time-slot-list/time-slot-list';

/** One slot with the real classes, frozen in a state. */
function Slot({
  preview,
  checked,
  booked,
  disabled,
}: {
  preview?: string;
  checked?: boolean;
  booked?: boolean;
  disabled?: boolean;
}) {
  return (
    <RadioGroup
      value={checked ? 'x' : null}
      disabled={disabled}
      aria-label="Preview"
      className="w-24"
    >
      <Radio.Root
        value="x"
        disabled={booked}
        data-booked={booked ? '' : undefined}
        data-preview={preview}
        className={timeSlotClassName}
      >
        <span className={booked ? 'line-through' : undefined}>14:30</span>
        {booked && <span className="text-2xs">Booked</span>}
      </Radio.Root>
    </RadioGroup>
  );
}

export function SlotStates() {
  return (
    <StatesMatrix
      cells={[
        { label: 'Default', render: <Slot /> },
        { label: 'Hover', render: <Slot preview="hover" /> },
        { label: 'Focus visible', render: <Slot preview="focus-visible" /> },
        { label: 'Selected', render: <Slot checked /> },
        { label: 'Selected, focus visible', render: <Slot checked preview="focus-visible" /> },
        { label: 'Booked', note: 'Hatched, struck through, and says so', render: <Slot booked /> },
        { label: 'Disabled', note: 'Whole list disabled', render: <Slot disabled /> },
        {
          label: 'Active',
          note: 'No pressed style: selection is the feedback',
          render: <Slot preview="active" />,
        },
      ]}
    />
  );
}

export function ListStates() {
  const common = {
    label: 'Times',
    locale: 'en-GB',
    timeZone: 'UTC',
    showHourCycleToggle: false,
  } as const;
  return (
    <StatesMatrix
      className="lg:grid-cols-2"
      cells={[
        {
          label: 'Loading',
          note: 'Static skeleton (no shimmer), announced politely',
          render: <TimeSlotList {...common} slots={[]} loading />,
        },
        {
          label: 'Empty',
          note: 'Says what to do next',
          render: <TimeSlotList {...common} slots={[]} />,
        },
      ]}
    />
  );
}
