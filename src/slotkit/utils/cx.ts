export type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. */
export function cx(...parts: ClassValue[]): string {
  let out = '';
  for (const part of parts) {
    if (part) out = out ? `${out} ${part}` : part;
  }
  return out;
}

/**
 * Base UI accepts `className` as a string or as a function of the part's state.
 * slotkit components accept the same, and merge it after their own classes so
 * consumer classes come last.
 */
export type StatefulClassName<State> = string | ((state: State) => string | undefined);

export function mergeClassName<State>(
  base: string | ((state: State) => string),
  className: StatefulClassName<State> | undefined,
): (state: State) => string {
  return (state) =>
    cx(
      typeof base === 'function' ? base(state) : base,
      typeof className === 'function' ? className(state) : className,
    );
}
