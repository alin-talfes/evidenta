import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const version = JSON.parse(read('version.json')).version;
const releaseGate = read('RELEASE_GATE.md');
const packageJson = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('manifest.json'));
const indexSource = read('index.html');
const versionSource = read('js/version.js');
const manualRules = read('js/deduction-ui.js');

assert.match(version, /^\d+\.\d+\.\d+$/, 'Versiunea stabilă trebuie să folosească format semantic X.Y.Z');
const coreSection = releaseGate.split('## Blocante 1.0')[1]?.split('##')[0] || '';
const hasCoreBlockers = /^- \[ \]/m.test(coreSection);
if (Number(version.split('.')[0]) >= 1) assert.equal(hasCoreBlockers, false, 'Nu se permite 1.x cu blocante 1.0 deschise');
assert.ok(packageJson.scripts.test.includes('tests/release-gate.mjs'), 'Release gate trebuie să ruleze în CI');

for (const route of ['./', './contopiri/', './ai/', './transfer/']) {
  assert.ok(manifest.shortcuts.some(item => item.url === route), `Manifestul nu expune ruta ${route}`);
}
assert.ok(indexSource.includes('js/regime-reanalysis.js'), 'Motorul art. 53 trebuie încărcat în Pedepse');
assert.ok(versionSource.includes('release-guards.js'), 'Protecțiile juridice de release trebuie încărcate în runtime');

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

const ncpLife = schedule({ life:true, art:'NCP99', sentenceOver10:false, totalDays:7305, birthDate:elder, startDate:start, currentSex:'M', theorExp:null, dedDays:0, nonExecDays:0 });
assert.equal(ncpLife.mDays, 7305, 'NCP art. 99 trebuie să rămână la pragul de 20 ani');
assert.equal(ncpLife.tDays, 7305, 'NCP art. 99 nu preia regula VCP 15 ani');

const vcpYoungLife = schedule({ life:true, art:'VCP551', sentenceOver10:false, totalDays:7305, birthDate:young, startDate:start, currentSex:'M', theorExp:null, dedDays:0, nonExecDays:0 });
assert.equal(vcpYoungLife.mDays, 7305, 'VCP art. 55¹ sub pragul de vârstă trebuie să păstreze 20 ani');
assert.equal(vcpYoungLife.vcpLifeElderlyApplied, false);

const fifteenEnd = ctx.addCalendarSafe(start, 15, 0, 0); fifteenEnd.setDate(fifteenEnd.getDate() - 1);
const fifteenDays = ctx.daysBetween(start, fifteenEnd) + 1;
const vcpElderMale = schedule({ life:true, art:'VCP551', sentenceOver10:false, totalDays:7305, birthDate:new Date(1950,0,1), startDate:start, currentSex:'M', theorExp:null, dedDays:0, nonExecDays:0 });
assert.equal(vcpElderMale.mDays, fifteenDays, 'VCP art. 55¹ bărbat 60+ trebuie să aplice 15 ani');
assert.equal(vcpElderMale.mDate.getTime(), fifteenEnd.getTime());
assert.equal(vcpElderMale.vcpLifeElderlyApplied, true);

const vcpElderFemale = schedule({ life:true, art:'VCP551', sentenceOver10:false, totalDays:7305, birthDate:new Date(1960,0,1), startDate:start, currentSex:'F', theorExp:null, dedDays:0, nonExecDays:0 });
assert.equal(vcpElderFemale.mDays, fifteenDays, 'VCP art. 55¹ femeie 55+ trebuie să aplice 15 ani');
assert.equal(vcpElderFemale.vcpLifeElderlyApplied, true);

const vcpLifeTransition = schedule({ life:true, art:'VCP551', sentenceOver10:false, totalDays:7305, birthDate:new Date(1982,0,1), startDate:start, currentSex:'M', theorExp:null, dedDays:0, nonExecDays:0 });
assert.equal(vcpLifeTransition.mDate.getTime(), new Date(2042,0,1).getTime(), 'Dacă 15 ani sunt împliniți înainte de 60 ani, data nu poate preceda aniversarea de 60 ani');
assert.equal(vcpLifeTransition.ageTransitionApplied, true);

const birthdayCase = schedule({
  life:false, art:'VCP602', sentenceOver10:false, totalDays:3650,
  birthDate:new Date(1970,0,1), startDate:start, currentSex:'M', theorExp:new Date(2035,11,31), dedDays:0, nonExecDays:0
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

const aiRules = read('ai/deduction-rules.js');
assert.ok(manualRules.includes('TYPE_RETENTION_24H'), 'Pedepse trebuie să păstreze regula reținerii');
assert.ok(manualRules.includes('data.dedRows = collectTypedDedRows()'), 'Salvarea manuală trebuie să persiste tipul deducerii');
assert.ok(manualRules.includes('saved.type'), 'Încărcarea speței trebuie să restaureze tipul deducerii');
assert.ok(aiRules.includes('TYPE_RETENTION_24H'), 'AI trebuie să păstreze regula reținerii');
assert.ok(read('js/app.js').includes('EDUCATIONAL_ARTICLES.has(art)'), 'Măsurile educative nu trebuie să primească automat reanalizarea 1/5');
assert.ok(read('js/regime-reanalysis.js').includes('calculateArticle53'), 'Motorul art. 53 trebuie păstrat');
assert.ok(read('transfer/rules.js').includes("consolidatedAt: '30.03.2026'"), 'Baseline-ul profilării transfer trebuie păstrat explicit');

console.log('Release gate 1.0: LC, VCP 55¹ 20/15 ani, praguri de vârstă, art. 53, contopiri, deduceri, persistență și rute verificate.');
