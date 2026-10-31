import { expect, test } from '@playwright/test';

async function calculateHistoricSentence(page) {
  await page.goto('/');
  await page.locator('#birthDate').fill('01.01.1980');
  await page.locator('#startDate').fill('21.06.2010');
  await page.locator('#durYears').fill('10');
  await page.locator('#durMonths').fill('0');
  await page.locator('#durDays').fill('0');
  await page.locator('#liberationArticle').selectOption('NCP100');
  await page.locator('#calcBtn').click();
  await expect(page.locator('#resultsCard')).toBeVisible();
}

test('marchează cu roșu termenele trecute pentru expirare, fracția minimă și data propozabilă', async ({ page }) => {
  await calculateHistoricSentence(page);

  const cards = await page.locator('#resultsContent .result-item').evaluateAll(items =>
    items.map(item => item.innerText)
  );
  const expiration = cards.find(value => value.includes('Expirare REALĂ'));
  const minimumFraction = cards.find(value => value.includes('FRACȚIE MINIMĂ OBLIGATORIE'));
  const proposedDate = cards.find(value => value.includes('DATA ÎMPLINIRII FRACȚIEI TOTALE / PROPOZABILĂ'));

  expect(expiration).toContain('!!! TERMEN ÎMPLINIT !!!');
  expect(minimumFraction).toContain('!!! TERMEN ÎMPLINIT !!!');
  expect(proposedDate).toContain('!!! TERMEN ÎMPLINIT !!!');

  const indicator = page.locator('#resultsContent .result-date-indicator.expired').first();
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveText('!!! TERMEN ÎMPLINIT !!!');
  expect(await indicator.evaluate(element => getComputedStyle(element).color)).toBe('rgb(153, 27, 27)');
});

test('afișează avertizarea când deducerile împing expirarea reală înaintea începerii executării', async ({ page }) => {
  await calculateHistoricSentence(page);

  await page.evaluate(() => {
    window.addDedRow({
      type: 'generic',
      start: '21.06.2010',
      end: '30.06.2020'
    });
  });

  await page.locator('#calcBtn').click();
  const alerts = page.locator('#alertsContainer');
  await expect(alerts).toBeVisible();
  await expect(alerts).toContainText('!!! ATENȚIE – DEDUCERILE DEPĂȘESC DATA EXPIRĂRII PEDEPSEI !!!');
  await expect(alerts).toContainText('anterioară datei începerii executării');
});
