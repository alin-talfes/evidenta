import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const fix = read('js/pedepse-optional-fix-v2.js');
const version = read('js/version.js');
const page = read('index.html');

for (const marker of [
  "const OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading'];",
  'removePreventiveFromOptionalTools',
  'unwrapOptionalCards',
  'preventiveCard.hidden = false',
  "document.addEventListener('DOMContentLoaded', repair, { once: true })"
]) {
  assert.ok(fix.includes(marker), `Controllerul opțiunilor suplimentare trebuie să includă ${marker}`);
}

for (const forbidden of [
  'new MutationObserver',
  'setTimeout',
  'stopImmediatePropagation',
  'bindOptionalTools',
  'evOptionalFixV2Bound',
  "window.addEventListener('load'",
  'evidenta:shellready'
]) {
  assert.ok(!fix.includes(forbidden), `Controllerul opțiunilor suplimentare nu trebuie să mai conțină ${forbidden}`);
}
assert.ok(!fix.includes("OPTIONAL_IDS = ['recurs-heading', 'nonExec-heading', 'rest-heading', 'masuri-preventive-heading']"), 'Măsurile preventive nu trebuie tratate ca opțiune suplimentară.');

assert.ok(page.includes('js/pedepse-optional-fix-v2.js?v=1'), 'Pagina Pedepse trebuie să declare optional-fix-v2 direct.');
assert.equal((page.match(/pedepse-optional-fix-v2\.js\?v=1/g) || []).length, 1, 'Controllerul optional-fix-v2 trebuie declarat o singură dată.');
assert.ok(!version.includes('pedepse-optional-fix-v2.js'), 'version.js nu trebuie să mai încarce controllerul optional dinamic.');
assert.ok(!version.includes('ensurePedepseOperationalControllers'), 'version.js trebuie să rămână identity-only.');
assert.ok(!version.includes('operational-corrections-v4'), 'Runtime-ul nu trebuie să depindă de controllerul intermediar eliminat.');
assert.ok(!page.includes('pedepse-optional-fix.js?v=1'), 'Pagina nu trebuie să mai încarce controllerul legacy.');
assert.ok(!fs.existsSync(path.join(root, 'js/operational-corrections-v4.js')), 'Controllerul intermediar operational-corrections-v4 trebuie să rămână eliminat.');

console.log('Pedepse optional runtime: optional-fix-v2 este structural și determinist, fără listener duplicat, timer, observer global sau blocarea propagării.');
