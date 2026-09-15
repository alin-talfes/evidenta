import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const operational = read('js/operational-upgrades.js');
const finalize = read('js/operational-finalize.js');
const mobile = read('js/mobile-operational-v2.js');
const mobileCss = read('css/mobile-operational-v2.css');
const modes = read('js/pedepse-modes-v3.js');
const modesCss = read('css/pedepse-modes-v3.css');
const disclosure = read('js/disclosure-hardening.js');
const disclosureCss = read('css/disclosure-hardening.css');
const pwa = read('js/pwa-register.js');
const pwaCss = read('css/pwa-mobile.css');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const index = read('index.html');
const manifest = JSON.parse(read('manifest.json'));

for (const marker of ['operational-upgrades.js?v=1','operational-finalize.js?v=1','mobile-operational-v2.js?v=1','pedepse-modes-v3.js?v=2','disclosure-hardening.js?v=1','pwa-register.js?v=1']) {
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
assert.ok(
  mobile.includes("const rareIds = ['recurs-heading', 'nonExec-heading', 'rest-heading'];"),
  'Opțiunile avansate trebuie să conțină numai funcțiile păstrate.'
);
assert.ok(!mobile.includes('regime-multiple-heading'), 'Cardul REGIM — MAI MULTE PEDEPSE a fost retras și nu trebuie recreat/mutat de controllerul mobil.');
assert.ok(!index.includes('regime-reanalysis.js'), 'Pagina Pedepse nu trebuie să mai încarce modulul retras de art. 53/mai multe pedepse.');
assert.ok(!index.includes('REGIM — MAI MULTE PEDEPSE'), 'Cardul retras nu trebuie să existe în markup.');

for (const marker of ['Calcul rapid','Calcul complet LC','Măsuri preventive','CALCUL MĂSURI PREVENTIVE',"button.dataset.mode = 'preventive'","createElement('section')",'movePreventiveCard','evPreventiveCard']) {
  assert.ok(modes.includes(marker), `Modurile Pedepse trebuie să includă ${marker}`);
}
assert.ok(modesCss.includes('grid-template-columns:repeat(3,minmax(0,1fr))'), 'Cele trei moduri trebuie aliniate în trei coloane egale.');
assert.ok(modesCss.includes('@media (max-width:600px)'), 'Cele trei moduri trebuie să aibă layout dedicat pe telefon.');
assert.ok(modesCss.includes('@media (max-width:380px)'), 'Etichetele celor trei moduri trebuie să rămână lizibile și pe telefoane înguste.');

for (const marker of ['DETAILS_SELECTOR','aria-expanded','aria-controls','repairPreventiveCardOwnership','ev-saved-collapsed','is-collapsed']) {
  assert.ok(disclosure.includes(marker), `Hardening-ul disclosure trebuie să includă ${marker}`);
}
for (const marker of ['.ev-mobile-lc-details:not([open])','.ev-mobile-advanced-details:not([open])','.ev-ai-evidence-details:not([open])','.ev-saved-collapsed .saved-heading-row .compact-actions','.ev-collapsible-notice.is-collapsed']) {
  assert.ok(disclosureCss.includes(marker), `CSS-ul disclosure trebuie să protejeze starea pliată: ${marker}`);
}

assert.ok(mobileCss.includes('@media (max-width:600px)'), 'Layout-ul operațional trebuie optimizat explicit pentru telefoane ≤600 px.');
assert.ok(mobileCss.includes('.ai-table thead { display:none'), 'Tabelele AI trebuie transformate în carduri pe telefon.');
assert.ok(mobileCss.includes('.deduction-row'), 'Deducerile trebuie să aibă layout mobil de tip card.');
assert.ok(mobileCss.includes('env(safe-area-inset-bottom'), 'Layout-ul mobil trebuie să respecte safe-area iPhone.');
assert.ok(mobileCss.includes('font-size:16px'), 'Inputurile mobile trebuie să evite zoom-ul automat Safari iOS.');

for (const marker of ['ensureViewportFit','viewport-fit=cover','apple-mobile-web-app-capable','mobile-web-app-capable','visualViewport','ev-ios','ev-android','navigator.onLine','pwa-mobile.css?v=2']) {
  assert.ok(pwa.includes(marker), `Controllerul PWA trebuie să includă auditul/platforma ${marker}`);
}
assert.ok(pwaCss.includes('ev-offline-badge'), 'Starea offline trebuie comunicată vizual.');
assert.ok(pwaCss.includes('.ev-shell__brand-home'), 'Identitatea din header trebuie stilizată fără linkuri imbricate.');
assert.ok(pwaCss.includes('white-space:normal'), 'Metadatele versiunii/copyright trebuie să poată coborî pe rândul doi pe telefoane mici.');

for (const marker of ['service worker','evidenta-static-','navigationResponse','PRECACHE_OPTIONAL','./contopiri/','./transfer/','./instructaj/','./semnalmente/','./ai/','./js/pedepse-modes-v3.js','./css/pedepse-modes-v3.css','./js/disclosure-hardening.js','./css/disclosure-hardening.css']) {
  assert.ok(sw.includes(marker), `Service Worker-ul principal trebuie să includă ${marker}`);
}
assert.ok(!sw.includes('./js/regime-reanalysis.js'), 'Service Worker-ul nu trebuie să mai păstreze în cache modulul retras.');
for (const marker of ['verifiedResponse','SHA-256','evidenta-ai-shell-v4','tessdata-best/ron.traineddata.gz','navigationResponse','../js/pedepse-modes-v3.js','../css/pedepse-modes-v3.css','../js/disclosure-hardening.js','../css/disclosure-hardening.css']) {
  assert.ok(aiSw.includes(marker), `Service Worker-ul AI trebuie să păstreze securitatea și offline-ul: ${marker}`);
}

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, './');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.some(item => item.url === './ai/'), 'Manifestul trebuie să păstreze shortcut-ul AI.');

console.log('Mobile/PWA audit: bottom navigation, moduri Pedepse, măsuri preventive separate, cardul regim multiplu retras, disclosure-uri, viewport iPhone/Android, camere, prefill, carduri și offline verificate.');
