import type { Metadata } from 'next';
import { ApiTable, DocHeader, DocPage, DocSection, KeyboardMap, Prose } from '@/docs/doc-parts';
import { TimeSlotListDemo } from './time-slot-list-demo';
import { ListStates, SlotStates } from './time-slot-list-states';

export const metadata: Metadata = {
  title: 'TimeSlotList',
  description:
    'A single-select list of time slots on Base UI RadioGroup, with Home/End, typeahead, booked states, a 12h/24h toggle and correct labels on DST days.',
};

export default function TimeSlotListPage() {
  return (
    <DocPage>
      <DocHeader eyebrow="Component" title="TimeSlotList">
        Pick one time from a day&apos;s slots. Slots are instants, so they show correctly in any
        zone; it is a Base UI RadioGroup with Home, End and typeahead added on top.
      </DocHeader>

      <DocSection
        id="demo"
        title="Demo"
        description="The business is in Kolkata. Change the time zone to see the same slots as local times elsewhere, and the locale to see the 12h or 24h default change."
      >
        <TimeSlotListDemo />
      </DocSection>

      <DocSection
        id="states"
        title="States"
        description="A single slot in each state, then the list's loading and empty states."
      >
        <div className="space-y-6">
          <SlotStates />
          <ListStates />
        </div>
      </DocSection>

      <DocSection id="keyboard" title="Keyboard">
        <KeyboardMap
          caption="TimeSlotList keyboard map"
          bindings={[
            {
              keys: [['Tab']],
              action:
                'Into the list: one tab stop, on the selected slot or the first available one.',
            },
            {
              keys: [['→'], ['↓']],
              action: 'Next available slot, and select it. Booked slots are skipped.',
            },
            { keys: [['←'], ['↑']], action: 'Previous available slot, and select it.' },
            {
              keys: [['Home'], ['End']],
              action:
                'First / last available slot. Added on top of Base UI, which leaves these keys off.',
            },
            {
              keys: [['0–9'], ['a–z']],
              action:
                'Typeahead: type a time\'s digits ("14", "930") to jump to it. Repeating one key cycles through matches.',
            },
            {
              keys: [['Space']],
              action: 'Select the focused slot (already selected by arrow keys).',
            },
          ]}
        />
      </DocSection>

      <DocSection id="api" title="API">
        <ApiTable
          caption="TimeSlotList props"
          props={[
            {
              name: 'slots',
              type: 'TimeSlot[]',
              description:
                '{ value, start, status? }. start is an instant (epoch ms); status is "available" or "booked".',
            },
            {
              name: 'locale / timeZone',
              type: 'string',
              description: 'How times are shown: in the viewer zone, in the locale format.',
            },
            { name: 'label', type: 'string', description: 'Visible label; names the radio group.' },
            {
              name: 'value / defaultValue / onValueChange',
              type: 'string | null',
              description:
                'Selected slot value, controlled or uncontrolled. onValueChange also receives the slot.',
            },
            {
              name: 'hourCycle / defaultHourCycle / onHourCycleChange',
              type: "'h12' | 'h23'",
              default: 'locale',
              description: 'Follows the locale until the user picks.',
            },
            {
              name: 'showHourCycleToggle',
              type: 'boolean',
              default: 'true',
              description: 'Show the 12h / 24h control.',
            },
            {
              name: 'loading',
              type: 'boolean',
              description: 'Static skeleton, aria-busy, and a polite "Loading available times".',
            },
            {
              name: 'disabled / name / required / form',
              type: '…',
              description: 'Form integration through Base UI RadioGroup.',
            },
            {
              name: 'labels',
              type: 'Partial<TimeSlotListLabels>',
              description: 'Translations, including the availability summary function.',
            },
            {
              name: 'className / render / ref',
              type: '…',
              description:
                'Root class (or function of state), Base UI-style render prop, and ref to the root.',
            },
            {
              name: 'createDaySlots()',
              type: 'function',
              description:
                'Builds a day of slots by wall-clock time in a zone, skipping times that do not exist on DST days.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="accessibility" title="Accessibility">
        <Prose>
          <p>
            <strong>Why a radio group, not a listbox.</strong> It is a single choice from options
            that are all visible inline and submitted with a form. That is what radio semantics
            mean, and what screen reader users expect from them. A listbox suggests a select-like
            widget. Base UI has a RadioGroup primitive with form integration; it has no standalone
            listbox.
          </p>
          <p>
            <strong>Booked slots</strong> are disabled radios: arrow keys skip them (in a
            one-dimensional list, skipping does not disorient, unlike a calendar grid). They stay
            visible and are named &ldquo;10:00, Booked&rdquo;, and the summary (&ldquo;4 times
            available&rdquo;) describes the group.
          </p>
          <p>
            <strong>DST.</strong> On a fall-back day two slots can both read 1:30. When labels would
            repeat, each gets its zone abbreviation: &ldquo;1:30 AM EDT&rdquo; and &ldquo;1:30 AM
            EST&rdquo;.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="motion" title="Motion">
        <Prose>
          <p>
            <strong>None, on purpose.</strong> This list is scanned by holding arrow keys and by
            typing. Any per-slot transition would run on every key repeat and make keyboard users
            wait for the UI. Selection changes instantly. Even the loading skeleton is static.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
