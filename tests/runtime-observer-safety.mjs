import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const operationalControllers = [
  'js/operational-navigation.js',
  'js/operational-pedepse.js',
  'js/operational-ai.js',
  'js/operational-contopiri.js',
  'js/operational-transfer.js',
  'js/operational-instructaj.js',
  'js/operational-semnalmente.js'
].map(file => [file, read(file)]);
const semnalmente = read('semnalmente/enhancements.js');

const broadBodyChildObserver = /\.observe\(document\.body\s*,\s*\{[^}]*childList\s*:\s*true[^}]*subtree\s*:\s*true/i;

for (const [file, source] of operationalControllers) {
  assert.ok(!broadBodyChildObserver.test(source), `${file} nu trebuie să observe permanent întreg document.body pentru childList/subtree.`);
}
assert.ok(!fs.existsSync(path.join(root, 'js/mobile-operational-v2.js')), 'Controllerul mobil monolitic trebuie eliminat.');
assert.ok(!fs.existsSync(path.join(root, 'js/operational-finalize.js')), 'Finalizerul operațional intermediar trebuie eliminat.');

const pedepse = read('js/operational-pedepse.js');
const contopiri = read('js/operational-contopiri.js');
const transfer = read('js/operational-transfer.js');
const ai = read('js/operational-ai.js');
assert.ok(!pedepse.includes('observe(document.body'), 'Pedepse trebuie să sincronizeze modurile direct, fără observer pe body.');
assert.ok(contopiri.includes('resultObserver.observe(result, { childList:true, subtree:true })'), 'Observerul Contopiri trebuie limitat la containerul rezultatului.');
assert.ok(contopiri.includes('rowsObserver.observe(rows, { childList:true })'), 'Observerul Contopiri pentru invalidare trebuie limitat la rândurile de pedepse.');
assert.ok(transfer.includes('new MutationObserver(addTransferCopy).observe(resultArea'), 'Observerul Transfer trebuie limitat la zona rezultatului.');
assert.ok(ai.includes('new MutationObserver(syncAiPrimary).observe(deductionRows'), 'Observerul AI trebuie limitat la rândurile de deduceri.');
assert.ok(ai.includes('new MutationObserver(syncEvidenceVisibility).observe(evidence'), 'Observerul vizibilității dovezilor AI trebuie limitat la cardul de dovezi.');

assert.ok(
  semnalmente.includes("if (!paragraph || paragraph.textContent === next) return;"),
  'Normalizarea mesajului de fiabilitate trebuie să fie idempotentă înainte de a modifica textContent.'
);
assert.ok(
  semnalmente.includes('new MutationObserver(normalizeReliabilityNotice).observe(grid'),
  'Observerul Semnalmente, dacă există, trebuie să rămână limitat la results-grid.'
);

console.log('Runtime observer safety: mobile integrat în controllerele de modul, fără observer global pe document.body.');