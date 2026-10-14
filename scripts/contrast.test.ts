import { contrastRatio, parseOklch, parseTokens, resolveToken } from './contrast';

describe('parseOklch', () => {
  it('maps oklch white and black to sRGB white and black', () => {
    const white = parseOklch('oklch(100% 0 0)');
    const black = parseOklch('oklch(0% 0 0)');
    expect(white.r).toBeCloseTo(1, 3);
    expect(white.b).toBeCloseTo(1, 3);
    expect(black.g).toBeCloseTo(0, 3);
  });

  it('matches a known reference color (sRGB #0000ff is about oklch(45.2% 0.313 264.05))', () => {
    const blue = parseOklch('oklch(45.2% 0.313 264.05deg)');
    expect(blue.r).toBeLessThan(0.02);
    expect(blue.g).toBeLessThan(0.02);
    expect(blue.b).toBeGreaterThan(0.98);
  });

  it('reads alpha as a percentage or a fraction', () => {
    expect(parseOklch('oklch(50% 0 0 / 25%)').a).toBe(0.25);
    expect(parseOklch('oklch(50% 0 0 / 0.5)').a).toBe(0.5);
  });

  it('rejects colors it cannot convert rather than guessing', () => {
    expect(() => parseOklch('#fff')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for a color on itself', () => {
    const white = parseOklch('oklch(100% 0 0)');
    const black = parseOklch('oklch(0% 0 0)');
    expect(contrastRatio(black, white)).toBeCloseTo(21, 1);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5);
  });

  it('composites translucent foregrounds over the background', () => {
    const white = parseOklch('oklch(100% 0 0)');
    const halfBlack = parseOklch('oklch(0% 0 0 / 50%)');
    const ratio = contrastRatio(halfBlack, white);
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(5);
  });
});

describe('resolveToken', () => {
  const css = `
    :root {
      --sk-color-paper: light-dark(oklch(100% 0 0), oklch(0% 0 0));
      --sk-color-alias: var(--sk-color-paper);
    }
    @media (forced-colors: active) { :root { --sk-color-paper: Canvas; } }
  `;
  const tokens = parseTokens(css);

  it('picks the light or dark side of light-dark()', () => {
    expect(resolveToken(tokens, '--sk-color-paper', 'light').r).toBeCloseTo(1, 3);
    expect(resolveToken(tokens, '--sk-color-paper', 'dark').r).toBeCloseTo(0, 3);
  });

  it('follows var() aliases', () => {
    expect(resolveToken(tokens, '--sk-color-alias', 'dark').r).toBeCloseTo(0, 3);
  });

  it('ignores later overrides such as forced-colors system colors', () => {
    expect(tokens.get('--sk-color-paper')).toContain('light-dark');
  });
});
