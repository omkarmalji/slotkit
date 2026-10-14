import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteHeader } from '@/docs/site-header';
import { themeScript } from '@/slotkit/theme/theme-store';
import { fragmentMono, instrumentSans } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'slotkit', template: '%s · slotkit' },
  description:
    'Accessible scheduling components built on Base UI: a keyboard-first calendar, time slots and a timezone picker that get DST right.',
};

export const viewport: Viewport = {
  // <meta name="theme-color"> cannot read CSS variables, so these are --sk-color-canvas
  // converted to sRGB hex. Update them if the canvas token changes.
  themeColor: [
    // check-hardcoded-ignore-next-line
    { media: '(prefers-color-scheme: light)', color: '#f7f4ee' },
    // check-hardcoded-ignore-next-line
    { media: '(prefers-color-scheme: dark)', color: '#13100d' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is set by themeScript before hydration, so React must not compare it.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${fragmentMono.variable}`}
    >
      <head>
        {/* Render-blocking on purpose: applies a stored light/dark choice before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div className="root">
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-(--sk-z-overlay) focus:rounded-sm focus:bg-raised focus:px-3 focus:py-2 focus:text-sm focus:shadow-popup"
          >
            Skip to content
          </a>
          <SiteHeader />
          <div id="content" tabIndex={-1} className="outline-none">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
