import { expect, test } from '@playwright/test';

// AI Documente intentionally upgrades insecure requests. The local test server
// is HTTP-only, so remove the CSP meta tag from this test response only. The
// production CSP remains unchanged and is covered by security regression tests.
test.use({ viewport: { width: 390, height: 844 } });

test('AI Documente păstrează shell-ul și layout-ul pe iPhone', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('**/ai/', async route => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({
      response,
      body: html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?\s*>/i, '')
    });
  });

  await page.goto('/ai/');
  await expect(page.locator('.ev-shell')).toBeVisible();
  await expect(page.locator('.ev-shell__brand-copy strong')).toHaveText('Inmate Pocket Calculator');
  await expect(page).toHaveTitle(/AI Documente — Inmate Pocket Calculator/);

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    themeMode: document.documentElement.dataset.themeMode
  }));
  expect(layout.documentWidth - layout.viewportWidth, 'Overflow în AI Documente').toBeLessThanOrEqual(1);
  expect(layout.themeMode).toBe('system');
  expect(pageErrors, `Erori JavaScript în AI Documente: ${pageErrors.join(' | ')}`).toEqual([]);
});
