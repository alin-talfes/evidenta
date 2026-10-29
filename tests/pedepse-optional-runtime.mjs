import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const optional = read('js/pedepse-optional.js');
const ux = read('js/ux-upgrades.js');
const operational = read('js/operational-pedepse.js');
const version = read('js/version.js');
const page = read('index.html');

for (const marker of [
  "{ cardId: 'recursCard', headingId: 'recurs-heading' }",
  "{ cardId: 'nonExecCard', headingId: 'nonExec-heading' }",
  "{ cardId: 'restCard', headingId: 'rest-heading' }",
  'cardHasMeaningfulValue',
  'syncFromValues',
  'revealInvalid',
  'evOptionalOverride',
  'window.EvidentaPedepseOptional = Object.freeze'
]) {
  assert.ok(optional.includes(marker), `Controllerul unic al opțiunilor trebuie să includă ${marker}`);
}

for (const forbidden of ['setTimeout', 'new MutationObserver', 'stopImmediatePropagation', 'evidenta:shellready']) {
  assert.ok(!optional.includes(forbidden), `Controllerul opțiunilor nu trebuie să conțină ${forbidden}`);
}

for (const marker of [
  'class="ev-optional-tools card"',
  'id="recursCard"',
  'id="nonExecCard"',
  'id="restCard"',
  'aria-controls="recursCard"',
  'aria-controls="nonExecCard"',
  'aria-controls="restCard"',
  'js/pedepse-optional.js?v=2'
]) {
  assert.ok(page.includes(marker), `Markup-ul declarativ al opțiunilor trebuie să includă ${marker}`);
}
assert.ok(!page.includes('aria-controls="masuri-preventive'), 'Măsurile preventive nu trebuie să fie tratate ca situație suplimentară.');
assert.equal((page.match(/pedepse-optional\\.js\\?v=2/g) || []).length, 1, 'Controllerul unic trebuie declarat o singură dată.');

assert.ok(!ux.includes('initPedepseDisclosure'), 'ux-upgrades nu trebuie să mai dețină logica Situațiilor suplimentare.');
assert.ok(!ux.includes('Situații suplimentare'), 'ux-upgrades nu trebuie să mai construiască markup Pedepse.');
assert.ok(!operational.includes('ev-mobile-advanced-details'), 'Operational Pedepse nu trebuie să mai construiască wrapper-ul mobil redundant.');
assert.ok(!operational.includes('Opțiuni avansate'), 'Operational Pedepse nu trebuie să mai dubleze Situațiile suplimentare.');
assert.ok(operational.includes('EvidentaPedepseOptional?.revealInvalid?.()'), 'Erorile din opțiuni trebuie revelate prin API-ul controllerului unic.');

assert.ok(!fs.existsSync(path.join(root, 'js/pedepse-optional-fix-v2.js')), 'Controllerul de compatibilitate optional-fix-v2 trebuie eliminat.');
assert.ok(!page.includes('pedepse-optional-fix-v2.js'), 'Pagina Pedepse nu trebuie să mai refere controllerul eliminat.');
assert.ok(!version.includes('pedepse-optional'), 'version.js trebuie să rămână identity-only.');
assert.ok(!version.includes('ensurePedepseOperationalControllers'), 'version.js trebuie să rămână fără loader dinamic.');

assert.ok(page.includes('<details class="ev-mobile-lc-details" data-ev-optional="true">'), 'Datele LC trebuie să fie colapsabile.');
assert.ok(page.includes('id="timelineDetails"') && page.includes('data-ev-optional="true"'), 'Cronologia trebuie colapsată și interactivă.');
assert.ok(page.includes('id="stepsDetails"') && page.includes('data-ev-optional="true"'), 'Pașii calculului trebuie colapsați și interactivi.');
assert.ok(page.includes('id="recursCard" hidden'), 'Recursul compensatoriu trebuie colapsat implicit.');
assert.ok(page.includes('id="nonExecCard" hidden'), 'Perioadele neexecutate trebuie colapsate implicit.');
assert.ok(page.includes('id="restCard" hidden'), 'Restul rămas trebuie colapsat implicit.');
assert.ok(!page.includes('id="toggleStepsBtn"'), 'Butonul vechi pentru pași trebuie eliminat.');
console.log('Pedepse optional runtime: progressive disclosure and optional cards collapsed by default.');
