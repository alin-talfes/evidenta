import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const version = read('js/version.js');
const nav = read('js/operational-navigation.js');
const pedepse = read('js/operational-pedepse.js');
const ai = read('js/operational-ai.js');
const contopiri = read('js/operational-contopiri.js');
const transfer = read('js/operational-transfer.js');
const instructaj = read('js/operational-instructaj.js');
const semnalmente = read('js/operational-semnalmente.js');
const mobile = read('css/mobile.css');
const modules = read('css/mobile-modules.css');
const sw = read('sw.js');
const aiSw = read('ai/security-sw.js');
const pwa = read('js/pwa-register.js');
const modes = read('js/pedepse-modes-v5.js');
const prison = read('js/pedepse-prison-date.js');

for (const marker of [
  'operational-navigation.js?v=2', 'operational-pedepse.js?v=2', 'operational-ai.js?v=2',
  'operational-contopiri.js?v=1', 'operational-transfer.js?v=1',
  'operational-instructaj.js?v=1', 'operational-semnalmente.js?v=1'
]) assert.ok(version.includes(marker), `Lipsește ${marker}`);
assert.ok(version.includes('ensureGlobalOperationalControllers'));
assert.ok(version.includes('ensurePedepseOperationalControllers'));
assert.ok(version.includes('if (isPedepsePage(p)) ensurePedepseOperationalControllers();'));

for (const retired of ['operational-upgrades.js', 'operational-finalize.js', 'operational-corrections-v4']) {
  assert.ok(!version.includes(retired), `${retired} nu trebuie încărcat`);
  assert.ok(!fs.existsSync(path.join(root, 'js', retired)), `${retired} trebuie eliminat`);
}

for (const marker of ['normalizeGlobalNav', 'normalizeDateInputs', 'removeOfficerSuiteNav', 'ev-mobile-nav', 'evidenta:shellready']) {
  assert.ok(nav.includes(marker), `Navigația trebuie să includă ${marker}`);
}
for (const marker of ['quickCalculate', 'syncQuickResultControls', 'ev-prefill-banner', 'aria-live']) {
  assert.ok(pedepse.includes(marker), `Pedepse trebuie să includă ${marker}`);
}
for (const marker of ['sendAiToPedepse', 'sendAiToContopiri', 'aiRowIsOpenEnded', 'transferDeductions', 'openEndedOmitted', 'ev-ai-open-ended-note']) {
  assert.ok(ai.includes(marker), `AI trebuie să includă ${marker}`);
}

assert.ok(contopiri.includes('resultObserver.observe(result, { childList:true })'));
assert.ok(contopiri.includes('removeContopiriTransferButton'));
assert.ok(!contopiri.includes('window.calculateMergedPenalties ='));
assert.ok(transfer.includes('addTransferCopy'));
assert.ok(instructaj.includes('CĂUTARE OPERATIVĂ'));
assert.ok(semnalmente.includes("setAttribute('capture', 'environment')"));

assert.ok(!mobile.includes('position:sticky'));
assert.equal([...mobile.matchAll(/position\s*:\s*fixed\s*!important/gi)].length, 1, 'Numai bottom nav trebuie să fie fixed');
assert.ok(!modules.includes('position:fixed'));
assert.ok(!modules.includes('position:sticky'));

for (const marker of ['Calcul rapid', 'Calcul complet LC', 'Măsuri preventive', 'data-masuri-days', '[30, 60]']) assert.ok(modes.includes(marker));
for (const marker of ['setupControl', 'validateBeforeCalculation', 'prisonReceivedSameAsStart']) assert.ok(prison.includes(marker));
assert.ok(!prison.includes('window.calculateAll ='));

assert.ok(pwa.includes('css/mobile.css?v=1'));
assert.ok(pwa.includes('css/mobile-modules.css'));
assert.ok(!pwa.includes('new ResizeObserver'));

assert.ok(sw.includes("const VERSION = 'v29'"));
for (const file of ['operational-navigation', 'operational-pedepse', 'operational-ai', 'operational-contopiri', 'operational-transfer', 'operational-instructaj', 'operational-semnalmente']) {
  assert.ok(sw.includes(`./js/${file}.js`), `SW trebuie să includă ${file}`);
}
assert.ok(!sw.includes('operational-finalize'));

assert.ok(aiSw.includes('evidenta-ai-shell-v16'));
assert.ok(aiSw.includes('evidenta-ai-runtime-v16'));
assert.ok(aiSw.includes('../js/operational-navigation.js'));
assert.ok(aiSw.includes('../js/operational-ai.js'));
assert.ok(aiSw.includes('../js/no-nonoptional-disclosures-v1.js'));
assert.ok(aiSw.includes('../js/disclosure-hardening-v2.js'));
for (const pedepseOnly of ['../js/pedepse-modes-v5.js', '../js/pedepse-optional-fix-v2.js', '../css/pedepse-modes-v3.css']) {
  assert.ok(!aiSw.includes(pedepseOnly), `AI SW nu trebuie să precache-uiască ${pedepseOnly}`);
}
assert.ok(!aiSw.includes('operational-finalize'));

console.log('Mobile/PWA audit: controllere modulare, Pedepse încărcat doar pe ruta sa și numai bottom nav fixed.');