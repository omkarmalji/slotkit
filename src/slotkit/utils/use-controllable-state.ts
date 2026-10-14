'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Controlled when `value` is defined, uncontrolled otherwise, same as Base UI's convention.
 * `onChange` fires in both modes. Switching modes after mount is a bug and warns in dev.
 */
export function useControllableState<T, Details = undefined>({
  value,
  defaultValue,
  onChange,
  name = 'value',
}: {
  value: T | undefined;
  defaultValue: T;
  onChange?: ((next: T, details: Details) => void) | undefined;
  name?: string;
}): [T, (next: T, details: Details) => void] {
  const isControlled = value !== undefined;
  const wasControlled = useRef(isControlled);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && wasControlled.current !== isControlled) {
      console.error(
        `slotkit: "${name}" changed from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ${isControlled ? 'controlled' : 'uncontrolled'}. Pick one for the component's lifetime.`,
      );
      wasControlled.current = isControlled;
    }
  }, [isControlled, name]);

  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;

  const set = useCallback(
    (next: T, details: Details) => {
      if (!isControlled) setInternal(next);
      onChange?.(next, details);
    },
    [isControlled, onChange],
  );

  return [current, set];
}
