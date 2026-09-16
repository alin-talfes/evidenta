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
const mobileCss = read('css/mobile-operational-v2.css');
const mobileRuntimeFix = read('css/mobile-runtime-fixes-v2.css');
const modes = read('js/pedepse-modes-v4.js');
const kill = read('js/pedepse-modes-v3-kill.js');
const modesCss = read('css/pedepse-modes-v3.css');
const disclosure = read('js/disclosure-hardening.js');
const disclosureCss = read('css/disclosure-hardening.css');
const pwa = read('js/pwa-register.js');
const pwaCss = read('css/pwa-mobile.css');
const navClearanceCss = read('css/mobile-bottom-nav-clearance-v4.css');
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

assert.ok(finalize.includes('openEndedOmitted'), 'Transferul AI → Pedepse trebuie să evite dublarea deducerii deschise „la zi”.');
assert.ok(finalize.includes('normalizeGlobalNav'), 'Navigarea globală trebuie normalizată pe toate modulele.');

for (const marker of ['Liberare condiționată și date PPL','Opțiuni avansate','+ REȚINERE 24H','FOTOGRAFIAZĂ MANDATUL','capture','compactContopiriResult','compactTransfer','compactSemnalmente']) {
  assert.ok(mobile.includes(marker), `Controllerul mobil trebuie să includă ${marker}`);
}
assert.ok(mobile.includes('lc.details.open = true'), 'Secțiunea LC/PPL trebuie afișată deschis implicit în modul complet.');
assert.ok(mobile.includes("const rareIds = ['recurs-heading', 'nonExec-heading', 'rest-heading'];"), 'Opțiunile avansate trebuie să conțină numai funcțiile păstrate.');
assert.ok(!mobile.includes('regime-multiple-heading'), 'Cardul REGIM — MAI MULTE PEDEPSE nu trebuie recreat.');
assert.ok(!index.includes('regime-reanalysis.js'), 'Pagina Pedepse nu trebuie să încarce modulul retras.');

for (const marker of ['Calcul rapid','Calcul complet LC','Măsuri preventive','CALCUL MĂSURI PREVENTIVE',"button.dataset.mode = 'preventive'",'movePreventiveCard','evPreventiveCard']) {
  assert.ok(modes.includes(marker), `Modurile Pedepse trebuie să includă ${marker}`);
}
assert.ok(modes.includes('observer.disconnect()'), 'Observer-ul de inițializare trebuie deconectat.');
assert.ok(kill.includes('__EVIDENTA_PEDEPSE_MODES_V3__ = true'), 'Bootstrap-ul trebuie să neutralizeze versiunea v3 cache-uită.');
assert.ok(index.includes('pedepse-modes-v3-kill.js?v=1'));
assert.ok(index.includes('pedepse-modes-v4.js?v=1'));
assert.ok(index.includes('operational-corrections-v4.js?v=1'));
assert.ok(!corrections.includes('new MutationObserver'), 'Corecțiile operaționale nu trebuie să instaleze MutationObserver permanent.');
assert.ok(!corrections.includes('bodyObserver'));
assert.ok(corrections.includes('no-nonoptional-disclosures-v1.js?v=2'));
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(index), 'index.html nu trebuie să conțină script inline.');
assert.ok(modesCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert.ok(modesCss.includes('@media (max-width:600px)'));

for (const marker of ['OPTIONAL_DETAILS_SELECTOR','details.ev-mobile-advanced-details','.ev-optional-tools details','details[data-ev-optional="true"]','details.open = true','neutralizeSummary','evStaticDisclosure','::-webkit-details-marker','pointer-events:none']) {
  assert.ok(noSpoilers.includes(marker), `Politica optional-only trebuie să includă ${marker}`);
}
assert.ok(!noSpoilers.includes('replaceSummary'), 'Summary-ul ne-opțional nu trebuie eliminat pe Safari.');
assert.ok(!noSpoilers.includes('new MutationObserver'));

for (const marker of ['DETAILS_SELECTOR','aria-expanded','aria-controls','repairPreventiveCardOwnership','ev-saved-collapsed','is-collapsed']) {
  assert.ok(disclosure.includes(marker), `Hardening-ul disclosure trebuie să includă ${marker}`);
}
assert.ok(disclosureCss.includes('.ev-mobile-advanced-details:not([open])'));
assert.ok(mobileCss.includes('@media (max-width:600px)'));
assert.ok(mobileCss.includes('font-size:16px'));

assert.ok(index.includes('mobile-runtime-fixes-v2.css?v=1'));
for (const marker of ['--ev-quick-sticky-action-height','.ev-mobile-advanced-details:not([open])','scroll-margin-bottom:calc(150px + env(safe-area-inset-bottom, 0px))']) {
  assert.ok(mobileRuntimeFix.includes(marker), `Fixul sticky trebuie să includă ${marker}`);
}

for (const marker of ['ensureViewportFit','viewport-fit=cover','visualViewport','ev-ios','ev-android','navigator.onLine','ensureBottomNavClearance','mobile-bottom-nav-clearance-v4.css?v=1','ev-mobile-nav-inset','--ev-mobile-nav-live-height','ResizeObserver']) {
  assert.ok(pwa.includes(marker), `Controllerul PWA trebuie să includă ${marker}`);
}
assert.ok(pwaCss.includes('ev-offline-badge'));

for (const marker of ['html.ev-mobile-nav-inset','overflow: hidden !important','height: calc(var(--ev-visual-height, 100dvh) - var(--ev-mobile-nav-effective-height))','overflow-y: auto !important','--ev-mobile-content-breathing-room','.ev-mobile-nav-clearance-spacer','scroll-margin-bottom']) {
  assert.ok(navClearanceCss.includes(marker), `Viewport-ul separat de bottom-nav trebuie să includă ${marker}`);
}
assert.ok(!navClearanceCss.includes('padding-bottom: var(--ev-mobile-content-clearance)'), 'v4 nu trebuie să se bazeze din nou pe padding egal cu înălțimea nav-ului.');

for (const marker of ['service worker',"const VERSION = 'v15'",'networkFirstStatic','isCriticalRuntime','PRECACHE_OPTIONAL','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/','./js/pwa-register.js','./css/mobile-bottom-nav-clearance-v4.css']) {
  assert.ok(sw.includes(marker), `Service Worker-ul principal trebuie să includă ${marker}`);
}
assert.ok(sw.includes('mobile-bottom-nav-clearance-v[234]'), 'Fixurile bottom-nav trebuie servite network-first.');
assert.ok(!sw.includes('./js/regime-reanalysis.js'), 'Service Worker-ul nu trebuie să mai păstreze modulul retras.');

for (const marker of ['verifiedResponse','SHA-256','evidenta-ai-shell-v8','evidenta-ai-runtime-v8','tessdata-best/ron.traineddata.gz','navigationResponse','../js/pwa-register.js','../css/mobile-bottom-nav-clearance-v4.css','isCriticalSharedRuntime']) {
  assert.ok(aiSw.includes(marker), `Service Worker-ul AI trebuie să păstreze securitatea și fixul bottom-nav: ${marker}`);
}

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, './');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.some(item => item.url === './ai/'));

console.log('Mobile/PWA audit: bottom-nav are viewport separat și nu poate acoperi conținutul, cache-ul critic este network-first, modurile Pedepse și politica optional-only rămân protejate.');
