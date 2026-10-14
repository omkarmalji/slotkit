'use client';

import { useSyncExternalStore } from 'react';
import {
  readThemePreference,
  setThemePreference,
  subscribeToThemePreference,
  type ThemePreference,
} from './theme-store';

/**
 * The server cannot know the stored preference, so it renders 'system'. On the client,
 * useSyncExternalStore hydrates with that same server value and then switches to the
 * stored one, so there is no hydration mismatch. The page itself never flashes because
 * `themeScript` already applied the theme before paint; only the switcher's checked
 * state catches up.
 */
export function useThemePreference(): [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    readThemePreference,
    () => 'system' as const,
  );
  return [preference, setThemePreference];
}
