import { act, renderHook } from '@testing-library/react';
import { useControllableState } from './use-controllable-state';

describe('useControllableState', () => {
  it('manages its own state when uncontrolled, and reports changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ value: undefined, defaultValue: 1, onChange }),
    );
    act(() => result.current[1](2, undefined));
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2, undefined);
  });

  it('follows the prop when controlled, and only reports changes', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: 0, onChange }),
      {
        initialProps: { value: 5 },
      },
    );
    act(() => result.current[1](6, undefined));
    expect(result.current[0]).toBe(5);
    expect(onChange).toHaveBeenCalledWith(6, undefined);
    rerender({ value: 6 });
    expect(result.current[0]).toBe(6);
  });

  it('treats null as a controlled value (an explicitly empty selection)', () => {
    const { result } = renderHook(() =>
      useControllableState<number | null>({ value: null, defaultValue: 3 }),
    );
    expect(result.current[0]).toBeNull();
  });
});
