import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const version = JSON.parse(read('version.json')).version;
const releaseGate = read('RELEASE_GATE.md');
const packageJson = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('manifest.json'));

assert.match(version, /^\d+\.\d+(?:\.\d+)?$/, 'Versiunea trebuie să fie semantică');
const hasOpenBlockers = /^- \[ \]/m.test(releaseGate);
if (hasOpenBlockers) assert.equal(Number(version.split('.')[0]), 0, 'Nu se permite 1.x cât timp RELEASE_GATE.md conține blocante deschise');
assert.ok(packageJson.scripts.test.includes('tests/release-gate.mjs'), 'Release gate trebuie să ruleze în CI');

for (const route of ['./', './contopiri/', './ai/', './transfer/']) {
  assert.ok(manifest.shortcuts.some(item => item.url === route), `Manifestul nu expune ruta ${route}`);
}

const ctx = { console, Date, Math, Number, String, Array, Object, Set, JSON, globalThis:null };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(read('js/utils.js'), ctx, { filename:'js/utils.js' });
vm.runInContext(read('js/rules.js'), ctx, { filename:'js/rules.js' });
vm.runInContext(read('js/release-guards.js'), ctx, { filename:'js/release-guards.js' });

const schedule = ctx.calculateLiberationSchedule;
const start = new Date(2026,0,1);
const young = new Date(1990,0,1);
const elder = new Date(1950,0,1);

const matrixCases = [
  ['NCP100', false, 3650, young, false, 1/2, 2/3],
  ['NCP100', false, 5000, young, true, 2/3, 3/4],
  ['NCP100', false, 3650, elder, false, 1/3, 1/2],
  ['NCP100', false, 5000, elder, true, 1/2, 2/3],
  ['NCP124', false, 1000, young, false, 1/2, 1/2],
  ['NCP125', false, 1000, young, false, 1/2, 1/2],
  ['VCP59', false, 1000, young, false, 1/2, 2/3],
  ['VCP59', false, 5000, young, true, 2/3, 3/4],
  ['VCP591', false, 1000, young, false, 1/3, 1/2],
  ['VCP591', false, 5000, young, true, 1/2, 2/3],
  ['VCP602', false, 1000, elder, false, 1/100, 1/3],
  ['VCP602', false, 5000, elder, true, 1/100, 1/2],
  ['VCP603', false, 1000, elder, false, 1/100, 1/4],
  ['VCP603', false, 5000, elder, true, 1/100, 1/3],
  ['PRE14059', false, 1000, young, false, 1/3, 1/2],
  ['PRE14059', false, 5000, young, true, 1/2, 2/3],
  ['PRE14060', false, 1000, young, false, 1/2, 2/3],
  ['PRE14060', false, 5000, young, true, 2/3, 3/4],
  ['PRE140604', false, 1000, elder, false, 1/100, 1/4],
  ['PRE140604', false, 5000, elder, true, 1/100, 1/3]
];

for (const [art, life, totalDays, birthDate, over10, mR, tR] of matrixCases) {
  const theorExp = new Date(over10 ? 2042 : 2035, 0, 1);
  const result = schedule({ life, art, sentenceOver10:over10, totalDays, birthDate, startDate:start, currentSex:'M', theorExp, dedDays:0, nonExecDays:0 });
  assert.ok(!result.error, `${art}: ${result.error || 'eroare necunoscută'}`);
  assert.equal(result.mR, mR, `${art}: fracția obligatorie`);
  assert.equal(result.tR, tR, `${art}: fracția totală`);
}

for (const art of ['NCP99','VCP551']) {
  const result = schedule({ life:true, art, sentenceOver10:false, totalDays:7305, birthDate:young, startDate:start, currentSex:'M', theorExp:null, dedDays:0, nonExecDays:0 });
  assert.equal(result.mDays, 7305, `${art}: pragul operațional curent`);
  assert.equal(result.tDays, 7305, `${art}: pragul operațional curent`);
}

const birthdayCase = schedule({
  life:false,
  art:'VCP602',
  sentenceOver10:false,
  totalDays:3650,
  birthDate:new Date(1970,0,1),
  startDate:start,
  currentSex:'M',
  theorExp:new Date(2035,11,31),
  dedDays:0,
  nonExecDays:0
});
assert.equal(birthdayCase.mDate.getTime(), new Date(2030,0,1).getTime(), 'VCP60/2 nu poate produce efecte înainte de 60 ani');
assert.equal(birthdayCase.tDate.getTime(), new Date(2030,0,1).getTime(), 'VCP60/2 totală nu poate produce efecte înainte de 60 ani');
assert.ok(birthdayCase.ageTransitionApplied, 'Protecția pragului de vârstă trebuie marcată');

const contCtx = { console, Math, Number, String, Array, Object, globalThis:null };
contCtx.globalThis = contCtx;
vm.createContext(contCtx);
vm.runInContext(read('js/contopiri-core.js'), contCtx, { filename:'js/contopiri-core.js' });
const C = contCtx.ContopiriCore;
const penalties = [[3,0,0],[2,0,0],[1,6,0]].map(([years,months,days]) => ({ years, months, days, totalDays:C.toDays(years,months,days) }));
const contest = C.calculate({ concurs:penalties, recidiva:[], revocare:[], litb:[] });
assert.deepEqual(JSON.parse(JSON.stringify(contest.finalDuration)), { years:4, months:2, days:0 }, 'Concurs 3a + 2a + 1a6l trebuie să dea 4a2l');

const manualRules = read('js/deduction-ui.js');
const aiRules = read('ai/deduction-rules.js');
assert.ok(manualRules.includes("TYPE_RETENTION_24H"), 'Pedepse trebuie să păstreze regula reținerii');
assert.ok(aiRules.includes("TYPE_RETENTION_24H"), 'AI trebuie să păstreze regula reținerii');
assert.ok(read('js/storage.js').includes('dedRows'), 'Persistența trebuie să păstreze tipurile deducerilor');
assert.ok(read('js/app.js').includes('EDUCATIONAL_ARTICLES.has(art)'), 'Măsurile educative nu trebuie să primească automat reanalizarea 1/5');
assert.ok(read('transfer/rules.js').includes("consolidatedAt: '30.03.2026'"), 'Baseline-ul profilării transfer trebuie păstrat explicit');

console.log('Release gate 1.0: matrice LC, praguri de vârstă, contopiri, deduceri, persistență și rute verificate.');
