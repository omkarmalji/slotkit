'use client';

import { MonitorIcon, MoonIcon, SunIcon } from '../icons/icons';
import { type SegmentedOption, SegmentedControl } from '../segmented-control/segmented-control';
import type { ThemePreference } from './theme-store';
import { useThemePreference } from './use-theme-preference';

const OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: 'system', label: 'System', icon: MonitorIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
];

export type ThemeSwitcherProps = {
  className?: string;
  /** Hide option text on narrow screens; it stays available to screen readers. */
  compact?: boolean;
};

/**
 * System / Light / Dark. One choice from a set, so it is a SegmentedControl (a Base UI
 * RadioGroup): radio semantics, arrow keys and a single tab stop.
 */
export function ThemeSwitcher({ className, compact = true }: ThemeSwitcherProps) {
  const [preference, setPreference] = useThemePreference();
  return (
    <SegmentedControl
      label="Theme"
      options={OPTIONS}
      value={preference}
      onValueChange={setPreference}
      compact={compact}
      {...(className ? { className } : {})}
    />
  );
}
