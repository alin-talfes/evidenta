import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const upgrades = read('js/operational-upgrades.js');
const finalize = read('js/operational-finalize.js');
const mobile = read('js/mobile-operational-v2.js');
const semnalmente = read('semnalmente/enhancements.js');

const broadBodyChildObserver = /\.observe\(document\.body\s*,\s*\{[^}]*childList\s*:\s*true[^}]*subtree\s*:\s*true/i;

assert.ok(!broadBodyChildObserver.test(upgrades), 'Operational upgrades nu trebuie să observe permanent întreg document.body pentru childList/subtree.');
assert.ok(!broadBodyChildObserver.test(finalize), 'Operational finalizer nu trebuie să observe permanent întreg document.body pentru childList/subtree.');
assert.ok(!broadBodyChildObserver.test(mobile), 'Controllerul mobil nu trebuie să observe childList/subtree pe întreg document.body.');
assert.ok(!finalize.includes('new MutationObserver'), 'Finalizerul trebuie să folosească refresh-uri determinate de evenimente, nu MutationObserver global.');

assert.ok(
  semnalmente.includes("if (!paragraph || paragraph.textContent === next) return;"),
  'Normalizarea mesajului de fiabilitate trebuie să fie idempotentă înainte de a modifica textContent.'
);
assert.ok(
  semnalmente.includes('new MutationObserver(normalizeReliabilityNotice).observe(grid'),
  'Observerul Semnalmente, dacă există, trebuie să rămână limitat la results-grid.'
);

console.log('Runtime observer safety: fără observatori globali childList/subtree și fără self-trigger în Semnalmente.');
