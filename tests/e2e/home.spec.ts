import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

// Wednesday 14 October 2026, 08:00 UTC.
const NOW = new Date('2026-10-14T08:00:00Z');

async function bookWithKeyboard(page: Page) {
  const hero = page.getByRole('region', { name: 'Intro call with Lena Ortiz' });
  await expect(hero.getByRole('grid')).toBeVisible();

  // Tab from the GitHub button into the calendar: previous month, next month, then the grid.
  await page.getByRole('link', { name: 'View on GitHub' }).focus();
  await page.keyboard.press('Tab'); // previous month (disabled: skipped) / next month
  while (!(await page.evaluate(() => document.activeElement?.hasAttribute('data-calendar-day')))) {
    await page.keyboard.press('Tab');
  }
  // Move to next week's same day and pick it.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // Into the slot list: past the 12h/24h toggle.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const slot = await page.evaluate(() => document.activeElement?.getAttribute('role'));
  expect(slot).toBe('radio');
  await page.keyboard.press('ArrowRight');

  await page.keyboard.press('Tab');
  await expect(hero.getByRole('button', { name: 'Confirm booking' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(hero.getByRole('status')).toContainText("You're booked");
  await expect(hero.getByRole('button', { name: 'Pick a different time' })).toBeFocused();
  return hero;
}

for (const colorScheme of ['light', 'dark'] as const) {
  for (const [timezoneId, locale] of [
    ['Europe/London', 'en-GB'],
    ['America/New_York', 'en-US'],
    ['Asia/Kolkata', 'en-IN'],
  ] as const) {
    test.describe(`${colorScheme}, ${timezoneId}`, () => {
      test.use({ colorScheme, timezoneId, locale });

      test('a visitor can book a call with the keyboard alone', async ({ page }) => {
        await page.clock.setFixedTime(NOW);
        await page.goto('/');
        const hero = await bookWithKeyboard(page);
        await expectNoAxeViolations(page);

        // Back to picking, with focus on Confirm.
        await page.keyboard.press('Enter');
        await expect(hero.getByRole('button', { name: 'Confirm booking' })).toBeFocused();
      });
    });
  }
}

test('the hero is the first thing on the page, and shows times in the visitor zone', async ({
  browser,
}) => {
  const ctx = await browser.newContext({ timezoneId: 'America/Los_Angeles', locale: 'en-US' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Intro call with Lena Ortiz' });
  await expect(hero).toBeInViewport();
  await expect(hero).toContainText('Times in Pacific Time');
  // 09:00 in Berlin is midnight in Los Angeles.
  await expect(hero.getByRole('radio', { name: /^\d{1,2}:\d{2}\sAM$/ }).first()).toBeVisible();
  await ctx.close();
});
