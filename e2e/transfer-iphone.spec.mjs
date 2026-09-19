import { expect, test } from '@playwright/test';

function watchPageErrors(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  return () => {
    expect(pageErrors, `Erori JavaScript în pagină: ${pageErrors.join(' | ')}`).toEqual([]);
  };
}

test('afișează identitatea IPC fără overflow pe iPhone', async ({ page }) => {
  const assertNoPageErrors = watchPageErrors(page);
  await page.goto('/transfer/');

  await expect(page).toHaveTitle('Transfer și profilare — Inmate Pocket Calculator');
  await expect(page.locator('.ev-shell__brand-copy strong')).toHaveText('Inmate Pocket Calculator');
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'IPC');
  await expect(page.locator('html')).toHaveClass(/ev-ios/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  assertNoPageErrors();
});

test('navighează spre reguli și înapoi fără rute rupte', async ({ page }) => {
  const assertNoPageErrors = watchPageErrors(page);
  await page.goto('/transfer/');
  await page.getByRole('link', { name: 'REGULI TRANSFER' }).click();

  await expect(page).toHaveURL(/\/transfer\/rules\/$/);
  await expect(page).toHaveTitle(/Inmate Pocket Calculator$/);
  await expect(page.locator('.ev-shell__brand-copy strong')).toHaveText('Inmate Pocket Calculator');

  await page.goBack();
  await expect(page).toHaveURL(/\/transfer\/$/);
  await expect(page.getByRole('button', { name: 'Caută destinația' })).toBeVisible();
  assertNoPageErrors();
});

test('calculează o destinație în modul Executare pedeapsă', async ({ page }) => {
  const assertNoPageErrors = watchPageErrors(page);
  await page.goto('/transfer/');
  await page.getByRole('button', { name: 'Executare pedeapsă' }).click();
  await page.locator('#judet').selectOption({ label: 'București' });
  await page.getByLabel('Deschis', { exact: true }).check();
  await page.getByRole('button', { name: 'Caută destinația' }).click();

  await expect(page.locator('#resultArea .result-card.success')).toBeVisible();
  await expect(page.locator('#resultArea .result-title')).toHaveText('Unități recomandate');
  await expect(page.locator('#resultArea .match-item').first()).toBeVisible();
  assertNoPageErrors();
});

test('activează numai cache-urile IPC', async ({ page }) => {
  const assertNoPageErrors = watchPageErrors(page);
  await page.goto('/transfer/');
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
  });

  await expect.poll(() => page.evaluate(() => caches.keys()), { timeout: 15_000 })
    .toEqual(expect.arrayContaining([expect.stringMatching(/^ipc-(?:static|runtime)-v\d+$/)]));

  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some(name => name.startsWith('evidenta-'))).toBe(false);
  assertNoPageErrors();
});
