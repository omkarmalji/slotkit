import {
  applyThemePreference,
  readThemePreference,
  setThemePreference,
  THEME_STORAGE_KEY,
  themeScript,
} from './theme-store';

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('theme store', () => {
  it('defaults to system when nothing is stored or the value is invalid', () => {
    expect(readThemePreference()).toBe('system');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readThemePreference()).toBe('system');
  });

  it('stores light/dark and pins data-theme; system clears both', () => {
    setThemePreference('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    setThemePreference('system');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('still applies the theme when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setThemePreference('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    spy.mockRestore();
  });

  it('applyThemePreference can target any root', () => {
    const el = document.createElement('div');
    applyThemePreference('dark', el);
    expect(el.dataset.theme).toBe('dark');
  });

  it('the inline script applies a stored choice and ignores garbage', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    new Function(themeScript)();
    expect(document.documentElement.dataset.theme).toBe('dark');

    delete document.documentElement.dataset.theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, '"><script>');
    new Function(themeScript)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
