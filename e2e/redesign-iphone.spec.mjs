import { expect, test } from '@playwright/test';

const redesignedRoutes = [
  { path: '/', title: /Pedepse și liberare condiționată/ },
  { path: '/contopiri/', title: /Contopiri/ },
  { path: '/transfer/', title: /Transfer și profilare/ },
  { path: '/instructaj/', title: /Instructaj/ },
  { path: '/semnalmente/', title: /Semnalmente/ },
];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.removeItem('evidenta-theme-mode');
    localStorage.removeItem('evidenta-theme');
  });
});

for (const route of redesignedRoutes) {
  test(`shell mobil și fără overflow orizontal: ${route.path}`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(route.path);
    await expect(page.locator('.ev-shell')).toBeVisible();
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('.ev-shell__brand-copy strong')).toHaveText('Inmate Pocket Calculator');
    await expect(page.locator('.ev-shell__theme')).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      themeMode: document.documentElement.dataset.themeMode
    }));
    expect(layout.documentWidth - layout.viewportWidth, `Overflow la ${route.path}`).toBeLessThanOrEqual(1);
    expect(layout.themeMode).toBe('system');
    expect(pageErrors, `Erori JavaScript la ${route.path}: ${pageErrors.join(' | ')}`).toEqual([]);
  });
}

test('comutatorul de temă parcurge sistem, luminos, întunecat și revine la sistem', async ({ page }) => {
  await page.goto('/');
  const themeButton = page.locator('.ev-shell__theme');

  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'system');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('evidenta-theme-mode'))).toBe('system');
});
