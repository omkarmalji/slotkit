'use client';

import { Popover as BasePopover } from '@base-ui/react/popover';
import type { ComponentProps, ReactNode } from 'react';
import { cx, mergeClassName, type StatefulClassName } from '../utils/cx';

/*
 * slotkit's popover: Base UI's parts, re-exported, plus one styled `PopoverContent` that
 * assembles Portal, Positioner and Popup. Base UI owns focus, dismissal, Escape and
 * positioning; this file only adds tokens and motion.
 */

export const PopoverRoot = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;
export const PopoverClose = BasePopover.Close;
export const PopoverTitle = BasePopover.Title;
export const PopoverDescription = BasePopover.Description;

type PopupProps = ComponentProps<typeof BasePopover.Popup>;
type PositionerProps = ComponentProps<typeof BasePopover.Positioner>;

export type PopoverContentProps = Omit<PopupProps, 'className'> & {
  side?: PositionerProps['side'];
  align?: PositionerProps['align'];
  sideOffset?: number;
  className?: StatefulClassName<BasePopover.Popup.State>;
  children: ReactNode;
};

/**
 * Motion: scales and fades from the trigger (`--transform-origin`), so it is clear where the
 * popup came from. Exit is faster and eases in. Under reduced motion the scale token is 1,
 * so only the fade remains. Transitions, not keyframes, so closing mid-open reverses smoothly.
 */
export const popoverPopupClassName = cx(
  'origin-(--transform-origin) rounded-lg bg-raised p-3 text-ink shadow-popup outline-none',
  'max-h-(--available-height) overflow-auto',
  'transition-[opacity,scale] duration-base ease-out',
  'data-starting-style:scale-(--sk-motion-popup-scale) data-starting-style:opacity-0',
  'data-ending-style:scale-(--sk-motion-popup-scale) data-ending-style:opacity-0',
  'data-ending-style:duration-fast data-ending-style:ease-in',
);

export function PopoverContent({
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  className,
  children,
  ...popupProps
}: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-(--sk-z-overlay)"
      >
        <BasePopover.Popup
          {...popupProps}
          className={mergeClassName(popoverPopupClassName, className)}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
