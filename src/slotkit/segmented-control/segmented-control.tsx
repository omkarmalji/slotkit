'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { type ComponentType, type ReactNode, useId } from 'react';
import { cx } from '../utils/cx';

/*
 * A segmented control: one choice from two to five options, always one selected.
 * Built on Base UI RadioGroup, so it is a `radiogroup` with one tab stop and arrow keys.
 * Used by the theme switcher and the 12h/24h toggle.
 */

export type SegmentedOption<V extends string> = {
  value: V;
  label: string;
  icon?: ComponentType | undefined;
};

/** Exported so docs can render single segments in a forced state. */
export const segmentClassName = cx(
  'inline-flex target items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 text-sm text-ink-muted select-none',
  'transition-colors duration-fast ease-standard',
  'hover:bg-hover hover:text-ink',
  // The border is the 3:1 state indicator (WCAG 1.4.11); the raised fill alone is too subtle.
  'data-checked:border-rule-strong data-checked:bg-raised data-checked:text-ink data-checked:shadow-raised',
  'data-disabled:text-ink-subtle data-disabled:hover:bg-transparent',
  'focus-visible:outline-offset-0',
);

export const segmentedGroupClassName =
  'inline-flex items-center gap-0.5 rounded-md border border-rule bg-sunken p-0.5';

export type SegmentedControlProps<V extends string> = {
  /** Accessible name for the group. Rendered visually hidden unless `showLabel`. */
  label: string;
  showLabel?: boolean;
  options: readonly SegmentedOption<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  disabled?: boolean;
  /** Hide option text below the sm breakpoint (icons stay). Text stays available to screen readers. */
  compact?: boolean;
  size?: 'default' | 'small';
  name?: string;
  className?: string;
  /** Extra content after the options, inside the group (rare). */
  children?: ReactNode;
};

export function SegmentedControl<V extends string>({
  label,
  showLabel = false,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  compact = false,
  size = 'default',
  name,
  className,
  children,
}: SegmentedControlProps<V>) {
  const labelId = useId();
  return (
    <div className={cx('inline-flex items-center gap-2', className)}>
      <span id={labelId} className={showLabel ? 'text-xs text-ink-muted' : 'sr-only'}>
        {label}
      </span>
      <RadioGroup
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        onValueChange={(next) => onValueChange?.(next as V)}
        aria-labelledby={labelId}
        disabled={disabled}
        name={name}
        className={segmentedGroupClassName}
      >
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <Radio.Root
            key={optionValue}
            value={optionValue}
            className={cx(
              segmentClassName,
              size === 'small' && 'min-h-(--sk-target-min) px-1.5 text-xs',
            )}
          >
            {Icon && <Icon />}
            <span className={cx(compact && Icon && 'max-sm:sr-only')}>{optionLabel}</span>
          </Radio.Root>
        ))}
        {children}
      </RadioGroup>
    </div>
  );
}
