import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const fix = read('js/pedepse-optional-fix-v2.js');
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

assert.ok(version.includes('pedepse-optional-fix-v2.js?v=1'), 'Loaderul trebuie să încarce optional-fix-v2 pe ruta Pedepse.');
assert.ok(version.includes('data-evidenta-pedepse-optional-fix-v2'), 'Încărcarea controllerului v2 trebuie deduplicată.');
assert.ok(version.includes('ensurePedepseOperationalControllers'), 'Controllerele specifice Pedepse trebuie grupate separat în version.js.');
assert.ok(version.includes('if (isPedepsePage(p)) ensurePedepseOperationalControllers();'), 'Controllerele specifice Pedepse trebuie încărcate numai pe ruta Pedepse.');
assert.ok(!version.includes('operational-corrections-v4'), 'Loaderul global nu trebuie să depindă de controllerul intermediar eliminat.');
assert.ok(!version.includes('pedepse-optional-fix.js?v=1'), 'Loaderul global nu trebuie să mai încarce controllerul legacy.');
assert.ok(!fs.existsSync(path.join(root, 'js/operational-corrections-v4.js')), 'Controllerul intermediar operational-corrections-v4 trebuie să rămână eliminat.');

console.log('Pedepse optional runtime: optional-fix-v2 este route-scoped; fără corrections loader, observer global sau măsuri preventive în opțiunile suplimentare.');