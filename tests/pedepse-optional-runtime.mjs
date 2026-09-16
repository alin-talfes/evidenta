import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const fix = read('js/pedepse-optional-fix-v2.js');
const corrections = read('js/operational-corrections-v4.js');
const version = read('js/version.js');

for (const marker of [
  "const OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading'];",
  'removePreventiveFromOptionalTools',
  'unwrapOptionalCards',
  'stopImmediatePropagation',
  'card.hidden = !open',
  'evOptionalFixV2Bound',
  'initDeterministically',
  'evidenta:shellready'
]) {
  assert.ok(fix.includes(marker), `Controllerul v2 al opțiunilor suplimentare trebuie să includă ${marker}`);
}

assert.ok(!fix.includes('new MutationObserver'), 'Controllerul v2 nu trebuie să folosească observer global pentru opțiunile Pedepse.');
assert.ok(!fix.includes("OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading', 'masuri-preventive-heading']"), 'Măsurile preventive nu trebuie tratate ca opțiune suplimentară.');

assert.ok(corrections.includes('pedepse-optional-fix-v2.js?v=1'), 'Punctul unic de compatibilitate trebuie să încarce optional-fix-v2.');
assert.ok(corrections.includes('data-evidenta-pedepse-optional-fix-v2'), 'Încărcarea controllerului v2 trebuie deduplicată.');
assert.ok(!version.includes('pedepse-optional-fix.js?v=1'), 'Loaderul global nu trebuie să mai încarce controllerul legacy.');

console.log('Pedepse optional runtime: optional-fix-v2 este controllerul unic; fără observer global și fără măsuri preventive în opțiunile suplimentare.');
