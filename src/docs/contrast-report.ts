import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, parseTokens, resolveToken } from '../../scripts/contrast';
import { PAIRS, type Pair } from '../../scripts/contrast-pairs';

export type ContrastRow = Pair & { light: number; dark: number; required: number };

/**
 * The same computation `npm run check:contrast` runs in CI, rendered on the Foundations
 * page at build time. The docs cannot claim a ratio the check does not enforce.
 */
export function getContrastReport(): ContrastRow[] {
  const css = readFileSync(join(process.cwd(), 'src', 'slotkit', 'tokens', 'tokens.css'), 'utf8');
  const tokens = parseTokens(css);
  return PAIRS.map((pair) => {
    const ratio = (theme: 'light' | 'dark') =>
      contrastRatio(
        resolveToken(tokens, `--sk-color-${pair.fg}`, theme),
        resolveToken(tokens, `--sk-color-${pair.bg}`, theme),
      );
    return {
      ...pair,
      light: ratio('light'),
      dark: ratio('dark'),
      required: pair.kind === 'text' ? 4.5 : 3,
    };
  });
}
