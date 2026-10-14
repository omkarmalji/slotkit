/**
 * Every foreground/background pairing slotkit actually uses, with the WCAG 2.2 ratio it
 * must meet. If a component starts putting a token on a new surface, add the pair here.
 *
 *  - text: 4.5:1 (SC 1.4.3)
 *  - ui:   3:1 for component boundaries, state indicators and focus rings (SC 1.4.11)
 */
export type Pair = { fg: string; bg: string; kind: 'text' | 'ui'; use: string };

const SURFACES = ['canvas', 'sunken', 'surface', 'raised'] as const;
const each = (
  fg: string,
  kind: Pair['kind'],
  use: string,
  bgs: readonly string[] = SURFACES,
): Pair[] => bgs.map((bg) => ({ fg, bg, kind, use }));

export const PAIRS: Pair[] = [
  // Body and secondary text on every surface, and on interactive fills.
  ...each('ink', 'text', 'body text', [...SURFACES, 'hover', 'pressed', 'accent-subtle']),
  ...each('ink-muted', 'text', 'secondary text, placeholders', [...SURFACES, 'hover']),
  ...each('ink', 'text', 'text in status banners', [
    'success-subtle',
    'danger-subtle',
    'warning-subtle',
  ]),

  // Selected and accent fills.
  { fg: 'selected-ink', bg: 'selected', kind: 'text', use: 'selected date / slot label' },
  { fg: 'accent-ink', bg: 'accent', kind: 'text', use: 'primary button label' },
  { fg: 'accent-ink', bg: 'accent-hover', kind: 'text', use: 'primary button label, hover' },
  ...each('accent', 'text', 'links', ['canvas', 'surface', 'raised']),

  // Status text on surfaces and on its own subtle fill.
  ...each('success', 'text', 'success message', ['canvas', 'surface', 'raised', 'success-subtle']),
  ...each('danger', 'text', 'error message', ['canvas', 'surface', 'raised', 'danger-subtle']),
  ...each('warning', 'text', 'warning message', ['canvas', 'surface', 'raised', 'warning-subtle']),

  // Unavailable dates and booked slots still carry information, so they stay readable.
  ...each('unavailable', 'text', 'unavailable date / booked slot label', ['surface', 'raised']),

  // Component boundaries and state indicators.
  ...each('rule-strong', 'ui', 'control borders'),
  ...each('selected', 'ui', 'selected fill against its surface', ['surface', 'raised']),
  ...each('accent', 'ui', 'today marker, primary button edge', ['surface', 'raised']),
  ...each('danger', 'ui', 'invalid field border', ['surface', 'raised']),

  // Focus ring: drawn with an offset, so it sits on whatever surface holds the control.
  ...each('focus', 'ui', 'focus ring', [...SURFACES, 'hover']),
];
