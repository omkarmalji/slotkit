import { cx, mergeClassName } from './cx';

describe('cx', () => {
  it('joins truthy class names', () => {
    expect(cx('a', false, 'b', null, undefined, '', 'c')).toBe('a b c');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cx(false, null)).toBe('');
  });
});

describe('mergeClassName', () => {
  type State = { selected: boolean };

  it('puts consumer classes after component classes', () => {
    expect(mergeClassName<State>('base', 'mine')({ selected: false })).toBe('base mine');
  });

  it('resolves state functions on both sides', () => {
    const merged = mergeClassName<State>(
      (s) => (s.selected ? 'on' : 'off'),
      (s) => (s.selected ? 'consumer-on' : undefined),
    );
    expect(merged({ selected: true })).toBe('on consumer-on');
    expect(merged({ selected: false })).toBe('off');
  });
});
