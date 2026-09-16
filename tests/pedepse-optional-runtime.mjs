import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const fix = read('js/pedepse-optional-fix.js');
const version = read('js/version.js');

for (const marker of [
  "['recurs-heading', 'nonExec-heading', 'rest-heading']",
  'removePreventiveFromOptionalTools',
  'unwrapOptionalCards',
  'stopImmediatePropagation',
  "card.hidden = !open",
  'observer?.disconnect()',
  '5000'
]) {
  assert.ok(fix.includes(marker), `Fixul opțiunilor suplimentare trebuie să includă ${marker}`);
}

assert.ok(!fix.includes("OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading', 'masuri-preventive-heading']"), 'Măsurile preventive nu trebuie tratate ca opțiune suplimentară.');
assert.ok(version.includes('pedepse-optional-fix.js?v=1'), 'Loaderul global trebuie să încarce fixul pentru opțiunile Pedepse.');
assert.ok(version.includes('data-evidenta-pedepse-optional-fix'), 'Loaderul trebuie să prevină încărcarea dublă a fixului Pedepse.');

console.log('Pedepse optional runtime: opțiunile suplimentare se deschid direct, fără a rămâne captive într-un details închis; măsurile preventive rămân separate.');
