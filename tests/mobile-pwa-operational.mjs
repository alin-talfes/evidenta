import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const rootHtml = read('index.html');
const aiHtml = read('ai/index.html');
const contopiriHtml = read('contopiri/index.html');
const transferHtml = read('transfer/index.html');
const transferRulesHtml = read('transfer/rules/index.html');
const nav = read('js/operational-navigation.js');
const pedepse = read('js/operational-pedepse.js');
const ai = read('js/operational-ai.js');
const contopiri = read('js/operational-contopiri.js');
const transfer = read('js/operational-transfer.js');
const instructaj = read('js/operational-instructaj.js');
const semnalmente = read('js/operational-semnalmente.js');
const noSpoilers = read('js/no-nonoptional-disclosures-v1.js');
const disclosure = read('js/disclosure-hardening-v2.js');
const disclosureCss = read('css/disclosure-hardening.css');
const mobile = read('css/mobile.css');
const modules = read('css/mobile-modules.css');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const pwa = read('js/pwa-register.js');
const modes = read('js/pedepse-modes-v5.js');
const prison = read('js/pedepse-prison-date.js');

// version.js este exclusiv identitate/versionare, nu loader de controllere.
for (const retiredLoader of [
  'ensureScript(', 'ensureStyle(', 'ensureUxUpgrades', 'ensureLegalReleaseGuards',
  'ensurePageControllers', 'ensureCalculationParity', 'ensureGlobalOperationalControllers',
  'ensurePedepseOperationalControllers', 'ensureModuleOperationalControllers', 'ensureOperationalRuntime'
]) assert.ok(!version.includes(retiredLoader), `version.js nu trebuie să mai conțină ${retiredLoader}`);
for (const marker of ['bootstrap()', 'initVersionIdentity()', 'renderBrandIdentity', 'evidenta:shellready']) {
  assert.ok(version.includes(marker), `version.js trebuie să păstreze ${marker}`);
}
assert.equal((version.match(/initVersionIdentity\(\);/g) || []).length, 1, 'Identitatea versiunii trebuie pornită o singură dată din bootstrap.');

const sharedStyles = ['operational-upgrades.css?v=1', 'mobile-modules.css?v=1', 'disclosure-hardening.css?v=2'];
const sharedScripts = ['ux-upgrades.js?v=3', 'operational-navigation.js?v=4', 'no-nonoptional-disclosures-v1.js?v=3', 'disclosure-hardening-v2.js?v=2', 'pwa-register.js?v=3', 'version.js'];
for (const [file, html] of [
  ['index.html', rootHtml],
  ['ai/index.html', aiHtml],
  ['contopiri/index.html', contopiriHtml],
  ['transfer/index.html', transferHtml],
  ['transfer/rules/index.html', transferRulesHtml]
]) {
  for (const style of sharedStyles) assert.ok(html.includes(style), `${file} trebuie să declare ${style}`);
  for (const script of sharedScripts) assert.ok(html.includes(script), `${file} trebuie să declare ${script}`);
}

for (const marker of ['operational-pedepse.js?v=3', 'pedepse-modes-v5.js?v=1', 'pedepse-optional-fix-v2.js?v=1', 'pedepse-prison-date.js?v=1', 'pedepse-ux.js?v=2', 'quarantine-ui.js?v=2']) {
  assert.ok(rootHtml.includes(marker), `Pedepse trebuie să declare ${marker}`);
}
assert.ok(aiHtml.includes('operational-ai.js?v=3'));
assert.ok(aiHtml.includes('ai/result-pedepse.js?v=1'));
assert.ok(contopiriHtml.includes('operational-contopiri.js?v=2'));
assert.ok(transferHtml.includes('operational-transfer.js?v=2'));
assert.ok(transferRulesHtml.includes('operational-transfer.js?v=2'));

for (const html of [rootHtml, aiHtml, contopiriHtml, transferHtml, transferRulesHtml]) {
  assert.ok(html.includes('release-guards.js?v=1'), 'Compatibilitatea juridică existentă trebuie păstrată declarativ până la integrarea în motorul core.');
  assert.ok(html.includes('quarantine-rules.js?v=1'), 'Regulile de carantină trebuie păstrate declarativ până la integrarea în motorul core.');
}

assert.ok(!version.includes('mobile-operational-v2.js'));
assert.ok(!fs.existsSync(path.join(root, 'js/mobile-operational-v2.js')), 'Controllerul mobil monolitic trebuie eliminat.');
for (const retired of ['operational-upgrades.js', 'operational-finalize.js', 'operational-corrections-v4']) {
  assert.ok(!version.includes(retired), `${retired} nu trebuie încărcat`);
  assert.ok(!fs.existsSync(path.join(root, 'js', retired)), `${retired} trebuie eliminat`);
}

for (const marker of ['normalizeGlobalNav', 'normalizeTouchInputs', 'removeOfficerSuiteNav', 'input[type="number"]', 'ev-mobile-nav', 'evidenta:shellready', 'nav.appendChild(sheet)', 'evidenta:mobile-nav-ready']) {
  assert.ok(nav.includes(marker), `Navigația trebuie să includă ${marker}`);
}
for (const marker of ['quickCalculate', 'syncQuickResultControls', 'buildMobileDisclosure', 'Liberare condiționată și date PPL', 'Opțiuni avansate', 'ev-prefill-banner', 'aria-live']) {
  assert.ok(pedepse.includes(marker), `Pedepse trebuie să includă ${marker}`);
}
assert.ok(!pedepse.includes('observe(document.body'));
for (const marker of ['sendAiToPedepse', 'sendAiToContopiri', 'aiRowIsOpenEnded', 'transferDeductions', 'openEndedOmitted', 'ev-ai-open-ended-note', 'FOTOGRAFIAZĂ MANDATUL', 'ev-ai-evidence-details']) {
  assert.ok(ai.includes(marker), `AI trebuie să includă ${marker}`);
}

assert.ok(contopiri.includes('resultObserver.observe(result, { childList:true, subtree:true })'));
assert.ok(contopiri.includes('compactContopiriResult'));
assert.ok(contopiri.includes('removeContopiriTransferButton'));
assert.ok(!contopiri.includes('window.calculateMergedPenalties ='));
assert.ok(transfer.includes('addTransferCopy'));
assert.ok(transfer.includes('compactTransfer'));
assert.ok(transfer.includes('ev-transfer-help-details'));
assert.ok(instructaj.includes('CĂUTARE OPERATIVĂ'));
assert.ok(semnalmente.includes("setAttribute('capture', 'environment')"));
assert.ok(semnalmente.includes('FĂ POZĂ FRONTALĂ'));
assert.ok(semnalmente.includes('FĂ POZĂ DIN PROFIL'));

assert.ok(noSpoilers.includes('queueMicrotask'));
assert.ok(noSpoilers.includes('EvidentaDisclosurePolicy'));
assert.ok(!noSpoilers.includes('document.createElement(\'style\')'));
assert.ok(!noSpoilers.includes('setTimeout'));
assert.ok(!noSpoilers.includes('scheduleNormalize'));
assert.ok(disclosure.includes('queueMicrotask'));
assert.ok(disclosure.includes('EvidentaDisclosureA11y'));
assert.ok(!disclosure.includes('setTimeout'));
assert.ok(!disclosure.includes('document.createElement(\'link\')'));
for (const marker of ['data-ev-static-disclosure', 'ev-static-disclosure-title', 'pointer-events:none', '::-webkit-details-marker']) {
  assert.ok(disclosureCss.includes(marker), `CSS disclosure trebuie să includă ${marker}`);
}

assert.ok(!mobile.includes('position:sticky'));
assert.equal([...mobile.matchAll(/position\s*:\s*fixed\s*!important/gi)].length, 1, 'Numai bottom nav trebuie să fie fixed');
assert.ok(!modules.includes('position:fixed'));
assert.ok(!modules.includes('position:sticky'));

for (const marker of ['Calcul rapid', 'Calcul complet LC', 'Măsuri preventive', 'data-masuri-days', '[30, 60]']) assert.ok(modes.includes(marker));
for (const marker of ['setupControl', 'validateBeforeCalculation', 'prisonReceivedSameAsStart']) assert.ok(prison.includes(marker));
assert.ok(!prison.includes('window.calculateAll ='));

for (const marker of ['css/mobile.css?v=1', 'css/mobile-modules.css', 'initBottomNavLayout', 'evidenta:mobile-nav-ready', "matchMedia?.('(max-width: 760px)')", "matchMedia?.('(display-mode: standalone)')"]) {
  assert.ok(pwa.includes(marker), `PWA lifecycle trebuie să includă ${marker}`);
}
assert.ok(!pwa.includes('new ResizeObserver'));
assert.ok(!pwa.includes('setTimeout'), 'PWA layout nu trebuie să folosească retry-uri temporizate.');
assert.ok(!pwa.includes('normalizeMobileMoreSheet'), 'More sheet trebuie să aparțină direct bottom nav, fără reparentare PWA.');

assert.ok(sw.includes("const VERSION = 'v34'"));
assert.ok(sw.includes('operational-upgrades|mobile|mobile-modules|disclosure-hardening'));
for (const file of ['operational-navigation', 'operational-pedepse', 'operational-ai', 'operational-contopiri', 'operational-transfer', 'operational-instructaj', 'operational-semnalmente']) {
  assert.ok(sw.includes(`./js/${file}.js`), `SW trebuie să includă ${file}`);
}
assert.ok(!sw.includes('mobile-operational-v2'));
assert.ok(!sw.includes('operational-finalize'));

assert.ok(aiSw.includes('evidenta-ai-shell-v20'));
assert.ok(aiSw.includes('evidenta-ai-runtime-v20'));
assert.ok(aiSw.includes('../js/operational-navigation.js'));
assert.ok(aiSw.includes('../js/operational-ai.js'));
assert.ok(aiSw.includes('../js/no-nonoptional-disclosures-v1.js'));
assert.ok(aiSw.includes('../js/disclosure-hardening-v2.js'));
assert.ok(aiSw.includes('../css/disclosure-hardening.css'));
assert.ok(!aiSw.includes('mobile-operational-v2'));
for (const pedepseOnly of ['../js/pedepse-modes-v5.js', '../js/pedepse-optional-fix-v2.js', '../css/pedepse-modes-v3.css']) {
  assert.ok(!aiSw.includes(pedepseOnly), `AI SW nu trebuie să precache-uiască ${pedepseOnly}`);
}
assert.ok(!aiSw.includes('operational-finalize'));

console.log('Mobile/PWA audit: controllere declarative per pagină, version.js identity-only și lifecycle PWA determinist.');
