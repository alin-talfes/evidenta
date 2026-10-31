import { expect, test } from '@playwright/test';

const routes = ['/', '/contopiri/', '/transfer/', '/instructaj/', '/semnalmente/'];

async function clearTheme(page) {
  await page.addInitScript(() => {
    for (const key of ['evidenta-theme-mode', 'evidenta-theme', 'anpTheme', 'descriere-semnalmente-theme']) localStorage.removeItem(key);
  });
}

for (const route of routes) {
  test(`temă light/dark, metadate și variabile CSS: ${route}`, async ({ page }) => {
    await clearTheme(page);
    await page.emulateMedia({ colorScheme: 'light' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);

    const root = page.locator('html');
    const toggle = page.locator('#evidenta-theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(root).toHaveAttribute('data-theme-mode', 'system');
    await expect(root).toHaveAttribute('data-theme', 'light');
    await expect(root).toHaveCSS('color-scheme', 'light');

    const light = await page.evaluate(() => ({
      surface: getComputedStyle(document.documentElement).getPropertyValue('--ev-surface').trim(),
      text: getComputedStyle(document.documentElement).getPropertyValue('--ev-text').trim(),
      meta: document.querySelector('meta[name="theme-color"]')?.content
    }));
    expect(light.surface).not.toBe('');
    expect(light.text).not.toBe('');
    expect(light.meta).toBe('#f8fafc');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(root).toHaveAttribute('data-theme-mode', 'system');
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(root).toHaveCSS('color-scheme', 'dark');
    await expect.poll(() => page.locator('meta[name="theme-color"]').getAttribute('content')).toBe('#0b1220');

    await toggle.click();
    await expect(root).toHaveAttribute('data-theme-mode', 'light');
    await expect(root).toHaveAttribute('data-theme', 'light');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('evidenta-theme-mode'))).toBe('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(root).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(root).toHaveAttribute('data-theme-mode', 'dark');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('evidenta-theme-mode'))).toBe('dark');
    await page.reload();
    await expect(root).toHaveAttribute('data-theme-mode', 'dark');
    await expect(root).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });
}

test('sincronizează preferința între file și păstrează modul Sistem', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'light' });
  const first = await context.newPage();
  await clearTheme(first);
  await first.goto('/');
  await first.evaluate(() => window.EVIDENTA_THEME.setMode('dark'));
  const second = await context.newPage();
  await second.goto('/transfer/');
  await expect(second.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await first.evaluate(() => window.EVIDENTA_THEME.setMode('system'));
  await first.emulateMedia({ colorScheme: 'dark' });
  await expect(first.locator('html')).toHaveAttribute('data-theme', 'dark');
  await context.close();
});
