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
const rules = read('js/rules.js');
const app = read('js/app.js');
const ui = read('js/ui.js');
const storage = read('js/storage.js');
const pedepseUx = read('js/pedepse-ux.js');
const pedepseOptional = read('js/pedepse-optional.js');
const deductionUi = read('js/deduction-ui.js');
const quarantineUi = read('js/quarantine-ui.js');
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
const navigationCss = read('css/operational-upgrades.css');
const modules = read('css/mobile-modules.css');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const pwa = read('js/pwa-register.js');
const manifest = read('manifest.json');

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

const sharedStyles = ['operational-upgrades.css', 'mobile-modules.css', 'disclosure-hardening.css', 'mobile.css'];
const sharedScripts = ['ux-upgrades.js?v=3', 'operational-navigation.js?v=5', 'no-nonoptional-disclosures-v1.js?v=4', 'disclosure-hardening-v2.js?v=2', 'pwa-register.js?v=3', 'version.js'];
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

for (const marker of ['operational-pedepse.js?v=12', 'pedepse-optional.js?v=2', 'pedepse-ux.js?v=6', 'quarantine-ui.js?v=3', 'deduction-ui.js?v=2']) {
  assert.ok(rootHtml.includes(marker), `Pedepse trebuie să declare ${marker}`);
}
assert.ok(!rootHtml.includes('pedepse-optional-fix-v2.js'), 'Pedepse nu trebuie să mai încarce controllerul optional de compatibilitate.');
assert.ok(!fs.existsSync(path.join(root, 'js/pedepse-optional-fix-v2.js')), 'Controllerul optional de compatibilitate trebuie eliminat.');
assert.ok(!rootHtml.includes('pedepse-modes-v5.js'), 'Pedepse nu trebuie să mai încarce controllerul stratificat de moduri.');
assert.ok(!fs.existsSync(path.join(root, 'js/pedepse-modes-v5.js')), 'Controllerul stratificat pedepse-modes-v5 trebuie eliminat.');
assert.ok(rootHtml.includes('js/ui.js?v=39'), 'Pedepse trebuie să declare controllerul UI general curent.');
assert.ok(rootHtml.includes('onclick="calculatePedepseSafely()"'), 'Butonul de calcul trebuie să intre prin dispatcherul sigur curent.');
assert.ok(!rootHtml.includes('class="hamburger"'), 'Modul Pedepse nu trebuie să afișeze buton hamburger.');
assert.ok(rootHtml.includes('class="top-actions" aria-label="Informații și legislație"'), 'Acțiunile Informații și OMJ trebuie să fie vizibile permanent sub toolbar.');
assert.ok(rootHtml.includes('<h1 id="page-title">Calcul pedepse</h1>'), 'Titlul paginii trebuie să fie compact.');
assert.ok(rootHtml.includes('Liberare condiționată · Regim · Prelungiri măsuri preventive'), 'Descrierea trebuie să enumere numai funcțiile principale.');
assert.ok(rootHtml.includes('css/pedepse-header-v1.css?v=1'), 'CSS-ul compact al antetului trebuie declarat static.');
assert.ok(rootHtml.includes('css/pedepse-modes-v3.css?v=6'), 'CSS-ul modurilor Pedepse trebuie declarat static.');
assert.ok(!rootHtml.includes('pedepse-prison-date.js'), 'Controllerul dinamic pentru data intrării trebuie eliminat.');
for (const marker of [
  'class="ev-calc-mode" data-ev-two-modes="true"',
  'data-mode="full"',
  'data-mode="preventive"',
  'CALCUL PEDEAPSĂ',
  'MĂSURI PREVENTIVE',
  'class="ev-preventive-mode-panel"',
  'class="ev-mobile-lc-details"',
  '<h2 class="ev-mobile-lc-details__title">Liberare condiționată și date PPL</h2>',
  'class="card ev-lc-controls-card"',
  'class="ev-optional-tools card"',
  'id="recursCard"',
  'id="nonExecCard"',
  'id="restCard"'
]) assert.ok(rootHtml.includes(marker), `Markup-ul declarativ Pedepse trebuie să includă ${marker}`);
assert.ok(aiHtml.includes('operational-ai.js?v=3'));
assert.ok(aiHtml.includes('ai/result-pedepse.js?v=1'));
assert.ok(contopiriHtml.includes('operational-contopiri.js?v=2'));
assert.ok(transferHtml.includes('operational-transfer.js?v=2'));
assert.ok(transferRulesHtml.includes('operational-transfer.js?v=2'));

assert.ok(!fs.existsSync(path.join(root, 'js/release-guards.js')), 'release-guards trebuie eliminat după integrarea protecțiilor în rules.js.');
assert.ok(rules.includes('buildLifeSchedule'));
assert.ok(rules.includes('applyVcpAgeFloor'));
for (const [file, html] of [
  ['index.html', rootHtml],
  ['ai/index.html', aiHtml],
  ['contopiri/index.html', contopiriHtml],
  ['transfer/index.html', transferHtml],
  ['transfer/rules/index.html', transferRulesHtml]
]) {
  assert.ok(!html.includes('release-guards.js'), `${file} nu trebuie să mai refere controllerul release-guards eliminat.`);
}
for (const [file, html] of [['index.html', rootHtml], ['ai/index.html', aiHtml]]) {
  assert.ok(html.includes('quarantine-rules.js?v=1'), `${file} trebuie să păstreze regulile de carantină.`);
}
for (const [file, html] of [
  ['contopiri/index.html', contopiriHtml],
  ['transfer/index.html', transferHtml],
  ['transfer/rules/index.html', transferRulesHtml]
]) {
  assert.ok(!html.includes('quarantine-rules.js'), `${file} nu trebuie să încarce reguli de carantină pe o rută care nu le consumă.`);
}
assert.ok(!fs.existsSync(path.join(root, 'js/pedepse-legacy-observer-kill.js')), 'Shim-ul legacy pentru observere trebuie eliminat după ștergerea controllerelor vechi.');

assert.ok(!version.includes('mobile-operational-v2.js'));
assert.ok(!fs.existsSync(path.join(root, 'js/mobile-operational-v2.js')), 'Controllerul mobil monolitic trebuie eliminat.');
for (const retired of ['operational-upgrades.js', 'operational-finalize.js', 'operational-corrections-v4']) {
  assert.ok(!version.includes(retired), `${retired} nu trebuie încărcat`);
  assert.ok(!fs.existsSync(path.join(root, 'js', retired)), `${retired} trebuie eliminat`);
}

for (const marker of ['normalizeGlobalNav', 'normalizeTouchInputs', 'removeOfficerSuiteNav', 'input[type="number"]', 'ev-mobile-nav', 'evidenta:shellready', 'evidenta:mobile-nav-ready', 'Navigare principală', 'Semnalmente', '⚖', '∑', '⇄', '▤', '◎']) {
  assert.ok(nav.includes(marker), `Navigația trebuie să includă ${marker}`);
}
const globalNavBlock = nav.match(/const items = \[([\s\S]*?)\n    \];/)?.[1] || '';
assert.ok(globalNavBlock, 'Navigația globală trebuie să definească explicit lista modulelor.');
for (const label of ['Pedepse', 'Contopiri', 'Transfer', 'Instructaj', 'Semnalmente']) {
  assert.ok(globalNavBlock.includes(label), `Navigația globală trebuie să includă ${label}.`);
}
assert.equal((globalNavBlock.match(/\['/g) || []).length, 5, 'Navigația globală trebuie să conțină exact cinci module.');
assert.ok(!globalNavBlock.toLowerCase().includes('ai'), 'AI nu trebuie expus în meniul global.');
const mobileNavBlock = nav.match(/function initMobileNav\(\) \{([\s\S]*?)\n  \}\n\n  function refresh/)?.[1] || '';
assert.ok(mobileNavBlock, 'Navbar-ul mobil trebuie construit într-un singur controller.');
assert.ok(!mobileNavBlock.includes('Mai multe') && !mobileNavBlock.includes('ev-mobile-more-sheet'), 'Navbar-ul mobil nu trebuie să aibă meniu secundar.');
assert.ok(!mobileNavBlock.includes("'ai'") && !mobileNavBlock.includes("'ai/"), 'Navbar-ul mobil nu trebuie să expună AI.');
assert.ok(manifest.includes('"name": "Instructaj"') && manifest.includes('"name": "Semnalmente"'), 'Shortcuts PWA trebuie să includă toate modulele publice.');
assert.ok(navigationCss.includes('grid-template-columns:repeat(5,minmax(0,1fr))'), 'Navbar-ul mobil trebuie să aibă cinci coloane egale.');
assert.ok(navigationCss.includes('ev-mobile-nav > a small'), 'Etichetele navbar-ului trebuie dimensionate pentru ecrane înguste.');
assert.ok(!manifest.includes('AI Documente') && !manifest.includes('"url": "./ai/"'), 'Shortcut-ul AI trebuie ascuns și din meniul PWA.');

for (const marker of [
  'quickCalculate', 'setMode', 'function calculate()', 'EvidentaPedepseOperational',
  'syncQuickResultControls', 'EvidentaPedepseOptional?.revealInvalid?.()', 'ev-prefill-banner', 'aria-live'
]) {
  assert.ok(pedepse.includes(marker), `Pedepse trebuie să includă ${marker}`);
}
for (const forbidden of ['buildMobileDisclosure', 'detailsShell', "document.createElement('details')", 'Opțiuni avansate', 'ev-mobile-advanced-details']) {
  assert.ok(!pedepse.includes(forbidden), `Pedepse nu trebuie să mai reconstruiască disclosure-uri la runtime: ${forbidden}`);
}
assert.ok(!pedepse.includes('stopImmediatePropagation'), 'Modurile Pedepse nu trebuie să coopereze prin blocarea propagării evenimentului.');
assert.ok(!pedepse.includes("document.createElement('div');\n    mode.className = 'ev-calc-mode'"), 'Selectorul de mod trebuie să existe în HTML, nu să fie construit de controller.');
assert.ok(!pedepse.includes('observe(document.body'));

for (const marker of ['syncFromValues', 'revealInvalid', 'window.EvidentaPedepseOptional = Object.freeze']) {
  assert.ok(pedepseOptional.includes(marker), `Controllerul opțiunilor trebuie să includă ${marker}`);
}
for (const forbidden of ['setTimeout', 'new MutationObserver', 'stopImmediatePropagation']) {
  assert.ok(!pedepseOptional.includes(forbidden), `Controllerul opțiunilor nu trebuie să conțină ${forbidden}`);
}

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

assert.ok(!disclosureCss.includes('.ev-mobile-lc-details:not([open])'), 'Secțiunea LC/PPL permanent vizibilă nu trebuie ascunsă printr-o regulă de disclosure.');
assert.ok(!mobile.includes('position:sticky'));
assert.equal([...mobile.matchAll(/position\s*:\s*fixed\s*!important/gi)].length, 1, 'Numai bottom nav trebuie să fie fixed');
assert.ok(!modules.includes('position:fixed'));
assert.ok(!modules.includes('position:sticky'));

for (const marker of ['id="prisonReceivedControl"', 'id="prisonReceivedSameAsStart"', 'id="prisonReceivedDateField"', 'data-masuri-days="30"', 'data-masuri-days="60"']) {
  assert.ok(rootHtml.includes(marker), `Markup-ul static Pedepse trebuie să includă ${marker}`);
}
assert.ok(!fs.existsSync(path.join(root, 'js/pedepse-prison-date.js')), 'Controllerul prison-date trebuie eliminat după staticizarea markup-ului.');
for (const marker of ['syncPrisonReceivedControl', 'isFullPedepseMode', 'syncPreventiveDayPresets', 'setPreventiveDays', 'Introduceți data intrării în penitenciar/centru.']) {
  assert.ok(app.includes(marker), `app.js trebuie să dețină logica statică ${marker}`);
}
assert.ok(ui.includes("dispatchEvent(new Event('input', { bubbles: true }))"), 'setToday trebuie să emită input pentru recalculări și sincronizare.');
assert.ok(!ui.includes('function addDedRow()'), 'ui.js nu trebuie să dubleze implementarea rândurilor de deducere.');
assert.ok(!ui.includes('function updDed('), 'ui.js nu trebuie să dubleze calculatorul deducerilor.');
assert.ok(storage.includes('prisonReceivedSameAsStart'), 'Stocarea trebuie să păstreze explicit starea datei intrării.');
assert.ok(storage.includes('syncPrisonReceivedControl'), 'Încărcarea spețelor trebuie să sincronizeze controlul static al datei intrării.');
assert.ok(storage.includes('EvidentaPedepseOptional?.syncFromValues?.()'), 'Încărcarea spețelor trebuie să sincronizeze explicit Situațiile suplimentare.');

for (const marker of ['validateCalculation', 'runCalculation', 'afterCalculation', 'enhanceCalculationResult']) {
  assert.ok(pedepseUx.includes(marker), `pedepse-ux trebuie să expună fluxul explicit ${marker}`);
}
for (const marker of ['ManualDeductionRules?.syncRowsForCalculation?.()', 'ManualDeductionRules?.enrichLastCalculation?.()', 'QuarantineUi?.enhance?.()']) {
  assert.ok(pedepseUx.includes(marker), `pedepse-ux trebuie să orchestreze explicit ${marker}`);
}
assert.ok(!pedepseUx.includes('bindCalculationLifecycle'), 'pedepse-ux nu trebuie să intercepteze butonul de calcul prin listener global.');
assert.ok(!pedepseUx.includes("closest('#calcBtn')"), 'pedepse-ux nu trebuie să depindă de event delegation pentru calcul.');
assert.ok(!pedepseUx.includes('setTimeout(afterCalculation'), 'Post-procesarea rezultatului trebuie să fie sincronă și explicită.');
assert.ok(!pedepseUx.includes('stopImmediatePropagation'), 'Validarea UX nu trebuie să blocheze propagarea evenimentelor.');

assert.ok(deductionUi.includes('queueMicrotask(() => syncDeductionRow(r))'), 'Deducerile trebuie să sincronizeze masca de dată fără timer.');
assert.ok(!deductionUi.includes('bindCalculationLifecycle'), 'Deducerile nu trebuie să aibă propriul listener de calcul.');
assert.ok(!deductionUi.includes("closest('#calcBtn')"), 'Deducerile nu trebuie să intercepteze butonul CALCULEAZĂ.');
assert.ok(!deductionUi.includes('setTimeout'), 'Deducerile nu trebuie să folosească timere.');
assert.ok(quarantineUi.includes('Object.freeze({ enhance })'), 'Carantina trebuie să expună numai post-procesarea explicită.');
assert.ok(!quarantineUi.includes('bindCalculationLifecycle'), 'Carantina nu trebuie să aibă propriul listener de calcul.');
assert.ok(!quarantineUi.includes("closest('#calcBtn')"), 'Carantina nu trebuie să intercepteze butonul CALCULEAZĂ.');
assert.ok(!quarantineUi.includes('setTimeout'), 'Carantina nu trebuie să folosească timere pentru calcul.');

for (const marker of ['css/mobile.css', 'css/mobile-modules.css', 'initBottomNavLayout', 'evidenta:mobile-nav-ready', "matchMedia?.('(max-width: 760px)')", "matchMedia?.('(display-mode: standalone)')"]) {
  assert.ok(pwa.includes(marker), `PWA lifecycle trebuie să includă ${marker}`);
}
assert.ok(!pwa.includes('ensureMobileStyle'), 'PWA runtime nu trebuie să injecteze css/mobile.css.');
assert.ok(!pwa.includes('LEGACY_MOBILE_STYLE_NAMES'), 'Curățarea stylesheet-urilor legacy nu mai trebuie ținută în runtime.');
assert.ok(!pwa.includes('data-evidenta-mobile-policy'), 'Proprietatea stylesheet-ului mobil trebuie să fie declarativă, nu marcată din JS.');
assert.ok(!pwa.includes("link.rel = 'stylesheet'"), 'PWA runtime nu trebuie să construiască link-uri de stylesheet.');
assert.ok(!pwa.includes('new ResizeObserver'));
assert.ok(!pwa.includes('setTimeout'), 'PWA layout nu trebuie să folosească retry-uri temporizate.');
assert.ok(!pwa.includes('normalizeMobileMoreSheet'), 'More sheet trebuie să aparțină direct bottom nav, fără reparentare PWA.');

const rootCacheVersion = sw.match(/const VERSION = ['"](v\d+)['"]/);
assert.ok(rootCacheVersion, 'Root service worker trebuie să declare o versiune numerică de cache.');
assert.ok(sw.includes('const STATIC_CACHE = `ipc-static-${VERSION}`'), 'Cache-ul static trebuie să derive din VERSION.');
assert.ok(sw.includes('const RUNTIME_CACHE = `ipc-runtime-${VERSION}`'), 'Cache-ul runtime trebuie să derive din VERSION.');
assert.ok(sw.includes("if (url.pathname.endsWith('/version.json')) return true;"), 'Metadatele versiunii trebuie revalidate din rețea, nu servite prima dată din cache-ul PWA.');
assert.ok(sw.includes("['ipc-static-', 'ipc-runtime-', 'evidenta-static-', 'evidenta-runtime-']"), 'Activarea trebuie să curețe și cache-urile cu prefixul legacy.');
assert.ok(sw.includes("isCriticalRuntime(url) || ['script', 'style'].includes(request.destination)"), 'Scripturile și stilurile trebuie revalidate din rețea înainte de folosirea cache-ului.');
assert.ok(sw.includes('const cached = await caches.match(request);'), 'Potrivirea normală din cache trebuie să respecte cheia de versiune din URL.');
assert.ok(sw.includes('operational-upgrades|mobile|mobile-modules|pedepse-modes-v3|disclosure-hardening'));
assert.ok(sw.includes('./js/pedepse-optional.js'));
assert.ok(sw.includes('pedepse-optional|deduction-ui'));
assert.ok(!sw.includes('pedepse-optional-fix-v2'));
assert.ok(!sw.includes('pedepse-prison-date'));
assert.ok(!sw.includes('pedepse-modes-v5'));
for (const file of ['operational-navigation', 'operational-pedepse', 'operational-ai', 'operational-contopiri', 'operational-transfer', 'operational-instructaj', 'operational-semnalmente']) {
  assert.ok(sw.includes(`./js/${file}.js`), `SW trebuie să includă ${file}`);
}
assert.ok(!sw.includes('mobile-operational-v2'));
assert.ok(!sw.includes('operational-finalize'));

assert.ok(aiSw.includes('evidenta-ai-shell-v22'));
assert.ok(aiSw.includes('evidenta-ai-runtime-v22'));
assert.ok(aiSw.includes('../js/operational-navigation.js'));
assert.ok(aiSw.includes('../js/operational-ai.js'));
assert.ok(aiSw.includes('../js/no-nonoptional-disclosures-v1.js'));
assert.ok(aiSw.includes('../js/disclosure-hardening-v2.js'));
assert.ok(aiSw.includes('../css/disclosure-hardening.css'));
assert.ok(aiSw.includes('../css/mobile.css'));
assert.ok(!aiSw.includes('mobile-operational-v2'));
for (const pedepseOnly of ['../js/pedepse-modes-v5.js', '../js/pedepse-optional.js', '../js/pedepse-optional-fix-v2.js', '../css/pedepse-modes-v3.css']) {
  assert.ok(!aiSw.includes(pedepseOnly), `AI SW nu trebuie să precache-uiască ${pedepseOnly}`);
}
assert.ok(!aiSw.includes('operational-finalize'));

console.log(`Mobile/PWA audit: cache ${rootCacheVersion[1]}, LC și Situațiile suplimentare Pedepse declarative, lifecycle PWA route-owned.`);
