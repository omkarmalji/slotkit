/** The slotkit mark: a 2 x 2 calendar grid with one selected (ink) and one "today" (cobalt) cell. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={className}>
      <rect
        x="1"
        y="1"
        width="18"
        height="18"
        rx="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="5" y="5" width="4" height="4" rx="1" fill="currentColor" />
      <rect
        x="11.25"
        y="5.25"
        width="3.5"
        height="3.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect
        x="5.25"
        y="11.25"
        width="3.5"
        height="3.5"
        rx="0.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="11" y="11" width="4" height="4" rx="1" className="fill-accent" />
    </svg>
  );
}
