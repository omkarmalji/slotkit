import { act, renderHook } from '@testing-library/react';
import { useToday } from './use-today';

describe('useToday', () => {
  afterEach(() => vi.useRealTimers());

  it('returns the date in the given zone, not the machine zone', () => {
    vi.useFakeTimers({ now: Date.parse('2026-03-10T10:30:00Z') });
    expect(renderHook(() => useToday('Pacific/Kiritimati')).result.current).toEqual({
      year: 2026,
      month: 3,
      day: 11,
    });
    expect(renderHook(() => useToday('Pacific/Pago_Pago')).result.current).toEqual({
      year: 2026,
      month: 3,
      day: 9,
    });
  });

  it('rolls over at the zone midnight', () => {
    // 23:59:30 on 7 March in New York.
    vi.useFakeTimers({ now: Date.parse('2026-03-08T04:59:30Z') });
    const { result } = renderHook(() => useToday('America/New_York'));
    expect(result.current).toEqual({ year: 2026, month: 3, day: 7 });
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(result.current).toEqual({ year: 2026, month: 3, day: 8 });
  });
});
