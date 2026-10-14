/**
 * Rules for `check-hardcoded`: component code must only use design tokens.
 * Kept separate from the CLI so the rules themselves are unit tested.
 */
export type Violation = { line: number; column: number; match: string; rule: string };

const TAILWIND_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white';

const RULES: { name: string; pattern: RegExp }[] = [
  {
    // `p-[13px]`, `bg-[#fff]`, `w-[calc(...)]`. Allowed: arbitrary *variants* such as
    // `data-[side=top]:` (they end in a colon), `var(--sk-*)` tokens, and transition
    // property lists such as `transition-[opacity,scale]`, which name properties, not values.
    name: 'arbitrary Tailwind value',
    pattern:
      /(?<![\w-])(?!transition-\[[a-z-]+(?:,[a-z-]+)*\])[a-z][\w-]*-\[(?!var\(--)[^\]\s]+\](?!:)/g,
  },
  {
    name: 'default Tailwind palette color',
    pattern: new RegExp(
      `(?<![\\w-])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|shadow|decoration|accent|caret|divide|placeholder)-(?:${TAILWIND_PALETTE})(?:-\\d{2,3})?(?![\\w-])`,
      'g',
    ),
  },
  { name: 'hex color', pattern: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'color function', pattern: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/g },
  {
    // Raw lengths and durations in inline styles or class strings.
    name: 'raw length or duration',
    pattern: /(?<![\w.-])\d+(?:\.\d+)?(?:px|rem|em|ms|vh|vw)\b/g,
  },
];

/** Strips line and block comments, preserving line numbers. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/.*$/gm, (_m, prefix: string) => prefix);
}

const IGNORE_PRAGMA = 'check-hardcoded-ignore-next-line';

export function findViolations(source: string): Violation[] {
  const rawLines = source.split('\n');
  const lines = stripComments(source).split('\n');
  const violations: Violation[] = [];
  lines.forEach((text, index) => {
    // An explicit, greppable escape hatch for values that cannot be tokens
    // (for example <meta name="theme-color">, which cannot read CSS variables).
    if (index > 0 && rawLines[index - 1]?.includes(IGNORE_PRAGMA)) return;
    for (const rule of RULES) {
      for (const m of text.matchAll(rule.pattern)) {
        violations.push({
          line: index + 1,
          column: (m.index ?? 0) + 1,
          match: m[0],
          rule: rule.name,
        });
      }
    }
  });
  return violations;
}
