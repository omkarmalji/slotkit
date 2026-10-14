import { expect, test, type Page } from '@playwright/test';

/** Relative luminance of the computed <html> background, 0 (black) to 1 (white). */
async function htmlBackgroundLuminance(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
  });
}

test.describe('no flash of the wrong theme', () => {
  test('a stored dark choice is applied before any app JavaScript runs', async ({ page }) => {
    // Block every Next.js chunk: React never loads, so only the inline <head> script can act.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => window.localStorage.setItem('slotkit-theme', 'dark'));
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await htmlBackgroundLuminance(page)).toBeLessThan(0.05);
  });

  test('with nothing stored and JavaScript blocked, the OS scheme is used', async ({ page }) => {
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
    expect(await htmlBackgroundLuminance(page)).toBeLessThan(0.05);
  });
});

test('the theme choice persists across reloads and can be made with the keyboard', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const system = page.getByRole('radio', { name: 'System' });
  await expect(system).toHaveAttribute('aria-checked', 'true');

  await system.focus();
  await page.keyboard.press('ArrowRight'); // Light
  await page.keyboard.press('ArrowRight'); // Dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  expect(await htmlBackgroundLuminance(page)).toBeLessThan(0.05);
});

test('the skip link is the first tab stop and moves focus to the content', async ({ page }) => {
  await page.goto('/components/foundations');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();
});
