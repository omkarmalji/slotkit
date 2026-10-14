import type { Metadata } from 'next';
import { ApiTable, DocHeader, DocPage, DocSection, KeyboardMap, Prose } from '@/docs/doc-parts';
import { DatePickerDemo } from './date-picker-demo';
import { DayStates, TriggerStates } from './date-picker-states';

export const metadata: Metadata = {
  title: 'Calendar and DatePicker',
  description:
    'A keyboard-first calendar grid with roving focus, locale week start, RTL, min/max and unavailable days, plus a DatePicker built on Base UI Popover.',
};

export default function DatePickerPage() {
  return (
    <DocPage>
      <DocHeader eyebrow="Component" title="Calendar and DatePicker">
        A real grid with one tab stop and the full keyboard model. The logic lives in{' '}
        <code className="font-mono text-base">useCalendarGrid</code>, separate from styling. The
        DatePicker wraps it in Base UI&apos;s Popover, which owns focus, Escape and dismissal.
      </DocHeader>

      <DocSection
        id="demo"
        title="Demo"
        description="Switch the locale to see week start, names and digits change (Arabic also flips the grid to RTL). Switch the time zone to see “today” move."
      >
        <DatePickerDemo />
      </DocSection>

      <DocSection
        id="states"
        title="States"
        description="Day cells, then the DatePicker trigger. Interactive states are forced for display."
      >
        <div className="space-y-6">
          <DayStates />
          <TriggerStates />
        </div>
      </DocSection>

      <DocSection id="keyboard" title="Keyboard">
        <KeyboardMap
          caption="Calendar keyboard map"
          bindings={[
            {
              keys: [['Tab']],
              action:
                'Into the grid: focus lands on the selected day, else today, else the 1st. One tab stop for the whole grid.',
            },
            {
              keys: [['←'], ['→']],
              action: 'Previous / next day. Mirrored in right-to-left locales.',
            },
            { keys: [['↑'], ['↓']], action: 'Same day, previous / next week.' },
            {
              keys: [['Home'], ['End']],
              action: 'First / last day of the week, using the locale week start.',
            },
            {
              keys: [['PageUp'], ['PageDown']],
              action: 'Same day, previous / next month (clamped: 31 Jan to 28 Feb).',
            },
            {
              keys: [
                ['Shift', 'PageUp'],
                ['Shift', 'PageDown'],
              ],
              action: 'Same day, previous / next year.',
            },
            {
              keys: [['Enter'], ['Space']],
              action:
                'Select the focused day (unavailable and out-of-range days cannot be selected).',
            },
            {
              keys: [['Esc']],
              action: 'DatePicker: close without changing the value; focus returns to the trigger.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="api" title="API">
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-ink">Calendar</h3>
          <ApiTable
            caption="Calendar props"
            props={[
              {
                name: 'locale',
                type: 'string',
                description: 'BCP 47 locale. Drives names, digits and week start.',
              },
              {
                name: 'value / defaultValue',
                type: 'CalendarDate | null',
                description: 'Selected day, controlled or uncontrolled.',
              },
              {
                name: 'onValueChange',
                type: '(date, { reason }) => void',
                description: 'Fires on selection. reason is "click" or "keyboard".',
              },
              {
                name: 'month / defaultMonth / onMonthChange',
                type: 'CalendarDate',
                description:
                  'Visible month, controlled or uncontrolled. Defaults to the value, then today.',
              },
              {
                name: 'min / max',
                type: 'CalendarDate | null',
                description: 'Range limits. Focus is clamped to them; days outside are disabled.',
              },
              {
                name: 'isDateUnavailable',
                type: '(date) => boolean',
                description:
                  'Days in range that cannot be chosen. Still focusable and announced as unavailable.',
              },
              {
                name: 'timeZone',
                type: 'string',
                default: 'visitor zone',
                description:
                  'Zone used for “today”. Detected on the client without a hydration mismatch.',
              },
              {
                name: 'firstDayOfWeek',
                type: '1 to 7',
                default: 'from locale',
                description: 'Override the locale week start (1 = Monday).',
              },
              {
                name: 'dir',
                type: "'ltr' | 'rtl'",
                default: 'DirectionProvider',
                description: 'Text direction; mirrors the grid and arrow keys.',
              },
              {
                name: 'name / required / form',
                type: 'string / boolean / string',
                description: 'Form integration. Submits YYYY-MM-DD.',
              },
              {
                name: 'disabled / readOnly',
                type: 'boolean',
                default: 'false',
                description: 'Disable everything, or allow navigation without selection.',
              },
              {
                name: 'labels',
                type: 'Partial<CalendarLabels>',
                description: 'Translations for “Previous month”, “Next month”, “unavailable”.',
              },
              {
                name: 'renderDay',
                type: '(day) => ReactNode',
                description: 'Extra content inside a day, under the number.',
              },
              {
                name: 'className',
                type: 'string | (state) => string',
                description: 'Root class, or a function of { disabled, readOnly, filled }.',
              },
              {
                name: 'render',
                type: 'ReactElement | (props, state) => ReactElement',
                description: 'Replace the root element, Base UI style.',
              },
              { name: 'ref', type: 'Ref<HTMLDivElement>', description: 'Forwarded to the root.' },
            ]}
          />
          <h3 className="text-base font-semibold text-ink">DatePicker</h3>
          <ApiTable
            caption="DatePicker props"
            props={[
              {
                name: 'label',
                type: 'string',
                description:
                  'Visible label. Names the trigger (with the value) and the popup dialog.',
              },
              {
                name: 'description / errorMessage',
                type: 'ReactNode',
                description: 'Linked to the trigger with aria-describedby.',
              },
              {
                name: 'invalid',
                type: 'boolean',
                description: 'Mark invalid from outside, for example after server validation.',
              },
              {
                name: 'open / defaultOpen / onOpenChange',
                type: 'boolean',
                description: 'Popup state, controlled or uncontrolled.',
              },
              {
                name: 'name / required / disabled / form',
                type: '…',
                description:
                  'Native form validation: an empty required picker blocks submit and focuses the trigger.',
              },
              {
                name: 'placeholder / formatOptions',
                type: 'string / Intl.DateTimeFormatOptions',
                description: 'Trigger text when empty, and how a chosen date is shown.',
              },
              {
                name: 'ref',
                type: 'Ref<HTMLButtonElement>',
                description: 'Forwarded to the trigger.',
              },
              {
                name: '…Calendar props',
                type: '',
                description:
                  'locale, timeZone, min, max, isDateUnavailable, firstDayOfWeek, labels, dir, renderDay.',
              },
            ]}
          />
          <h3 className="text-base font-semibold text-ink">Data attributes</h3>
          <ApiTable
            caption="Day cell data attributes"
            props={[
              { name: 'data-selected', type: 'present', description: 'The selected day.' },
              {
                name: 'data-today',
                type: 'present',
                description: 'Today in the calendar’s time zone.',
              },
              {
                name: 'data-focused',
                type: 'present',
                description: 'The roving focus target (tabIndex 0).',
              },
              {
                name: 'data-unavailable',
                type: 'present',
                description: 'isDateUnavailable returned true.',
              },
              {
                name: 'data-disabled',
                type: 'present',
                description: 'Outside min / max, or the calendar is disabled.',
              },
            ]}
          />
        </div>
      </DocSection>

      <DocSection id="accessibility" title="Accessibility">
        <Prose>
          <p>
            <strong>Roles.</strong> A <code>table</code> with <code>role=&quot;grid&quot;</code>,
            labelled by the month heading. The grid role makes screen readers switch to focus mode
            so arrow keys reach the calendar. Each day is a <code>button</code> inside a{' '}
            <code>gridcell</code> that carries <code>aria-selected</code>. Day names are visible
            abbreviations with full names for screen readers.
          </p>
          <p>
            <strong>Names.</strong> Each day is named with the full date in the locale, plus
            &ldquo;today&rdquo; (in the locale&apos;s own word) and &ldquo;unavailable&rdquo; where
            they apply. Today also has <code>aria-current=&quot;date&quot;</code>.
          </p>
          <p>
            <strong>Unavailable and out-of-range days</strong> stay focusable with{' '}
            <code>aria-disabled</code>, so keyboard and screen reader users can find out why a day
            cannot be picked instead of having focus skip over it.
          </p>
          <p>
            <strong>Announcements.</strong> Moving focus announces the new day. The previous and
            next buttons do not move focus, so the new month is announced through a polite live
            region.
          </p>
          <p>
            <strong>DatePicker.</strong> The popup is Base UI&apos;s Popover (
            <code>role=&quot;dialog&quot;</code>, focus trapped while open). It opens with focus on
            the selected day, Escape closes it, and focus returns to the trigger. An empty required
            picker blocks form submission and moves focus to the trigger, which is then described by
            the error.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="motion" title="Motion">
        <Prose>
          <p>
            The popup scales and fades from the trigger. Changing month slides the new month in from
            the side you moved towards (flipped in RTL). Selecting a day fills it at the instant
            duration with a slight press. Focus movement inside the grid never animates, and a month
            change caused by a held key does not slide. Under reduced motion, only fades remain.
          </p>
        </Prose>
      </DocSection>
    </DocPage>
  );
}
