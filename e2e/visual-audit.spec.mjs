import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', name: 'pedepse', title: /Pedepse și liberare condiționată/ },
  { path: '/contopiri/', name: 'contopiri', title: /Contopiri/ },
  { path: '/transfer/', name: 'transfer', title: /Transfer și profilare/ },
  { path: '/instructaj/', name: 'instructaj', title: /Instructaj/ },
  { path: '/semnalmente/', name: 'semnalmente', title: /Semnalmente/ },
  { path: '/ai/', name: 'ai-documente', title: /AI Documente — Inmate Pocket Calculator/ }
];

const themes = ['system', 'light', 'dark'];

for (const route of routes) {
  for (const theme of themes) {
    test(`captură vizuală ${route.name} / ${theme}`, async ({ page }, testInfo) => {
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.addInitScript(mode => {
        localStorage.removeItem('evidenta-theme');
        localStorage.setItem('evidenta-theme-mode', mode);
      }, theme);

      // AI Documente uses upgrade-insecure-requests in its production CSP.
      // The local CI server is HTTP-only; strip that meta only in this test response.
      if (route.path === '/ai/') {
        await page.route('**/ai/', async intercepted => {
          const response = await intercepted.fetch();
          const html = await response.text();
          await intercepted.fulfill({
            response,
            body: html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?\s*>/i, '')
          });
        });
      }

      await page.goto(route.path);
      await expect(page.locator('.ev-shell')).toBeVisible();
      await expect(page.locator('.ev-shell__brand-copy strong')).toHaveText('Inmate Pocket Calculator');
      await expect(page.locator('.ev-shell__theme')).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('html')).toHaveAttribute('data-theme-mode', theme);

      if (route.name === 'instructaj') {
        const shortcuts = page.locator('.ev-operational-search__chips button');
        await expect(shortcuts).toHaveCount(4);
        const chipRects = await shortcuts.evaluateAll(buttons => {
          const container = buttons[0].parentElement.getBoundingClientRect();
          return buttons.map(button => {
            const rect = button.getBoundingClientRect();
            return { left: rect.left, right: rect.right, containerLeft: container.left, containerRight: container.right };
          });
        });
        for (const rect of chipRects) {
          expect(rect.left, 'Scurtătura Instructaj este tăiată la stânga').toBeGreaterThanOrEqual(rect.containerLeft - 1);
          expect(rect.right, 'Scurtătura Instructaj este tăiată la dreapta').toBeLessThanOrEqual(rect.containerRight + 1);
        }
      }

      await page.evaluate(() => document.fonts?.ready);
      const layout = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        theme: document.documentElement.dataset.theme,
        mode: document.documentElement.dataset.themeMode
      }));

      expect(layout.documentWidth - layout.viewportWidth, `Overflow orizontal în ${route.path} (${layout.documentWidth}px vs ${layout.viewportWidth}px)`).toBeLessThanOrEqual(1);
      if (theme === 'system') expect(['light', 'dark']).toContain(layout.theme);
      else expect(layout.theme).toBe(theme);
      expect(layout.mode).toBe(theme);
      expect(pageErrors, `Erori JavaScript în ${route.path}: ${pageErrors.join(' | ')}`).toEqual([]);

      await page.screenshot({
        path: testInfo.outputPath(`${route.name}-${theme}.png`),
        fullPage: true,
        animations: 'disabled'
      });
    });
  }
}
