import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const rootHtml = read('index.html');
const aiHtml = read('ai/index.html');
const contopiriHtml = read('contopiri/index.html');
const transferHtml = read('transfer/index.html');
const transferRulesHtml = read('transfer/rules/index.html');
const ux = read('js/ux-upgrades.js');
const pedepseUx = read('js/pedepse-ux.js');
const finalLayer = read('css/final-layer.css');

for (const [file, html] of [
  ['index.html', rootHtml],
  ['ai/index.html', aiHtml],
  ['contopiri/index.html', contopiriHtml],
  ['transfer/index.html', transferHtml],
  ['transfer/rules/index.html', transferRulesHtml]
]) {
  assert.ok(html.includes('ux-upgrades.js?v=3'), `${file} trebuie să declare controllerul UX consolidat curent`);
  assert.equal((html.match(/ux-upgrades\.js\?v=3/g) || []).length, 1, `${file} trebuie să declare controllerul UX o singură dată`);
}
assert.ok(rootHtml.includes('pedepse-ux.js?v=3'), 'Ruta Pedepse trebuie să declare versiunea curentă a controllerului UX.');
assert.ok(rootHtml.includes('EvidentaPedepseUx.runCalculation(calculateAll)'), 'Fluxul de calcul Pedepse trebuie declarat explicit în markup.');
assert.ok(!version.includes('ux-upgrades.js'), 'version.js nu trebuie să mai încarce controllerul UX dinamic');
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
  'validateCalculation',
  'runCalculation',
  'afterCalculation',
  'window.EvidentaPedepseUx',
  "new Set(['NCP99', 'VCP551'])"
]) {
  assert.ok(pedepseUx.includes(marker), `Controllerul Pedepse UX trebuie să includă ${marker}`);
}
assert.ok(!pedepseUx.includes('bindCalculationLifecycle'), 'Pedepse UX nu trebuie să intercepteze butonul de calcul prin listener global');
assert.ok(!pedepseUx.includes('installCalculationGuard'), 'Pedepse UX nu trebuie să instaleze wrapper peste calculateAll');
assert.ok(!pedepseUx.includes('window.calculateAll ='), 'Pedepse UX nu trebuie să suprascrie calculateAll');
assert.ok(!pedepseUx.includes('__evEnhanced'), 'Pedepse UX nu trebuie să folosească marcaje de monkey-patch');
assert.ok(!pedepseUx.includes('setTimeout(afterCalculation'), 'Post-procesarea Pedepse trebuie să fie apelată explicit, nu temporizată');

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
console.log('UX upgrades: controller declarat per pagină, flux Pedepse explicit, fără loader dinamic, CSS injectat sau calculateAll monkey-patch.');
