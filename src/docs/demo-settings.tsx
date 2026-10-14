'use client';

import { DirectionProvider } from '@base-ui/react/direction-provider';
import { createContext, useContext, useId, useMemo, useState, type ReactNode } from 'react';
import { ClockIcon, GlobeIcon } from '@/slotkit/icons/icons';

/*
 * Locale and timezone for live demos. Every demo on a page reads the same settings,
 * so switching to ar-EG or Australia/Lord_Howe shows RTL layout or a 30-minute DST
 * shift across the whole page at once.
 */

export const DEMO_LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ar-EG', label: 'العربية (RTL)' },
] as const;

export const DEMO_TIME_ZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Australia/Lord_Howe',
  'Pacific/Auckland',
  'UTC',
] as const;

export type DemoSettings = {
  locale: string;
  timeZone: string;
  dir: 'ltr' | 'rtl';
};

const DemoSettingsContext = createContext<DemoSettings | null>(null);
const SetDemoSettingsContext = createContext<
  ((next: Partial<Omit<DemoSettings, 'dir'>>) => void) | null
>(null);

function directionOf(locale: string): 'ltr' | 'rtl' {
  // Intl.Locale exposes the writing direction as getTextInfo() (newer) or textInfo (older).
  const loc = new Intl.Locale(locale) as Intl.Locale & {
    getTextInfo?: () => { direction?: string };
    textInfo?: { direction?: string };
  };
  const direction = loc.getTextInfo?.().direction ?? loc.textInfo?.direction;
  return direction === 'rtl' ? 'rtl' : 'ltr';
}

export function DemoSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ locale: 'en-US', timeZone: 'America/New_York' });
  const value = useMemo<DemoSettings>(
    () => ({ ...state, dir: directionOf(state.locale) }),
    [state],
  );
  return (
    <DemoSettingsContext.Provider value={value}>
      <SetDemoSettingsContext.Provider value={(next) => setState((s) => ({ ...s, ...next }))}>
        {children}
      </SetDemoSettingsContext.Provider>
    </DemoSettingsContext.Provider>
  );
}

export function useDemoSettings(): DemoSettings {
  const ctx = useContext(DemoSettingsContext);
  if (!ctx) throw new Error('useDemoSettings must be used inside <DemoSettingsProvider>.');
  return ctx;
}

const selectClass =
  'target-min rounded-sm border border-rule-strong bg-raised px-2 py-1 text-sm text-ink hover:bg-hover';

export function DemoToolbar() {
  const { locale, timeZone } = useDemoSettings();
  const set = useContext(SetDemoSettingsContext);
  const localeId = useId();
  const zoneId = useId();
  if (!set) throw new Error('DemoToolbar must be used inside <DemoSettingsProvider>.');

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
      <div className="flex items-center gap-2">
        <GlobeIcon />
        <label htmlFor={localeId}>Locale</label>
        <select
          id={localeId}
          className={selectClass}
          value={locale}
          onChange={(e) => set({ locale: e.target.value })}
        >
          {DEMO_LOCALES.map((l) => (
            <option key={l.value} value={l.value} lang={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <ClockIcon />
        <label htmlFor={zoneId}>Time zone</label>
        <select
          id={zoneId}
          className={selectClass}
          value={timeZone}
          onChange={(e) => set({ timeZone: e.target.value })}
        >
          {DEMO_TIME_ZONES.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Applies the demo locale's language and direction to its subtree, for markup and Base UI. */
export function DemoLocaleScope({ children }: { children: ReactNode }) {
  const { locale, dir } = useDemoSettings();
  return (
    <DirectionProvider direction={dir}>
      <div lang={locale} dir={dir} className="w-full">
        {children}
      </div>
    </DirectionProvider>
  );
}
