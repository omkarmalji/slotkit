import { findViolations } from './hardcoded-rules';

const rules = (src: string) => findViolations(src).map((v) => v.rule);

describe('findViolations', () => {
  it('allows token-backed utilities and Base UI data-attribute variants', () => {
    const src = `const c = 'bg-surface text-ink p-3 data-selected:bg-ink data-[side=top]:origin-bottom origin-(--transform-origin)';`;
    expect(findViolations(src)).toEqual([]);
  });

  it('allows arbitrary values that reference a token', () => {
    expect(findViolations(`'w-[var(--sk-size-cell)]'`)).toEqual([]);
  });

  it('flags arbitrary Tailwind values', () => {
    expect(rules(`'p-[13px] bg-[#fff]'`)).toContain('arbitrary Tailwind value');
  });

  it('flags default palette colors', () => {
    expect(rules(`'bg-blue-500 text-white'`)).toEqual([
      'default Tailwind palette color',
      'default Tailwind palette color',
    ]);
  });

  it('flags hex colors, color functions and raw lengths', () => {
    expect(rules(`style={{ color: '#ff0000' }}`)).toContain('hex color');
    expect(rules(`style={{ color: 'oklch(50% 0.1 250)' }}`)).toContain('color function');
    expect(rules(`style={{ padding: '12px', transitionDuration: '200ms' }}`)).toEqual([
      'raw length or duration',
      'raw length or duration',
    ]);
  });

  it('skips only the line after an explicit ignore pragma', () => {
    const src = `// check-hardcoded-ignore-next-line\nconst a = '#fff';\nconst b = '#000';`;
    expect(findViolations(src).map((v) => v.line)).toEqual([3]);
  });

  it('ignores comments', () => {
    expect(findViolations(`// 12px gap, see #123\n/* bg-blue-500 */ const a = 1;`)).toEqual([]);
  });
});
