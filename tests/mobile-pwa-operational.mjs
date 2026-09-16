import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const operational = read('js/operational-upgrades.js');
const operationalCss = read('css/operational-upgrades.css');
const corrections = read('js/operational-corrections-v4.js');
const prisonDate = read('js/pedepse-prison-date.js');
const rules = read('js/rules.js');
const app = read('js/app.js');
const pedepseUx = read('js/pedepse-ux.js');
const noSpoilers = read('js/no-nonoptional-disclosures-v1.js');
const finalize = read('js/operational-finalize.js');
const mobile = read('js/mobile-operational-v2.js');
const mobilePolicy = read('css/mobile.css');
const mobileModules = read('css/mobile-modules.css');
const modes = read('js/pedepse-modes-v5.js');
const modesCss = read('css/pedepse-modes-v3.css');
const disclosure = read('js/disclosure-hardening-v2.js');
const disclosureCss = read('css/disclosure-hardening.css');
const pwa = read('js/pwa-register.js');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const index = read('index.html');
const manifest = JSON.parse(read('manifest.json'));

for (const marker of ['ux-upgrades.js?v=3','operational-upgrades.js?v=1','operational-corrections-v4.js?v=2','operational-finalize.js?v=1','mobile-operational-v2.js?v=2','pwa-register.js?v=2']) {
  assert.ok(version.includes(marker), `Loaderul global trebuie să includă ${marker}`);
}
for (const legacy of ['pedepse-modes-v4.js','pedepse-optional-fix.js','disclosure-hardening.js?v=1']) {
  assert.ok(!version.includes(legacy), `Loaderul global nu trebuie să mai încarce ${legacy}`);
}

for (const marker of ['ev-mobile-nav','Calcul rapid','quickCalculate','sendAiToPedepse','addContopiriTransferButton','initTransfer','initInstructajSearch','initSemnalmente']) {
  assert.ok(operational.includes(marker), `Fluxul operațional trebuie să includă ${marker}`);
}
assert.ok(!operational.includes('overrideDeductionSummation'), 'Politica de însumare trebuie definită în rules.js, nu suprascrisă la runtime.');
assert.ok(!operational.includes('replaceOverlapCopy'), 'Copy-ul pentru suprapuneri trebuie definit la sursă, nu corectat după randare.');
assert.ok(!operationalCss.includes('position:sticky'), 'Stratul operațional nu trebuie să mai creeze suprafețe sticky pe mobil.');
assert.ok(!operationalCss.includes('position:fixed'), 'Poziționarea fixed trebuie să fie definită exclusiv în politica canonică mobile.css.');
assert.ok(operationalCss.includes('.ev-mobile-more-sheet {\n    position:absolute;'), 'Meniul Mai multe trebuie ancorat absolut de bottom nav, nu de viewport.');

assert.ok(rules.includes('Suprapunerile nu sunt deduplicate'));
assert.ok(rules.includes('return sum + daysBetween(start, end) + 1'));
assert.ok(!rules.includes('currentEnd'), 'Motorul nu trebuie să deduplicate suprapunerile în sumIntervals.');
assert.ok(app.includes('însumarea integrală a intervalelor introduse'));
assert.ok(app.includes('Intervalele sunt calculate integral, inclusiv porțiunile suprapuse'));
assert.ok(app.includes('Intervalele efective sunt calculate integral, inclusiv porțiunile suprapuse'));
assert.ok(!app.includes('după unificarea suprapunerilor'));
assert.ok(!app.includes('după eliminarea dublării suprapunerilor'));
assert.ok(!app.includes('Zilele comune au fost numărate o singură dată'));
assert.ok(pedepseUx.includes('Intervalele sunt calculate integral; verifică dacă suprapunerea este intenționată.'));
assert.ok(pedepseUx.includes('Intervalele efective sunt calculate integral; verifică dacă suprapunerea este intenționată.'));
assert.ok(!pedepseUx.includes('Zilele comune vor fi numărate o singură dată.'));

assert.ok(finalize.includes('openEndedOmitted'));
assert.ok(finalize.includes('normalizeGlobalNav'));

for (const marker of ['Liberare condiționată și date PPL','Opțiuni avansate','FOTOGRAFIAZĂ MANDATUL','capture','compactContopiriResult','compactTransfer','compactSemnalmente']) {
  assert.ok(mobile.includes(marker), `Controllerul mobil trebuie să includă ${marker}`);
}
assert.ok(!mobile.includes('+ REȚINERE 24H'));
assert.ok(!mobile.includes('addRetentionPreset'));
assert.ok(mobile.includes('css/mobile-modules.css'));
assert.ok(!mobile.includes('css/mobile-operational-v2.css'));
assert.ok(mobile.includes('lc.details.open = true'));
assert.ok(mobile.includes("const rareIds = ['recurs-heading', 'nonExec-heading', 'rest-heading'];"));
assert.ok(!index.includes('regime-reanalysis.js'));

for (const marker of ['Calcul rapid','Calcul complet LC','Măsuri preventive','CALCUL MĂSURI PREVENTIVE',"button.dataset.mode = 'preventive'",'movePreventiveCard','evPreventiveCard','ensurePreventiveDayPresets','data-masuri-days','[30, 60]']) {
  assert.ok(modes.includes(marker), `Modurile Pedepse trebuie să includă ${marker}`);
}
assert.ok(!index.includes('pedepse-modes-v3-kill.js'));
assert.ok(!index.includes('pedepse-modes-v4.js'));
assert.ok(!index.includes('operational-corrections-v4.js'), 'index.html nu trebuie să dubleze controllerul încărcat de version.js.');
assert.ok(!index.includes('no-nonoptional-disclosures-v1.js'), 'index.html nu trebuie să dubleze politica disclosure încărcată de controllerul stabil.');
assert.ok(!corrections.includes('new MutationObserver'));
assert.ok(!corrections.includes('bodyObserver'));
assert.ok(!corrections.includes('patchText'));
assert.ok(!corrections.includes('patchOverlapNotices'));
assert.ok(!corrections.includes('createTreeWalker'));
assert.ok(corrections.includes('pedepse-modes-v5.js?v=1'));
assert.ok(corrections.includes('pedepse-optional-fix-v2.js?v=1'));
assert.ok(corrections.includes('disclosure-hardening-v2.js?v=1'));
assert.ok(corrections.includes('no-nonoptional-disclosures-v1.js?v=2'));
assert.ok(corrections.includes('pedepse-prison-date.js?v=1'));
assert.ok(!corrections.includes('patchPedepseFunctions'));
assert.ok(!corrections.includes('__evPrisonDatePatched'));
assert.ok(!corrections.includes("document.createElement('style')"));
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(index));

for (const marker of ['setupControl','sync({ infer = false }','validateBeforeCalculation','prisonReceivedSameAsStart','window.syncPrisonReceivedControl']) {
  assert.ok(prisonDate.includes(marker), `Controllerul datei de intrare trebuie să includă ${marker}`);
}
assert.ok(!prisonDate.includes('__evPrisonDatePatched'));
assert.ok(!prisonDate.includes('window.calculateAll ='));
assert.ok(!prisonDate.includes('window.populateStoredCase ='));
assert.ok(!prisonDate.includes('window.setToday ='));

assert.ok(modesCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert.ok(modesCss.includes('.ev-preventive-days-control'));
assert.ok(modesCss.includes('.ev-prison-same-check'));
assert.ok(modesCss.includes('body.ev-quick-mode #prisonReceivedControl'));
assert.ok(modesCss.includes('@media (max-width:600px)'));

for (const marker of ['OPTIONAL_DETAILS_SELECTOR','details.ev-mobile-advanced-details','.ev-optional-tools details','details[data-ev-optional="true"]','details.open = true','neutralizeSummary','evStaticDisclosure','::-webkit-details-marker','pointer-events:none']) {
  assert.ok(noSpoilers.includes(marker), `Politica optional-only trebuie să includă ${marker}`);
}
assert.ok(!noSpoilers.includes('replaceSummary'));
assert.ok(!noSpoilers.includes('new MutationObserver'));

for (const marker of ['DETAILS_SELECTOR','aria-expanded','aria-controls','repairPreventiveCardOwnership','ev-saved-collapsed','is-collapsed']) {
  assert.ok(disclosure.includes(marker));
}
assert.ok(disclosureCss.includes('.ev-mobile-advanced-details:not([open])'));

for (const marker of ['html.ev-mobile-nav-layout','overflow-y:auto !important','overflow:visible !important','.ev-operational-search','.ev-calc-mode','.analysis-panel','.sidebar','.quiz-top','.page-actions','.ev-mobile-nav','position:fixed !important','bottom:0 !important']) {
  assert.ok(mobilePolicy.includes(marker), `css/mobile.css trebuie să includă ${marker}`);
}
assert.ok(mobilePolicy.includes('#sentenceDuration'));
assert.ok(mobilePolicy.includes('grid-template-columns:repeat(3, minmax(0, 1fr))'));
assert.ok(mobilePolicy.includes('body.ev-unified[data-ev-page="pedepse"] .btn-row'));
assert.ok(mobilePolicy.includes('position:static !important'));
assert.ok(!mobilePolicy.includes('position:sticky'));
assert.equal([...mobilePolicy.matchAll(/position\s*:\s*fixed\s*!important/gi)].length, 1, 'În css/mobile.css numai bottom nav trebuie să fie fixed.');
assert.ok(mobilePolicy.includes('.ev-mobile-nav > .ev-mobile-more-sheet { position:absolute !important; }'));

assert.ok(mobileModules.includes('@media (max-width:600px)'));
assert.ok(mobileModules.includes('.deduction-row'));
assert.ok(mobileModules.includes('.ai-table'));
assert.ok(!mobileModules.includes('position:fixed'));
assert.ok(!mobileModules.includes('position:sticky'));
assert.ok(!mobileModules.includes('.ev-retention-preset'));
assert.ok(!mobileModules.includes('bottom:calc(66px'));
assert.ok(!index.includes('mobile-runtime-fixes-v2.css'));

for (const marker of ['ensureViewportFit','viewport-fit=cover','visualViewport','ev-ios','ev-android','navigator.onLine','ensureMobileStyle','css/mobile.css?v=1','mobile-operational-v2.css','ev-mobile-nav-layout','clearLegacyBottomNavState','normalizeMobileMoreSheet','nav.appendChild(sheet)','syncBottomNavLayout','css/mobile-modules.css']) {
  assert.ok(pwa.includes(marker), `Controllerul PWA trebuie să includă ${marker}`);
}
assert.ok(!pwa.includes('new ResizeObserver'));
assert.ok(!pwa.includes('scheduleBottomNavMetrics'));

for (const marker of ['service worker',"const VERSION = 'v23'",'networkFirstStatic','isCriticalRuntime','PRECACHE_OPTIONAL','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/','./js/pwa-register.js','./js/ux-upgrades.js','./js/rules.js','./js/app.js','./js/pedepse-ux.js','./css/mobile.css','./css/mobile-modules.css','./js/pedepse-modes-v5.js','./js/pedepse-prison-date.js','./js/pedepse-optional-fix-v2.js','./js/disclosure-hardening-v2.js']) {
  assert.ok(sw.includes(marker), `Service Worker-ul principal trebuie să includă ${marker}`);
}
assert.ok(sw.includes('(?:version|ux-upgrades|rules|app|pedepse-ux|operational-upgrades'));
assert.ok(sw.includes('pedepse-prison-date'));
for (const legacy of ['mobile-bottom-nav-clearance-v5.css','mobile-no-floating-v2.css','pwa-mobile.css','mobile-runtime-fixes-v2.css','mobile-operational-v2.css','pedepse-modes-v4.js','pedepse-modes-v3-kill.js']) {
  assert.ok(!sw.includes(legacy), `Service Worker-ul principal nu trebuie să precache-uiască ${legacy}`);
}

for (const marker of ['verifiedResponse','SHA-256','evidenta-ai-shell-v12','evidenta-ai-runtime-v12','tessdata-best/ron.traineddata.gz','navigationResponse','../js/pwa-register.js','../js/ux-upgrades.js','../css/mobile.css','../css/mobile-modules.css','../js/pedepse-modes-v5.js','../js/pedepse-optional-fix-v2.js','../js/disclosure-hardening-v2.js','isCriticalSharedRuntime']) {
  assert.ok(aiSw.includes(marker), `Service Worker-ul AI trebuie să includă ${marker}`);
}
assert.ok(aiSw.includes('(?:version|ux-upgrades|pwa-register'));
assert.ok(!aiSw.includes('../js/pedepse-modes-v4.js'));
assert.ok(!aiSw.includes('../js/disclosure-hardening.js'));

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, './');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.some(item => item.url === './ai/'));

console.log('Mobile/PWA audit: overlap policy canonică în sursă, prison-date fără monkey patch, numai bottom nav fixed.');
