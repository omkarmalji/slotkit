import Link from 'next/link';
import { DocPage } from '@/docs/doc-parts';

export default function HomePage() {
  return (
    <DocPage>
      <div className="max-w-measure">
        <p className="mb-4 text-xs font-medium tracking-caps text-ink-muted uppercase">
          Work in progress
        </p>
        <h1 className="text-3xl font-semibold tracking-display text-ink sm:text-display">
          Scheduling components that respect time.
        </h1>
        <p className="mt-5 text-lg text-ink-muted">
          slotkit is a small set of booking components built on Base UI: a keyboard-first calendar,
          time slots and a timezone picker that get daylight saving right. Every component works
          with the keyboard alone, in light and dark, in any locale.
        </p>
        <p className="mt-8">
          <Link
            href="/foundations"
            className="inline-flex target items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
          >
            Start with the foundations
          </Link>
        </p>
      </div>
    </DocPage>
  );
}
