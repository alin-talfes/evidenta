import { expect, test } from '@playwright/test';

test('cautarea în regulile de transfer funcționează pe iPhone', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/transfer/rules/');

  const search = page.locator('#filterInput');
  await expect(search).toBeVisible();
  await expect(page.locator('#filterStats')).toContainText(/anexe/);

  await search.fill('Penitenciarul Deva');
  const devaRows = page.locator('#anexa3Table tbody tr:visible');
  await expect(devaRows).toHaveCount(1);
  await expect(devaRows.first()).toContainText('Penitenciarul Deva');

  await search.fill('targu mures');
  const targuMuresRows = page.locator('#anexa3Table tbody tr:visible');
  await expect(targuMuresRows).toHaveCount(1);
  await expect(targuMuresRows.first()).toContainText('Penitenciarul Târgu Mureș');

  await page.locator('#filterClear').click();
  await expect(search).toHaveValue('');
  await expect(page.locator('#anexa8Card')).toBeVisible();

  expect(pageErrors, `Erori JavaScript în pagină: ${pageErrors.join(' | ')}`).toEqual([]);
});
