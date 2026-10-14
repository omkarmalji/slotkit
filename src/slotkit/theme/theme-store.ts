/**
 * Theme preference: 'system' | 'light' | 'dark', stored in localStorage.
 *
 * Colors are `light-dark()` tokens, so the only thing a preference changes is
 * `[data-theme]` on <html>, which pins `color-scheme`. 'system' removes the attribute
 * and lets the OS decide, including with JavaScript off.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'slotkit-theme';
const CHANGE_EVENT = 'slotkit-theme-change';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    // Storage can throw (privacy mode, blocked cookies). Fall back to the OS.
    return 'system';
  }
}

export function applyThemePreference(
  preference: ThemePreference,
  root = document.documentElement,
): void {
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Still apply for this page view even if it cannot be remembered.
  }
  applyThemePreference(preference);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore: same-tab changes and changes from other tabs. */
export function subscribeToThemePreference(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    applyThemePreference(readThemePreference());
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * Inline, render-blocking script for <head>. Runs before first paint so an explicit
 * light or dark choice never flashes the other theme. Kept tiny and dependency-free;
 * it must stay in sync with readThemePreference/applyThemePreference above.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}})();`;
