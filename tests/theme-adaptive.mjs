import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const theme = read('js/theme.js');
const design = read('css/design-system.css');
const responsive = read('css/responsive.css');
const mobile = read('css/mobile.css');

for (const marker of [
  "const THEME_MODE_STORAGE_KEY = 'evidenta-theme-mode'",
  "function validThemeMode(value)",
  "return value === 'system' || value === 'light' || value === 'dark'",
  "function resolveTheme(mode = readThemeMode())",
  "function setThemeMode(mode, { persist = true } = {})",
  "handleSystemThemeChange",
  "window.EVIDENTA_THEME_MODE_STORAGE_KEY = THEME_MODE_STORAGE_KEY",
  "setMode: (mode, options) => setThemeMode(mode, options)"
]) {
  assert.ok(theme.includes(marker), `Theme controller missing expected adaptive-theme behavior: ${marker}`);
}

assert.ok(theme.includes("localStorage.setItem(THEME_MODE_STORAGE_KEY, mode)"), 'The selected theme mode must persist separately.');
assert.ok(theme.includes("document.documentElement.dataset.theme = resolved"), 'CSS must continue receiving the resolved light/dark theme.');
assert.ok(theme.includes("document.documentElement.dataset.themeMode = initialMode"), 'The selected mode must be exposed on the document root.');
assert.ok(theme.includes("colorSchemeQuery.addEventListener('change', handleSystemThemeChange)") || theme.includes("colorSchemeQuery?.addListener?.(handleSystemThemeChange)"), 'System preference changes must update the active theme.');
assert.ok(design.includes('--ev-page-gutter: clamp('), 'The shared design system must expose responsive page gutters.');
assert.ok(design.includes('@media (prefers-reduced-motion: reduce)'), 'The design system must respect reduced motion.');
assert.ok(responsive.includes('/* Pe telefoane, navigarea principală este bara inferioară; evităm un al doilea meniu în antet. */'), 'Mobile navigation policy must be explicit.');
assert.ok(mobile.includes('.ev-mobile-nav'), 'The existing mobile navigation remains available.');

console.log('Adaptive theme: system/light/dark preference and mobile design tokens verified.');
