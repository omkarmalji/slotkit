import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

// Freeze time: 14 October 2026, 15:00 UTC (11:00 in New York, 20:30 in Kolkata).
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T15:00:00Z'));
});

const trigger = (page: Page) => page.getByRole('button', { name: /^Appointment date/ });

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    test('page has no axe violations, closed and open', async ({ page }) => {
      await page.goto('/components/date-picker');
      await expect(page.getByRole('grid', { name: 'October 2026' })).toBeVisible();
      await expectNoAxeViolations(page);

      await trigger(page).click();
      await expect(page.getByRole('dialog', { name: 'Appointment date' })).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test('a date can be chosen with the keyboard alone', async ({ page }) => {
      await page.goto('/components/date-picker');
      await trigger(page).focus();
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog', { name: 'Appointment date' });
      await expect(dialog).toBeVisible();
      // Opens on today.
      await expect(
        dialog.getByRole('button', { name: 'Wednesday, October 14, 2026, today' }),
      ).toBeFocused();

      // Down a week, right a day: Thursday 22 October.
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await expect(
        dialog.getByRole('button', { name: /Thursday, October 22, 2026/ }),
      ).toBeFocused();
      await page.keyboard.press('Enter');

      await expect(dialog).toBeHidden();
      await expect(trigger(page)).toBeFocused();
      await expect(trigger(page)).toHaveAccessibleName('Appointment date Thu, Oct 22, 2026');
    });
  });
}

test('Escape closes without changing the value and returns focus to the trigger', async ({
  page,
}) => {
  await page.goto('/components/date-picker');
  await trigger(page).click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAccessibleName('Appointment date Select a date');
});

test('PageDown and Shift+PageDown change month and year', async ({ page }) => {
  await page.goto('/components/date-picker');
  await trigger(page).click();
  const dialog = page.getByRole('dialog');
  await page.keyboard.press('PageDown');
  await expect(dialog.getByRole('grid', { name: 'November 2026' })).toBeVisible();
  await page.keyboard.press('Shift+PageDown');
  await expect(dialog.getByRole('grid', { name: 'November 2027' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /November 14, 2027/ })).toBeFocused();
});

test('in Arabic the grid is right-to-left, starts on Saturday, and arrows are mirrored', async ({
  page,
}) => {
  await page.goto('/components/date-picker');
  await page.getByLabel('Locale').selectOption('ar-EG');
  const grid = page.getByRole('grid').last();
  await expect(grid.locator('xpath=ancestor::*[@dir][1]')).toHaveAttribute('dir', 'rtl');
  await expect(grid.getByRole('columnheader').first()).toContainText('السبت');

  const today = grid.locator('[data-today]');
  await today.focus();
  const before = await today.getAttribute('aria-label');
  await page.keyboard.press('ArrowLeft');
  const after = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  expect(before).toContain('١٤');
  expect(after).toContain('١٥');
  await expectNoAxeViolations(page);
});

test('switching time zone moves "today" (it is already 15 October in Auckland)', async ({
  page,
}) => {
  await page.goto('/components/date-picker');
  const inline = page.getByRole('grid').last();
  await expect(inline.locator('[data-today]')).toHaveAccessibleName(/October 14/);
  await page.getByLabel('Time zone').selectOption('Pacific/Auckland');
  // 15:00 UTC on 14 October is 04:00 on 15 October in Auckland.
  await expect(inline.locator('[data-today]')).toHaveAccessibleName(/October 15/);
});
