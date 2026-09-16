import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const ux = read('js/ux-upgrades.js');
const finalLayer = read('css/final-layer.css');

assert.ok(version.includes('ux-upgrades.js?v=3'), 'Controllerul de versiune trebuie să încarce controllerul UX consolidat curent');
assert.ok(version.includes('data-evidenta-ux-controller') || version.includes('evidentaUxController'), 'Loaderul UX trebuie să prevină dublarea controllerului');
assert.ok(!fs.existsSync(path.join(root, 'css/ux-upgrades.css')), 'CSS-ul UX separat trebuie eliminat după consolidarea în final-layer.css');
assert.ok(!ux.includes('loadStylesheet'), 'Controllerul UX nu trebuie să mai injecteze un stylesheet la runtime');
assert.ok(!ux.includes('ux-upgrades.css'), 'Controllerul UX nu trebuie să mai depindă de stylesheet-ul legacy');

for (const marker of [
  'initMobileSuiteMenu',
  'initPedepseDisclosure',
  'initTransferExplainability',
  'initTransferRulesTabs',
  'initSemnalmenteUx',
  'initOfficerMobileNav',
  'Situații suplimentare',
  'Unități compatibile',
  'Prima potrivire tehnică',
  'Pasul 3 · Verificare umană'
]) {
  assert.ok(ux.includes(marker), `Upgrade-ul UX trebuie să conțină ${marker}`);
}

assert.ok(ux.includes('function setTextIfChanged(node, value)'), 'Normalizarea Transfer trebuie să evite mutațiile DOM redundante');
assert.ok(ux.includes('observer.disconnect()'), 'Observerul Transfer trebuie suspendat în timpul normalizării pentru a preveni recursia');
assert.ok(!ux.includes('new MutationObserver(normalizeTransferResults)'), 'Observerul Transfer nu trebuie să invoce direct o funcție care își mută propriul subtree');

for (const marker of [
  '.ev-shell__menu',
  '.ev-optional-tools',
  '.ev-match-why',
  '.ev-anexa-tabs',
  '.ev-verification-banner',
  '.ev-officer-mobile-nav',
  '.ev-officer-more-sheet',
  '@media (max-width: 640px)'
]) {
  assert.ok(finalLayer.includes(marker), `final-layer.css trebuie să conțină ${marker}`);
}

assert.ok(!ux.includes("href='../ofiter"), 'Upgrade-urile publice nu trebuie să expună ruta Ofițer');
console.log('UX upgrades: controller fără CSS injectat la runtime; stilurile sunt consolidate în final-layer.css.');
