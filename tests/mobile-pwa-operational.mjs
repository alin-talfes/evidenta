import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const operational = read('js/operational-upgrades.js');
const corrections = read('js/operational-corrections-v4.js');
const noSpoilers = read('js/no-nonoptional-disclosures-v1.js');
const finalize = read('js/operational-finalize.js');
const mobile = read('js/mobile-operational-v2.js');
const mobilePolicy = read('css/mobile.css');
const mobileModules = read('css/mobile-modules.css');
const modes = read('js/pedepse-modes-v4.js');
const kill = read('js/pedepse-modes-v3-kill.js');
const modesCss = read('css/pedepse-modes-v3.css');
const disclosure = read('js/disclosure-hardening.js');
const disclosureCss = read('css/disclosure-hardening.css');
const pwa = read('js/pwa-register.js');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const index = read('index.html');
const manifest = JSON.parse(read('manifest.json'));

for (const marker of ['operational-upgrades.js?v=1','operational-corrections-v4.js?v=1','operational-finalize.js?v=1','mobile-operational-v2.js?v=1','pedepse-modes-v4.js?v=1','disclosure-hardening.js?v=1','pwa-register.js?v=1']) {
  assert.ok(version.includes(marker), `Loaderul global trebuie să includă ${marker}`);
}

for (const marker of ['ev-mobile-nav','Calcul rapid','quickCalculate','sendAiToPedepse','addContopiriTransferButton','initTransfer','initInstructajSearch','initSemnalmente']) {
  assert.ok(operational.includes(marker), `Fluxul operațional trebuie să includă ${marker}`);
}

assert.ok(finalize.includes('openEndedOmitted'));
assert.ok(finalize.includes('normalizeGlobalNav'));

for (const marker of ['Liberare condiționată și date PPL','Opțiuni avansate','FOTOGRAFIAZĂ MANDATUL','capture','compactContopiriResult','compactTransfer','compactSemnalmente']) {
  assert.ok(mobile.includes(marker), `Controllerul mobil trebuie să includă ${marker}`);
}
assert.ok(!mobile.includes('+ REȚINERE 24H'), 'Controllerul mobil nu trebuie să recreeze scurtătura pentru reținere.');
assert.ok(!mobile.includes('addRetentionPreset'), 'Fluxul pentru deduceri trebuie să rămână unic prin + Adaugă.');
assert.ok(mobile.includes('css/mobile-modules.css'));
assert.ok(!mobile.includes('css/mobile-operational-v2.css'));
assert.ok(mobile.includes('lc.details.open = true'));
assert.ok(mobile.includes("const rareIds = ['recurs-heading', 'nonExec-heading', 'rest-heading'];"));
assert.ok(!mobile.includes('regime-multiple-heading'));
assert.ok(!index.includes('regime-reanalysis.js'));

for (const marker of ['Calcul rapid','Calcul complet LC','Măsuri preventive','CALCUL MĂSURI PREVENTIVE',"button.dataset.mode = 'preventive'",'movePreventiveCard','evPreventiveCard']) {
  assert.ok(modes.includes(marker), `Modurile Pedepse trebuie să includă ${marker}`);
}
assert.ok(modes.includes('observer.disconnect()'));
assert.ok(kill.includes('__EVIDENTA_PEDEPSE_MODES_V3__ = true'));
assert.ok(index.includes('pedepse-modes-v3-kill.js?v=1'));
assert.ok(index.includes('pedepse-modes-v4.js?v=1'));
assert.ok(index.includes('operational-corrections-v4.js?v=1'));
assert.ok(!corrections.includes('new MutationObserver'));
assert.ok(!corrections.includes('bodyObserver'));
assert.ok(corrections.includes('no-nonoptional-disclosures-v1.js?v=2'));
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(index));
assert.ok(modesCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
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

/* Politica mobilă canonică: un singur scroll; numai bottom nav este persistent. */
for (const marker of ['html.ev-mobile-nav-layout','overflow-y:auto !important','overflow:visible !important','.ev-operational-search','.ev-calc-mode','.analysis-panel','.sidebar','.quiz-top','.page-actions','.ev-mobile-nav','position:fixed !important','bottom:0 !important']) {
  assert.ok(mobilePolicy.includes(marker), `css/mobile.css trebuie să includă ${marker}`);
}
assert.ok(mobilePolicy.includes('#sentenceDuration'));
assert.ok(mobilePolicy.includes('grid-template-columns:repeat(3, minmax(0, 1fr))'));
assert.ok(mobilePolicy.includes('body.ev-unified[data-ev-page="pedepse"] .btn-row'));
assert.ok(mobilePolicy.includes('position:static !important'));
assert.ok(!mobilePolicy.includes('position:sticky'), 'Politica mobilă canonică nu trebuie să conțină sticky.');

const fixedDeclarations = [...mobilePolicy.matchAll(/position\s*:\s*fixed\s*!important/gi)];
assert.equal(fixedDeclarations.length, 1, 'În css/mobile.css numai bottom nav trebuie să aibă position:fixed.');

assert.ok(mobileModules.includes('@media (max-width:600px)'));
assert.ok(mobileModules.includes('.deduction-row'));
assert.ok(mobileModules.includes('.ai-table'));
assert.ok(!mobileModules.includes('position:fixed'));
assert.ok(!mobileModules.includes('position:sticky'));
assert.ok(!mobileModules.includes('.ev-retention-preset'));
assert.ok(!mobileModules.includes('bottom:calc(66px'));

assert.ok(!index.includes('mobile-runtime-fixes-v2.css'), 'index.html nu trebuie să încarce vechiul hotfix mobil.');

for (const marker of ['ensureViewportFit','viewport-fit=cover','visualViewport','ev-ios','ev-android','navigator.onLine','ensureMobileStyle','css/mobile.css?v=1','mobile-operational-v2.css','ev-mobile-nav-layout','clearLegacyBottomNavState','syncBottomNavLayout','css/mobile-modules.css']) {
  assert.ok(pwa.includes(marker), `Controllerul PWA trebuie să includă ${marker}`);
}
assert.ok(!pwa.includes('new ResizeObserver'));
assert.ok(!pwa.includes('scheduleBottomNavMetrics'));

for (const marker of ['service worker',"const VERSION = 'v19'",'networkFirstStatic','isCriticalRuntime','PRECACHE_OPTIONAL','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/','./js/pwa-register.js','./css/mobile.css','./css/mobile-modules.css']) {
  assert.ok(sw.includes(marker), `Service Worker-ul principal trebuie să includă ${marker}`);
}
for (const legacy of ['mobile-bottom-nav-clearance-v5.css','mobile-no-floating-v2.css','pwa-mobile.css','mobile-runtime-fixes-v2.css','mobile-operational-v2.css']) {
  assert.ok(!sw.includes(`./css/${legacy}`), `Service Worker-ul principal nu trebuie să precache-uiască ${legacy}`);
}
assert.ok(!sw.includes('./js/regime-reanalysis.js'));

for (const marker of ['verifiedResponse','SHA-256','evidenta-ai-shell-v10','evidenta-ai-runtime-v10','tessdata-best/ron.traineddata.gz','navigationResponse','../js/pwa-register.js','../css/mobile.css','../css/mobile-modules.css','isCriticalSharedRuntime']) {
  assert.ok(aiSw.includes(marker), `Service Worker-ul AI trebuie să includă ${marker}`);
}
assert.ok(aiSw.includes('(?:version|pwa-register|mobile-operational-v2)'));
assert.ok(!aiSw.includes('../css/mobile-bottom-nav-clearance-v5.css'));
assert.ok(!aiSw.includes('../css/mobile-operational-v2.css'));

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, './');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.some(item => item.url === './ai/'));

console.log('Mobile/PWA audit: un singur stylesheet de politică mobilă, module responsive separate, un singur scroll și numai bottom nav persistent.');
