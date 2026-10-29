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


test('navigația mobilă indică modul activ și deschide/închide meniul Mai multe', async ({ page }) => {
  await page.goto('/instructaj/');

  const nav = page.locator('.ev-mobile-nav');
  const more = nav.locator('[data-ev-more]');
  const sheet = page.locator('#ev-mobile-more-sheet');

  await expect(nav).toBeVisible();
  await expect(more).toHaveClass(/is-active/);
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet).toBeHidden();

  await more.click();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('a')).toHaveCount(2);
  await expect(sheet.locator('a[aria-current="page"]')).toHaveText('Instructaj');

  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet).toBeHidden();

  await more.click();
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-ev-more-close]').click();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet).toBeHidden();
});

test('bara fixă lasă spațiu de derulare pentru ultimul conținut pe mobil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/contopiri/');

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector('.ev-mobile-nav');
    const style = getComputedStyle(document.body);
    const navRect = nav.getBoundingClientRect();
    return {
      bodyPaddingBottom: parseFloat(style.paddingBottom),
      navHeight: navRect.height,
      navBottom: navRect.bottom,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight
    };
  });

  expect(metrics.navBottom).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.navHeight).toBeGreaterThanOrEqual(50);
  expect(metrics.bodyPaddingBottom).toBeGreaterThanOrEqual(metrics.navHeight);
  expect(metrics.documentHeight).toBeGreaterThan(metrics.viewportHeight);
});
