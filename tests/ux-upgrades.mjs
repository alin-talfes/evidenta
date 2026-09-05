import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const ux = read('js/ux-upgrades.js');
const css = read('css/ux-upgrades.css');

assert.ok(version.includes('ux-upgrades.js?v=1'), 'Controllerul de versiune trebuie să încarce upgrade-urile UX comune');
assert.ok(version.includes('data-evidenta-ux-controller') || version.includes('evidentaUxController'), 'Loaderul UX trebuie să prevină dublarea controllerului');

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
  assert.ok(css.includes(marker), `CSS UX trebuie să conțină ${marker}`);
}

assert.ok(!ux.includes("href='../ofiter"), 'Upgrade-urile publice nu trebuie să expună ruta Ofițer');
console.log('UX upgrades: meniu mobil, progressive disclosure, Transfer, Semnalmente și Ofițer verificate.');
