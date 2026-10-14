'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import {
  ApiTable,
  DemoFrame,
  KeyboardMap,
  KeyboardTip,
  Kbd,
  Prose,
  StatesMatrix,
} from '@/docs/doc-parts';
import { MoonIcon } from '@/slotkit/icons/icons';
import {
  segmentClassName,
  segmentedGroupClassName,
} from '@/slotkit/segmented-control/segmented-control';
import { ThemeSwitcher } from '@/slotkit/theme/theme-switcher';

function Option({
  checked = false,
  disabled = false,
  preview,
}: {
  checked?: boolean;
  disabled?: boolean;
  preview?: string;
}) {
  return (
    <RadioGroup
      value={checked ? 'dark' : 'light'}
      disabled={disabled}
      className={segmentedGroupClassName}
      aria-label="Preview"
    >
      <Radio.Root value="dark" className={segmentClassName} data-preview={preview}>
        <MoonIcon />
        <span>Dark</span>
      </Radio.Root>
    </RadioGroup>
  );
}

export function ThemeSwitcherDocs() {
  return (
    <div className="mt-6 space-y-8">
      <div className="space-y-3">
        <KeyboardTip>
          Press <Kbd>Tab</Kbd> to reach the switcher, then <Kbd>←</Kbd> <Kbd>→</Kbd> to change
          theme.
        </KeyboardTip>
        <DemoFrame>
          <ThemeSwitcher compact={false} />
        </DemoFrame>
      </div>

      <StatesMatrix
        cells={[
          { label: 'Default', render: <Option /> },
          { label: 'Hover', render: <Option preview="hover" /> },
          { label: 'Focus visible', render: <Option preview="focus-visible" /> },
          { label: 'Selected', render: <Option checked /> },
          { label: 'Selected + focus', render: <Option checked preview="focus-visible" /> },
          {
            label: 'Disabled',
            note: 'Not used by the switcher; shown for completeness.',
            render: <Option disabled />,
          },
        ]}
      />

      <ApiTable
        caption="ThemeSwitcher props"
        props={[
          {
            name: 'compact',
            type: 'boolean',
            default: 'true',
            description:
              'Hide option text below the sm breakpoint. Text stays available to screen readers.',
          },
          { name: 'className', type: 'string', description: 'Merged after the component classes.' },
        ]}
      />

      <KeyboardMap
        caption="ThemeSwitcher keyboard map"
        bindings={[
          {
            keys: [['Tab']],
            action: 'Move focus to the selected option (one tab stop for the group).',
          },
          { keys: [['→'], ['↓']], action: 'Select the next option and apply it.' },
          { keys: [['←'], ['↑']], action: 'Select the previous option and apply it.' },
        ]}
      />

      <Prose>
        <p>
          <strong>Roles:</strong> a <code>radiogroup</code> labelled &ldquo;Theme&rdquo; with three{' '}
          <code>radio</code> options, from Base UI&apos;s RadioGroup. A radio group fits better than
          a toggle button group because exactly one theme is always chosen.
        </p>
        <p>
          <strong>Hydration:</strong> the server renders &ldquo;System&rdquo; as checked; the client
          reads the stored choice through <code>useSyncExternalStore</code>, so there is no
          hydration mismatch, and the page colors were already correct before React loaded.
        </p>
      </Prose>
    </div>
  );
}
