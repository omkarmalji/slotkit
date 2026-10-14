'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/slotkit/utils/cx';
import { NAV } from './nav';

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Sections" className="sticky top-14 hidden h-fit w-52 shrink-0 py-14 lg:block">
      {NAV.map((group) => (
        <div key={group.label} className="mb-6">
          <p className="mb-2 px-2 text-xs font-medium tracking-caps text-ink-muted uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={cx(
                      'block rounded-sm px-2 py-1.5 text-sm',
                      current
                        ? 'bg-sunken font-medium text-ink'
                        : 'text-ink-muted hover:bg-hover hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
