import { configureAxe } from 'vitest-axe';

/**
 * axe for unit tests (jsdom).
 *
 * `color-contrast` is disabled here because jsdom has no layout or canvas, so axe cannot
 * compute colors and the rule would be silently incomplete. Contrast is verified instead by
 * `scripts/check-contrast.ts` (token pairs) and by Playwright + axe in a real browser.
 */
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
  },
});
