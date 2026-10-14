import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const PAGES = ['/', '/components/foundations'];

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    for (const path of PAGES) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }
  });
}

test('an explicit dark choice also passes axe on a light OS', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => window.localStorage.setItem('slotkit-theme', 'dark'));
  await page.goto('/components/foundations');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoAxeViolations(page);
});
