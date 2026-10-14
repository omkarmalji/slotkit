import type { ReactNode } from 'react';
import { KeyboardIcon } from '@/slotkit/icons/icons';
import { cx } from '@/slotkit/utils/cx';

/*
 * Building blocks for component pages. Every component page uses the same sections in the
 * same order: demo, states, API, keyboard, accessibility. A reviewer learns the layout once.
 */

export function DocPage({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-page pt-10 pb-24 sm:pt-14">{children}</main>;
}

export function DocHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-measure border-b border-rule pb-8">
      {eyebrow && (
        <p className="mb-3 text-xs font-medium tracking-caps text-ink-muted uppercase">{eyebrow}</p>
      )}
      <h1 className="text-3xl font-semibold tracking-display text-ink sm:text-display">{title}</h1>
      {children && <div className="mt-4 text-lg text-ink-muted">{children}</div>}
    </header>
  );
}

export function DocSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="mt-14">
      <h2 id={`${id}-title`} className="scroll-mt-20 text-xl font-semibold tracking-tight text-ink">
        <a href={`#${id}`} id={id} className="rounded-xs hover:underline">
          {title}
        </a>
      </h2>
      {description && <p className="mt-2 max-w-measure text-ink-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-xs border border-rule-strong bg-raised px-1.5 font-mono text-xs leading-5 text-ink">
      {children}
    </kbd>
  );
}

/** Shown above every interactive demo. */
export function KeyboardTip({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-ink-muted">
      <span className="mt-0.5 text-accent">
        <KeyboardIcon />
      </span>
      <span>
        <span className="font-medium text-ink">Keyboard only?</span> {children}
      </span>
    </p>
  );
}

export function DemoFrame({ children, toolbar }: { children: ReactNode; toolbar?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-rule bg-surface">
      {toolbar && <div className="border-b border-rule bg-sunken px-4 py-2.5">{toolbar}</div>}
      <div className="flex min-h-64 items-center justify-center p-6 sm:p-10">{children}</div>
    </div>
  );
}

function Table({
  caption,
  head,
  children,
}: {
  caption: string;
  head: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-rule">
      <table className="w-full border-collapse text-start text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-sunken text-ink-muted">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-rule px-4 py-2.5 text-start font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface">{children}</tbody>
      </table>
    </div>
  );
}

export type ApiProp = { name: string; type: string; default?: string; description: ReactNode };

export function ApiTable({ caption, props }: { caption: string; props: ApiProp[] }) {
  return (
    <Table caption={caption} head={['Prop', 'Type', 'Default', 'Description']}>
      {props.map((p) => (
        <tr key={p.name} className="align-top">
          <th
            scope="row"
            className="font-normal border-t border-rule px-4 py-3 text-start font-mono text-xs text-ink"
          >
            {p.name}
          </th>
          <td className="border-t border-rule px-4 py-3 font-mono text-xs text-ink-muted">
            {p.type}
          </td>
          <td className="border-t border-rule px-4 py-3 font-mono text-xs text-ink-muted">
            {p.default ?? '-'}
          </td>
          <td className="border-t border-rule px-4 py-3 text-ink-muted">{p.description}</td>
        </tr>
      ))}
    </Table>
  );
}

export type KeyBinding = { keys: string[][]; action: ReactNode };

/** `keys` is a list of alternatives, each a chord: [['Shift', 'PageUp']] or [['Enter'], ['Space']]. */
export function KeyboardMap({ caption, bindings }: { caption: string; bindings: KeyBinding[] }) {
  return (
    <Table caption={caption} head={['Key', 'Action']}>
      {bindings.map((b, i) => (
        <tr key={i} className="align-top">
          <th
            scope="row"
            className="font-normal border-t border-rule px-4 py-3 text-start whitespace-nowrap"
          >
            {b.keys.map((chord, j) => (
              <span key={j}>
                {j > 0 && <span className="mx-1.5 text-ink-muted">or</span>}
                {chord.map((k, n) => (
                  <span key={n}>
                    {n > 0 && <span className="mx-0.5 text-ink-muted">+</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            ))}
          </th>
          <td className="border-t border-rule px-4 py-3 text-ink-muted">{b.action}</td>
        </tr>
      ))}
    </Table>
  );
}

export type StateCell = { label: string; note?: string; render: ReactNode };

/**
 * Every visual state side by side. Interactive states (hover, active, focus-visible)
 * are forced with `data-preview`, which the theme's state variants honour.
 */
export function StatesMatrix({ cells, className }: { cells: StateCell[]; className?: string }) {
  return (
    // Cells overlap the outer border by 1px on the end and bottom edges, so a partly filled
    // last row still reads as one framed grid.
    <ul
      className={cx(
        'grid grid-cols-2 overflow-hidden rounded-lg border border-rule bg-surface sm:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {cells.map((cell) => (
        <li
          key={cell.label}
          className="-me-px -mb-px flex flex-col gap-4 border-e border-b border-rule p-4"
        >
          {/* Previews are inert: not focusable, not operable, not announced. The label below carries the meaning. */}
          <div inert className="flex min-h-16 items-center justify-center">
            {cell.render}
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{cell.label}</p>
            {cell.note && <p className="text-xs text-ink-muted">{cell.note}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'todo';
  title: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={cx(
        'max-w-measure rounded-md border px-4 py-3 text-sm',
        tone === 'todo'
          ? 'border-warning bg-warning-subtle text-ink'
          : 'border-rule bg-sunken text-ink',
      )}
    >
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-ink-muted">{children}</div>
    </aside>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-measure space-y-3 text-ink-muted [&_strong]:text-ink">{children}</div>
  );
}

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="text-xs text-ink-muted tabular">
      {children}
    </p>
  );
}
