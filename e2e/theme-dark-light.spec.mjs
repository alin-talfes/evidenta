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
    expect(await toggle.getAttribute('aria-pressed')).toBeNull();
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

test('contrastul tokenurilor text respectă WCAG AA în temele light și dark', async ({ page }) => {
  await clearTheme(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const ratios = await page.evaluate(() => {
    const luminance = hex => {
      const values = hex.replace('#', '').match(/.{2}/g).map(value => parseInt(value, 16) / 255);
      const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ratio = (foreground, background) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const read = () => {
      const css = getComputedStyle(document.documentElement);
      const muted = css.getPropertyValue('--ev-muted').trim();
      const surface = css.getPropertyValue('--ev-surface').trim();
      const surface3 = css.getPropertyValue('--ev-surface-3').trim();
      return { surface: ratio(muted, surface), surface3: ratio(muted, surface3) };
    };
    return { light: read() };
  });

  expect(ratios.light.surface).toBeGreaterThanOrEqual(4.5);
  expect(ratios.light.surface3).toBeGreaterThanOrEqual(4.5);

  await page.evaluate(() => window.EVIDENTA_THEME.setMode('dark'));
  const dark = await page.evaluate(() => {
    const luminance = hex => {
      const values = hex.replace('#', '').match(/.{2}/g).map(value => parseInt(value, 16) / 255);
      const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const css = getComputedStyle(document.documentElement);
    const muted = css.getPropertyValue('--ev-muted').trim();
    const surface = css.getPropertyValue('--ev-surface').trim();
    const surface3 = css.getPropertyValue('--ev-surface-3').trim();
    const ratio = (a, b) => {
      const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return { surface: ratio(muted, surface), surface3: ratio(muted, surface3) };
  });
  expect(dark.surface).toBeGreaterThanOrEqual(4.5);
  expect(dark.surface3).toBeGreaterThanOrEqual(4.5);
});
