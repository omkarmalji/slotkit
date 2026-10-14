/**
 * WCAG contrast for slotkit tokens. Pure functions, unit tested in contrast.test.ts.
 *
 * Tokens are authored as `--sk-color-x: light-dark(oklch(...), oklch(...))` or as
 * `var(--sk-color-y)` aliases. This module resolves a token to an sRGB color for a given
 * theme and computes the WCAG 2.x contrast ratio.
 */
export type Theme = 'light' | 'dark';
export type Rgba = { r: number; g: number; b: number; a: number }; // encoded sRGB, 0..1

/** Parses `oklch(L% C H[deg] [/ A%])` into encoded sRGB, clipping to the sRGB gamut. */
export function parseOklch(value: string): Rgba {
  const m = value
    .trim()
    .match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/);
  if (!m) throw new Error(`Unsupported color: ${value}`);
  const L = Number(m[1]) / 100;
  const C = Number(m[2]);
  const h = (Number(m[3]) * Math.PI) / 180;
  const alpha = m[4] === undefined ? 1 : Number(m[4]) / (m[5] === '%' ? 100 : 1);

  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, c)));

  const [r, g, bl] = linear.map(encode) as [number, number, number];
  return { r, g, b: bl, a: alpha };
}

function encode(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

function decode(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Composites a translucent color over an opaque one, as browsers do in encoded sRGB. */
export function over(top: Rgba, bottom: Rgba): Rgba {
  const mix = (t: number, b: number) => t * top.a + b * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const opaqueFg = fg.a < 1 ? over(fg, bg) : fg;
  const l1 = relativeLuminance(opaqueFg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Reads every `--sk-color-*` declaration (first one wins: the base theme, not overrides). */
export function parseTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const m of css.matchAll(/(--sk-color-[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = m as unknown as [string, string, string];
    if (!tokens.has(name)) tokens.set(name, value.replace(/\s+/g, ' ').trim());
  }
  return tokens;
}

/** Splits `light-dark(a, b)` at its top-level comma. */
function splitLightDark(value: string): [string, string] | null {
  const inner = value.match(/^light-dark\((.*)\)$/)?.[1];
  if (inner === undefined) return null;
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0)
      return [inner.slice(0, i).trim(), inner.slice(i + 1).trim()];
  }
  throw new Error(`Malformed light-dark(): ${value}`);
}

export function resolveToken(
  tokens: Map<string, string>,
  name: string,
  theme: Theme,
  seen = new Set<string>(),
): Rgba {
  if (seen.has(name)) throw new Error(`Circular token reference: ${name}`);
  seen.add(name);
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`Unknown token: ${name}`);

  const alias = raw.match(/^var\((--sk-color-[\w-]+)\)$/)?.[1];
  if (alias) return resolveToken(tokens, alias, theme, seen);

  const pair = splitLightDark(raw);
  return parseOklch(pair ? pair[theme === 'light' ? 0 : 1] : raw);
}
