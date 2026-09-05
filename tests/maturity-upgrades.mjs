import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const finalLayer = read('css/final-layer.css');
const pedepse = read('js/pedepse-ux.js');
const officer = read('ofiter/dashboard-cockpit.js');
const version = read('js/version.js');

for (const wrapper of ['css/style.css', 'instructaj/styles.css', 'semnalmente/style.css', 'ofiter/styles.css']) {
  const source = read(wrapper);
  assert.ok(source.includes('final-layer.css?v=1'), `${wrapper} trebuie să încarce stratul final consolidat`);
  assert.ok(!/@import\s+url\([^)]*consistency\.css/i.test(source), `${wrapper} nu trebuie să mai încarce consistency.css activ`);
  assert.ok(!/@import\s+url\([^)]*hotfix\.css/i.test(source), `${wrapper} nu trebuie să mai încarce hotfix.css activ`);
  assert.ok(!/@import\s+url\([^)]*ux-upgrades\.css/i.test(source), `${wrapper} nu trebuie să mai încarce ux-upgrades.css activ`);
}

assert.ok(!finalLayer.includes('visibility: hidden'), 'Stratul activ nu trebuie să ascundă body pentru a masca FOUC');
assert.ok(!finalLayer.includes('ev-fail-open'), 'Workaround-ul FOUC cu fail-open nu trebuie să existe în stratul activ');

for (const marker of [
  '.ev-validation-summary',
  '.ev-result-overview',
  '.ev-result-milestones',
  '.learning-cockpit',
  '.learning-cockpit__metrics',
  '.ev-officer-mobile-nav'
]) {
  assert.ok(finalLayer.includes(marker), `Stratul consolidat trebuie să conțină ${marker}`);
}

for (const marker of [
  'validateBeforeCalculation',
  'renderValidationSummary',
  'enhanceCalculationResult',
  'Rezultat operațional',
  'confruntat cu mandatul'
]) {
  assert.ok(pedepse.includes(marker), `Controllerul Pedepse trebuie să conțină ${marker}`);
}
assert.ok(pedepse.includes('const result = original.apply'), 'Motorul de calcul existent trebuie apelat, nu duplicat');

for (const marker of [
  'evidenta-training',
  'weakestTopic',
  'recommendedAction',
  'evidenta-training-last-exam',
  'learning-cockpit',
  'Repetări scadente',
  'Ultima simulare'
]) {
  assert.ok(officer.includes(marker), `Cockpit-ul Ofițer trebuie să conțină ${marker}`);
}

assert.ok(version.includes('pedepse-ux.js?v=1'), 'Version controller trebuie să încarce UX-ul Pedepse');
assert.ok(version.includes('dashboard-cockpit.js?v=1'), 'Version controller trebuie să încarce cockpit-ul Ofițer');

console.log('Maturity UX: CSS consolidat fără FOUC, rezultat Pedepse și cockpit Ofițer verificate.');
