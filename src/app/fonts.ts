import localFont from 'next/font/local';

/*
 * Self-hosted from npm (@fontsource) so builds never depend on a font CDN.
 * next/font generates a metric-matched fallback, so swapping in the web font
 * causes no layout shift. The tokens read these through --sk-font-*-family.
 */
export const instrumentSans = localFont({
  src: '../../node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--sk-font-sans-family',
  display: 'swap',
});

export const fragmentMono = localFont({
  src: '../../node_modules/@fontsource/fragment-mono/files/fragment-mono-latin-400-normal.woff2',
  weight: '400',
  style: 'normal',
  variable: '--sk-font-mono-family',
  display: 'swap',
});
