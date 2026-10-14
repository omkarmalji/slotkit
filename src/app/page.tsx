import Link from 'next/link';
import { GITHUB_URL } from '@/docs/nav';
import { BookingHero } from './home/booking-hero';

const POINTS = [
  {
    title: 'Keyboard first',
    body: 'Arrows, Page Up / Down, Home / End and typeahead. Every step works without a mouse.',
  },
  {
    title: 'Time zones done right',
    body: 'Slots are shown in your zone, across daylight saving changes and half-hour offsets.',
  },
  {
    title: 'Built on Base UI',
    body: 'Thin, typed wrappers over headless primitives, styled with design tokens.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-page px-4 sm:px-6">
      {/*
        On phones the live demo comes straight after the headline, so the first thing a
        visitor meets is something to use. On wide screens they sit side by side.
      */}
      <div className="grid gap-x-14 gap-y-8 pt-8 pb-16 lg:grid-cols-12 lg:pt-16">
        <h1 className="max-w-xl text-2xl font-semibold tracking-display text-ink sm:text-display lg:col-span-5 lg:row-start-1 lg:self-end">
          Booking components that get time right.
        </h1>

        <div className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center">
          <BookingHero />
        </div>

        <div className="max-w-xl lg:col-span-5 lg:row-start-2 lg:self-start">
          <p className="text-lg text-ink-muted">
            A calendar, time slots and time zone handling for scheduling flows. Accessible, keyboard
            friendly, and correct on the days the clocks change.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/components/date-picker"
              className="inline-flex target items-center rounded-sm bg-selected px-4 text-sm font-medium text-selected-ink hover:opacity-90"
            >
              Browse components
            </Link>
            <a
              href={GITHUB_URL}
              className="inline-flex target items-center rounded-sm border border-rule-strong px-4 text-sm font-medium text-ink hover:bg-hover"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>

      <ul className="grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-3">
        {POINTS.map((p) => (
          <li key={p.title} className="bg-canvas p-5">
            <p className="text-sm font-semibold text-ink">{p.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
          </li>
        ))}
      </ul>
      <div className="h-24" />
    </main>
  );
}
