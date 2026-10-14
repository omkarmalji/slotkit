import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

// 14 October 2026, 15:00 UTC: 20:30 in Kolkata, so the demo shows Thursday 15 October.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T15:00:00Z'));
});

const list = (page: Page) => page.getByRole('radiogroup', { name: /^Times on/ });
const focused = (page: Page) =>
  page.evaluate(
    () => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent,
  );

async function useLondon(page: Page) {
  await page.getByLabel('Locale').selectOption('en-GB');
  await page.getByLabel('Time zone').selectOption('Europe/London');
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test('page has no axe violations', async ({ page }) => {
      await page.goto('/components/time-slot-list');
      await expect(list(page)).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test('a slot can be chosen with the keyboard alone', async ({ page }) => {
      await page.goto('/components/time-slot-list');
      await useLondon(page);
      // 09:00 in Kolkata is 04:30 in London. 10:00 Kolkata (05:30 London) is booked.
      const first = list(page).getByRole('radio').first();
      await first.focus();
      await expect(first).toHaveAccessibleName('04:30');

      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      expect(await focused(page)).toBe('06:00'); // skipped 05:30, booked
      await expect(list(page).getByRole('radio', { name: '06:00' })).toHaveAttribute(
        'aria-checked',
        'true',
      );

      await page.keyboard.press('End');
      expect(await focused(page)).toBe('12:00'); // 16:30 in Kolkata
      await page.keyboard.press('Home');
      expect(await focused(page)).toBe('04:30');

      await page.keyboard.type('09');
      expect(await focused(page)).toBe('09:00');
      await expect(list(page).getByRole('radio', { name: '09:00' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });
}

test('the clock toggle switches between 12h and 24h', async ({ page }) => {
  await page.goto('/components/time-slot-list');
  await useLondon(page);
  await expect(list(page).getByRole('radio').first()).toHaveAccessibleName('04:30');
  await page.getByRole('radio', { name: '12h' }).click();
  await expect(list(page).getByRole('radio').first()).toHaveAccessibleName(/^4:30\sam$/i);
});

test('slots on a different local day are marked (New York sees Wednesday 23:30)', async ({
  page,
}) => {
  await page.goto('/components/time-slot-list');
  // Default demo zone is New York: 09:00 Thursday in Kolkata is 23:30 Wednesday there.
  const first = list(page).getByRole('radio').first();
  await expect(first).toHaveAttribute('data-other-day', '');
  await expect(first).toHaveAccessibleName(/11:30\sPM, Wednesday, October 14, 2026/);
});
