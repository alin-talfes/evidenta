import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/contopiri-core.js', 'utf8');
const ctx = { console, Math, Number, String, Array, Object, globalThis: null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(source, ctx, { filename: 'js/contopiri-core.js' });

const C = ctx.ContopiriCore;

const base = { totalDays: 720, years: 2, months: 0, days: 0 };
const measure = { totalDays: 360, years: 1, months: 0, days: 0 };
const calculation = C.calculate({ concurs: [base], litb: [measure], recidiva: [], revocare: [] });
assert.equal(calculation.litbTotalDays, 360, 'Durata măsurii educative trebuie păstrată integral pentru control');
assert.equal(calculation.litbQuarterDays, 90, 'Sporul minim trebuie să fie 1/4 din durata măsurii');
assert.equal(calculation.finalDays, 810, 'Rezultatul trebuie să fie pedeapsa de bază + sporul minim de 1/4');
assert.deepEqual(JSON.parse(JSON.stringify(calculation.finalDuration)), { years: 2, months: 3, days: 0 });

const fractionalQuarter = C.calculate({
  concurs: [{ totalDays: 360, years: 1, months: 0, days: 0 }],
  litb: [{ totalDays: 30, years: 0, months: 1, days: 0 }],
  recidiva: [],
  revocare: []
});
assert.equal(fractionalQuarter.litbQuarterDays, 8, 'Fracțiunea de zi trebuie rotunjită în sus pentru a nu coborî sub minimul de 1/4');

assert.throws(
  () => C.calculate({ concurs: [], litb: [measure], recidiva: [], revocare: [] }),
  /necesită o pedeapsă de bază/,
  'Art. 129 alin. (2) lit. b) nu trebuie calculat ca pedeapsă autonomă'
);

const ui = fs.readFileSync('js/contopiri.js', 'utf8');
assert.ok(ui.includes('Art. 129 alin. (2) lit. b) — spor minim 1/4'), 'Selectorul trebuie să afișeze noua categorie');
assert.ok(ui.includes("type === 'litb'"), 'Interfața trebuie să trimită categoria lit. b) către motor');
assert.ok(ui.includes('cel puțin o pătrime'), 'Interfața trebuie să explice că 1/4 este minimul legal');
assert.ok(ui.includes('plafonul raportat la art. 39 alin. (1) lit. b)'), 'Rezultatul trebuie să avertizeze asupra plafonului legal');

console.log('Contopiri: art. 129 alin. (2) lit. b) — spor minim 1/4 verificat.');
