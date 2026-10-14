import type { Metadata } from 'next';
import { getContrastReport } from '@/docs/contrast-report';
import { DocHeader, DocPage, DocSection, Prose } from '@/docs/doc-parts';
import { ThemeSwitcherDocs } from './theme-switcher-docs';

export const metadata: Metadata = {
  title: 'Foundations',
  description: 'Design tokens, light and dark themes, contrast, type, space, focus and motion.',
};

const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  { label: 'Surfaces', tokens: ['canvas', 'sunken', 'surface', 'raised'] },
  { label: 'Text', tokens: ['ink', 'ink-muted', 'ink-subtle'] },
  { label: 'Lines', tokens: ['rule', 'rule-strong'] },
  { label: 'Interaction', tokens: ['hover', 'pressed', 'selected', 'focus'] },
  { label: 'Accent', tokens: ['accent', 'accent-subtle'] },
  { label: 'Status', tokens: ['success', 'danger', 'warning', 'unavailable'] },
];

const TYPE_SCALE = ['display', '3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs', '2xs'] as const;
const TYPE_CLASS: Record<(typeof TYPE_SCALE)[number], string> = {
  display: 'text-display tracking-display font-semibold',
  '3xl': 'text-3xl tracking-display font-semibold',
  '2xl': 'text-2xl tracking-tight font-semibold',
  xl: 'text-xl tracking-tight font-semibold',
  lg: 'text-lg',
  base: 'text-base',
  sm: 'text-sm',
  xs: 'text-xs',
  '2xs': 'text-2xs',
};
const SPACE_STEPS = [1, 2, 3, 4, 6, 8, 12, 16] as const;
const SPACE_CLASS: Record<(typeof SPACE_STEPS)[number], string> = {
  1: 'w-1',
  2: 'w-2',
  3: 'w-3',
  4: 'w-4',
  6: 'w-6',
  8: 'w-8',
  12: 'w-12',
  16: 'w-16',
};
const RADII = [
  { token: 'xs', className: 'rounded-xs' },
  { token: 'sm', className: 'rounded-sm' },
  { token: 'md', className: 'rounded-md' },
  { token: 'lg', className: 'rounded-lg' },
  { token: 'full', className: 'rounded-full' },
];
const MOTION = [
  { token: '--sk-duration-instant', use: 'Press feedback, selection ink' },
  { token: '--sk-duration-fast', use: 'Hover and color changes (default)' },
  { token: '--sk-duration-base', use: 'Popover enter, month change' },
  { token: '--sk-duration-slow', use: 'Dialog enter' },
  { token: '--sk-ease-out', use: 'Things arriving: popups, month slide' },
  { token: '--sk-ease-in', use: 'Things leaving' },
  { token: '--sk-ease-standard', use: 'State changes in place' },
];

function ThemePanel({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div data-theme={theme} className="rounded-lg border border-rule bg-canvas p-5 text-ink">
      <p className="mb-4 text-sm font-medium">{theme === 'light' ? 'Light' : 'Dark'}</p>
      <div className="space-y-5">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs tracking-caps text-ink-muted uppercase">{group.label}</p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {group.tokens.map((token) => (
                <li key={token} className="flex items-center gap-2">
                  <span
                    className="size-6 shrink-0 rounded-sm border border-rule"
                    style={{ backgroundColor: `var(--sk-color-${token})` }}
                  />
                  <span className="truncate font-mono text-xs">{token}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoundationsPage() {
  const report = getContrastReport();

  return (
    <div className="mx-auto max-w-page px-4 sm:px-6">
      <DocPage>
        <DocHeader eyebrow="Foundations" title="Tokens and themes">
          Every color, size, radius and duration in slotkit is a CSS custom property. Components use
          only these, through Tailwind utilities mapped onto them. A script fails CI if a hardcoded
          value sneaks in.
        </DocHeader>

        <DocSection
          id="color"
          title="Color"
          description="Each token holds a light and a dark value via CSS light-dark(). The dark theme is designed on its own: a warm brown-black base, lighter surfaces for raised layers instead of shadows, warm off-white text and its own cobalt."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ThemePanel theme="light" />
            <ThemePanel theme="dark" />
          </div>
        </DocSection>

        <DocSection
          id="contrast"
          title="Contrast"
          description={
            <>
              Every pairing the components actually use, computed at build time by the same code as{' '}
              <code className="font-mono text-sm">npm run check:contrast</code>, which fails CI
              below WCAG 2.2 AA: 4.5:1 for text, 3:1 for UI and focus.
            </>
          }
        >
          <div className="overflow-x-auto rounded-md border border-rule">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Contrast ratios for token pairs in light and dark themes
              </caption>
              <thead className="bg-sunken text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">
                    Pair
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-start font-medium">
                    Used for
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-end font-medium">
                    Light
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-end font-medium">
                    Dark
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-end font-medium">
                    Needs
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface tabular">
                {report.map((row) => (
                  <tr key={`${row.fg}-${row.bg}`} className="border-t border-rule">
                    <th
                      scope="row"
                      className="font-normal px-4 py-2 text-start font-mono text-xs text-ink"
                    >
                      {row.fg} on {row.bg}
                    </th>
                    <td className="px-4 py-2 text-ink-muted">{row.use}</td>
                    <td className="px-4 py-2 text-end text-ink">{row.light.toFixed(2)}</td>
                    <td className="px-4 py-2 text-end text-ink">{row.dark.toFixed(2)}</td>
                    <td className="px-4 py-2 text-end text-ink-muted">{row.required}:1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DocSection>

        <DocSection
          id="type"
          title="Type"
          description="Instrument Sans with tabular figures for every date and time, so columns of numbers line up. Fragment Mono for code. Both self-hosted."
        >
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-surface">
            {TYPE_SCALE.map((step) => (
              <li key={step} className="flex items-baseline gap-6 px-5 py-3">
                <span className="w-16 shrink-0 font-mono text-xs text-ink-muted">{step}</span>
                <span className={`${TYPE_CLASS[step]} truncate text-ink tabular`}>
                  Tue 14 Oct, 09:30
                </span>
              </li>
            ))}
          </ul>
        </DocSection>

        <DocSection
          id="space"
          title="Space and radius"
          description="A four-pixel base unit. Radii stay small: precise, not bubbly."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ul className="space-y-2 rounded-lg border border-rule bg-surface p-5">
              {SPACE_STEPS.map((step) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="w-8 font-mono text-xs text-ink-muted tabular">{step * 4}px</span>
                  <span className={`${SPACE_CLASS[step]} h-3 bg-accent`} />
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap items-end gap-4 rounded-lg border border-rule bg-surface p-5">
              {RADII.map((r) => (
                <li key={r.token} className="flex flex-col items-center gap-2">
                  <span className={`size-12 border border-rule-strong bg-sunken ${r.className}`} />
                  <span className="font-mono text-xs text-ink-muted">{r.token}</span>
                </li>
              ))}
            </ul>
          </div>
        </DocSection>

        <DocSection
          id="elevation"
          title="Elevation and focus"
          description="Paper casts soft warm shadows; in dark, raised layers get lighter and gain a hairline outline. The focus ring is cobalt with a gap, and passes 3:1 on every surface in both themes."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-surface p-5 text-sm text-ink-muted shadow-raised">
              Raised
            </div>
            <div className="rounded-lg bg-raised p-5 text-sm text-ink-muted shadow-popup">
              Popup
            </div>
            <div className="flex items-center justify-center rounded-lg border border-rule bg-surface p-5">
              <span
                data-preview="focus-visible"
                className="rounded-sm border border-rule-strong px-3 py-1.5 text-sm text-ink"
              >
                Focus ring
              </span>
            </div>
          </div>
        </DocSection>

        <DocSection
          id="motion"
          title="Motion"
          description="Short and purposeful. Movement drops to zero under reduced motion; only opacity remains."
        >
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-surface text-sm">
            {MOTION.map((m) => (
              <li key={m.token} className="flex flex-wrap justify-between gap-2 px-5 py-2.5">
                <code className="font-mono text-xs text-ink">{m.token}</code>
                <span className="text-ink-muted">{m.use}</span>
              </li>
            ))}
          </ul>
        </DocSection>

        <DocSection id="theme-switcher" title="Theme switcher">
          <Prose>
            <p>
              System, light or dark. A blocking inline script applies a stored choice before first
              paint, so there is no flash of the wrong theme. <strong>System</strong> stores nothing
              and follows the OS, which also works with JavaScript off.
            </p>
          </Prose>
          <ThemeSwitcherDocs />
        </DocSection>
      </DocPage>
    </div>
  );
}
