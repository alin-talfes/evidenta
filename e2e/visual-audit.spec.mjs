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
      let compatibilityStylesheetRequested = false;
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('request', request => {
        if (request.url().includes('/css/browser-compat.css')) compatibilityStylesheetRequested = true;
      });

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
      await expect.poll(() => compatibilityStylesheetRequested, { message: 'Stratul de compatibilitate CSS trebuie încărcat în fiecare modul' }).toBe(true);
      await expect(page.locator('html')).toHaveAttribute('data-theme-mode', theme);

      if (route.name === 'pedepse' && (await page.evaluate(() => window.innerWidth)) <= 640) {
        const spacing = await page.locator('#main-content').evaluate(main => {
          const intro = main.querySelector('.ev-page-intro');
          const mode = main.querySelector('.ev-calc-mode');
          const introRect = intro.getBoundingClientRect();
          const modeRect = mode.getBoundingClientRect();
          return {
            display: getComputedStyle(main).display,
            gap: parseFloat(getComputedStyle(main).rowGap),
            distance: modeRect.top - introRect.bottom
          };
        });
        expect(spacing.display, 'Conținutul principal trebuie să păstreze un flux vertical controlat').toBe('flex');
        expect(spacing.gap, 'Spațierea dintre secțiunile principale trebuie să fie compactă').toBeGreaterThanOrEqual(8);
        expect(spacing.gap, 'Spațierea dintre secțiunile principale nu trebuie să fie excesivă').toBeLessThanOrEqual(16);
        expect(spacing.distance, 'Selectorul de mod trebuie separat vizual de antet').toBeGreaterThanOrEqual(8);
      }

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
