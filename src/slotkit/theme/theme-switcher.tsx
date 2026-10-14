'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { useId, type ComponentType } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '../icons/icons';
import { cx } from '../utils/cx';
import type { ThemePreference } from './theme-store';
import { useThemePreference } from './use-theme-preference';

const OPTIONS: { value: ThemePreference; label: string; Icon: ComponentType }[] = [
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

/** Exported so docs can render single options in a forced state. */
export const themeOptionClassName = cx(
  'inline-flex target items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 text-sm text-ink-muted select-none',
  'transition-colors duration-fast ease-standard',
  'hover:bg-hover hover:text-ink',
  // The border is the 3:1 state indicator (WCAG 1.4.11); the raised fill alone is too subtle.
  'data-checked:border-rule-strong data-checked:bg-raised data-checked:text-ink data-checked:shadow-raised',
  'data-disabled:text-ink-subtle',
  'focus-visible:outline-offset-0',
);

export const themeGroupClassName =
  'inline-flex items-center gap-0.5 rounded-md border border-rule bg-sunken p-0.5';

export type ThemeSwitcherProps = {
  className?: string;
  /** Hide option text on narrow screens; it stays available to screen readers. */
  compact?: boolean;
};

/**
 * System / Light / Dark as a radio group: one choice from a set, so radio semantics,
 * arrow-key navigation and a single tab stop come from Base UI's RadioGroup.
 */
export function ThemeSwitcher({ className, compact = true }: ThemeSwitcherProps) {
  const [preference, setPreference] = useThemePreference();
  const labelId = useId();

  return (
    <RadioGroup
      value={preference}
      onValueChange={(value) => setPreference(value as ThemePreference)}
      aria-labelledby={labelId}
      className={cx(themeGroupClassName, className)}
    >
      <span id={labelId} className="sr-only">
        Theme
      </span>
      {OPTIONS.map(({ value, label, Icon }) => (
        <Radio.Root key={value} value={value} className={themeOptionClassName}>
          <Icon />
          <span className={cx(compact && 'max-sm:sr-only')}>{label}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
