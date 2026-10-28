import { expect, test } from '@playwright/test';

// AI Documente intentionally upgrades insecure requests. Its local HTTP test server
// cannot terminate TLS, so bypass CSP only in this visual smoke test; CSP policy
// itself remains covered by the existing security regression tests.
test.use({
  bypassCSP: true,
  viewport: { width: 390, height: 844 }
});

test('AI Documente păstrează shell-ul și layout-ul pe iPhone', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

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
