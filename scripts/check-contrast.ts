/**
 * Checks every declared token pair (scripts/contrast-pairs.ts) in both themes against
 * WCAG 2.2 AA and fails on any miss. Reads the real token file, so it cannot drift.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, parseTokens, resolveToken, type Theme } from './contrast';
import { PAIRS } from './contrast-pairs';

const css = readFileSync(
  join(import.meta.dirname, '..', 'src', 'slotkit', 'tokens', 'tokens.css'),
  'utf8',
);
const tokens = parseTokens(css);
const REQUIRED = { text: 4.5, ui: 3 } as const;

let failures = 0;
const rows: string[] = [];
for (const theme of ['light', 'dark'] as Theme[]) {
  for (const pair of PAIRS) {
    const fg = resolveToken(tokens, `--sk-color-${pair.fg}`, theme);
    const bg = resolveToken(tokens, `--sk-color-${pair.bg}`, theme);
    const ratio = contrastRatio(fg, bg);
    const required = REQUIRED[pair.kind];
    const ok = ratio >= required;
    if (!ok) failures++;
    rows.push(
      `${ok ? 'pass' : 'FAIL'}  ${theme.padEnd(5)}  ${ratio.toFixed(2).padStart(5)}:1  (>= ${required})  ` +
        `${pair.fg} on ${pair.bg}  [${pair.use}]`,
    );
  }
}

const verbose = process.argv.includes('--verbose');
for (const row of rows) if (verbose || row.startsWith('FAIL')) console.log(row);

if (failures > 0) {
  console.error(`\ncheck-contrast: ${failures} of ${rows.length} pair checks fail WCAG 2.2 AA.`);
  process.exit(1);
}
console.log(`check-contrast: all ${rows.length} pair checks pass WCAG 2.2 AA in light and dark.`);
