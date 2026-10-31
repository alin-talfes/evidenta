import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'iphone-webkit',
      use: {
        ...devices['iPhone 13'],
        browserName: 'webkit'
      }
    },
    {
      name: 'android-chromium',
      testMatch: ['**/visual-audit.spec.mjs', '**/pedepse-expired-terms.spec.mjs'],
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium'
      }
    },
    {
      name: 'desktop-chromium',
      testMatch: '**/visual-audit.spec.mjs',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium'
      }
    }
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/transfer/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000
  }
});
