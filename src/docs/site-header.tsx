import Link from 'next/link';
import { ThemeSwitcher } from '@/slotkit/theme/theme-switcher';
import { GITHUB_URL } from './nav';
import { Logo } from './logo';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--sk-z-sticky) border-b border-rule bg-canvas">
      <div className="mx-auto flex h-14 max-w-page items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-sm text-base font-semibold tracking-tight text-ink"
        >
          <Logo className="size-5" />
          slotkit
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
          <Link
            href="/components/date-picker"
            className="rounded-sm px-2 py-1 text-ink-muted hover:bg-hover hover:text-ink"
          >
            Components
          </Link>
          <a
            href={GITHUB_URL}
            className="rounded-sm px-2 py-1 text-ink-muted hover:bg-hover hover:text-ink max-sm:hidden"
          >
            GitHub
          </a>
        </nav>
        <div className="ms-auto">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
