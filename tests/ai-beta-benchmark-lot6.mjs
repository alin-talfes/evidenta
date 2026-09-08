import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of [
  'js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js',
  'ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js',
  'ai/beta-lot3-metadata.js','ai/beta-lot3-measures.js','ai/beta-lot4-hardening.js','ai/beta-lot5-hardening.js','ai/contopire-audit.js'
]) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;
const json=value=>JSON.parse(JSON.stringify(value));

// Benchmark pereche document–aplicație, complet sintetic. Nu conține și nu reproduce
// nume, CNP, adresă, numere de dosar/mandat ori date calendaristice din sursele reale.
const source=`[benchmark-pereche-sintetic.jpg — imagine — OCR 92%]
PENITENCIARUL EXEMPLU Intrare Nr. 8000 / 15.02.2026.
MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 700/2026 din 15.02.2026.
Văzând sentința penală nr. 100 din 10.01.2026, rămasă definitivă la data de 15.02.2026 prin decizia penală nr. 200/2026.
Persoana născută la data de 01.01.1990.
Condamnă inculpatul la pedeapsa de 1 an închisoare pentru fapta A.
Condamnă inculpatul la pedeapsa de 1 an și 3 luni închisoare pentru fapta B.
În baza art. 38 alin. 2 raportat la art. 39 alin. 1 lit. b) Cod penal, contopește pedepsele stabilite, aplică pedeapsa cea mai grea de 1 an și 3 luni închisoare, la care adaugă sporul de o treime din cealaltă pedeapsă, inculpatul urmând să execute pedeapsa rezultantă de 1 an și 7 luni închisoare.
Urmând ca acesta să execute 1 an și 7 luni închisoare.
Din pedeapsa de executat se va deduce timpul reținerii și arestării preventive de la --- până la ---.
Condamnatul este recidivist.`;

// Etalonul sintetic reproduce exclusiv relațiile relevante observate în aplicație.
const expectedApplicationRecord={
  finalSentence:{years:1,months:7,days:0},
  components:[
    {years:1,months:0,days:0,group:'concurs'},
    {years:1,months:3,days:0,group:'concurs'}
  ],
  receivedDate:'15.02.2026',
  startDate:'',
  deductions:[],
  blankDeductionClause:true,
  legalAlgorithm:''
};

const result=analyze(source);
assert.deepEqual(json(result.finalSentence),expectedApplicationRecord.finalSentence);
assert.deepEqual(json(result.penalties.map(({years,months,days,group})=>({years,months,days,group}))),expectedApplicationRecord.components);
assert.equal(result.receivedDate,expectedApplicationRecord.receivedDate);
assert.equal(result.startDate,expectedApplicationRecord.startDate,'Data mandatului/primirii nu dovedește singură începerea executării.');
assert.deepEqual(json(result.deductions),expectedApplicationRecord.deductions);
assert.equal(result.blankDeductionClause,expectedApplicationRecord.blankDeductionClause);
assert.equal(result.article,expectedApplicationRecord.legalAlgorithm,'Articolele infracțiunii nu se confundă cu algoritmul LC/NCP al contopirii.');
assert.ok(result.warnings.some(w=>w.includes('Data începerii executării')));
assert.ok(result.warnings.some(w=>w.includes('configurația LC')));
assert.ok(result.warnings.some(w=>w.startsWith('DEDUCERI: rubrica')));
assert.deepEqual(json(result.contopireAudits[0].expectedFinal),expectedApplicationRecord.finalSentence);
assert.deepEqual(json(result.contopireAudits[0].mismatches),[]);
assert.equal(Boolean(result.arithmeticConflict),false);

console.log('AI ALPHA benchmark lot 6: pereche sintetică document–aplicație, contopire 1/3, recidivist, rubrică goală și separarea sigură a datei de început.');
