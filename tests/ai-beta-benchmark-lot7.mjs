import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of [
  'js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js',
  'ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js',
  'ai/beta-lot3-metadata.js','ai/beta-lot3-measures.js','ai/beta-lot4-hardening.js','ai/beta-lot5-hardening.js','ai/contopire-audit.js',
  'ai/beta-lot7-start-date.js','ai/beta-lot7-duration.js'
]) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;
const json=value=>JSON.parse(JSON.stringify(value));

// Benchmark derivat din fotografii reale de lucru, complet anonimizat/pseudonimizat.
// Nu se stochează imaginile, nume, CNP, CI, adrese ori numerele reale ale cauzelor.
const contest=`[mandat-concurs-anonimizat.jpg — imagine — OCR 93%]
MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 900/2026 emis în ziua 15 septembrie 2026.
Persoana născută la data de 20.02.1967.
Condamnă inculpatul la 1 an închisoare pentru fapta A.
Condamnă inculpatul la pedeapsa de 3 luni pentru fapta B.
Condamnă inculpatul la pedeapsa de 2 ani pentru fapta C.
În baza art. 39 Cod penal, instanța stabilește pedeapsa cea mai grea, respectiv cea de 2 ani închisoare, la care va adăuga un spor de o treime din suma celorlalte pedepse (1 an plus 3 luni), stabilește pedeapsa rezultantă de doi ani și 5 luni închisoare în regim de executare.`;
const a=analyze(contest);
assert.deepEqual(json(a.finalSentence),{years:2,months:5,days:0});
assert.equal(a.primaryDocumentType,'MEPI/mandat');
assert.equal(a.startDate,'15.09.2026','Fără deducere deschisă „... la zi”, începutul este data mandatului.');
assert.equal(a.startDateBasis,'mandate_date');
assert.ok(a.penalties.some(p=>p.years===2&&p.months===0&&p.group==='concurs'));
assert.ok(a.penalties.some(p=>p.years===1&&p.months===0&&p.group==='concurs'));
assert.ok(a.penalties.some(p=>p.years===0&&p.months===3&&p.group==='concurs'));

const simpleDeduction=`[mandat-deducere-anonimizat.jpg — imagine — OCR 91%]
MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 901/2026 din 15.09.2026.
Persoana născută la data de 19.12.1988.
Condamnă inculpatul la pedeapsa de 2 (doi) ani și 6 (șase) luni închisoare.
În temeiul art. 72 alin. 1 Cod penal, deduce din pedeapsa principală aplicată perioada în care inculpatul s-a aflat sub imperiul măsurilor preventive privative de libertate, respectiv durata reținerii și arestării preventive de la 13.03.2025-19.06.2025.`;
const b=analyze(simpleDeduction);
assert.deepEqual(json(b.finalSentence),{years:2,months:6,days:0});
assert.equal(b.primaryDocumentType,'MEPI/mandat');
assert.equal(b.startDate,'15.09.2026','O deducere închisă nu schimbă data începerii; se folosește data mandatului.');
assert.equal(b.startDateBasis,'mandate_date');
assert.ok(b.deductions.some(d=>d.start==='13.03.2025'&&d.end==='19.06.2025'));

const mixed=`[mandat-deduceri-mixte-anonimizat.jpg — imagine — OCR 90%]
MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 902/2026 din 15.09.2026.
Persoana născută la data de 01.01.1990.
Execută pedeapsa principală rezultantă de 2 ani și 8 luni închisoare.
În temeiul art. 72 alin. 1 Cod penal se deduce perioada reținerii (1 zi) din data de 29.07.2025, a arestului preventiv din data de 30.07.2025 până în data de 13.01.2026 și a arestului la domiciliu din data de 14.01.2026 la zi.`;
const c=analyze(mixed);
assert.deepEqual(json(c.finalSentence),{years:2,months:8,days:0});
assert.equal(c.primaryDocumentType,'MEPI/mandat');
assert.equal(c.startDate,'14.01.2026','Formula de deducere care ajunge „la zi” prevalează asupra datei mandatului.');
assert.equal(c.startDateBasis,'deduction_to_date');
assert.ok(c.deductions.some(d=>d.start==='29.07.2025'));
assert.ok(c.deductions.some(d=>d.start==='30.07.2025'&&d.end==='13.01.2026'));
assert.ok(c.deductions.some(d=>d.start==='14.01.2026'));
assert.equal(c.numericReviewRequired,true,'Perioadele mixte/„la zi” trebuie să rămână sub confirmare umană.');


const contestSixMonthsOneYear=`[mandat-concurs-retinere-24h-anonimizat.jpg — imagine — OCR 92%]
MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 903/2026 din 16.09.2026.
Persoana născută la data de 01.01.1990.
Condamnă inculpatul la pedeapsa de 6 luni închisoare pentru fapta A.
Condamnă inculpatul la pedeapsa de 1 an închisoare pentru fapta B.
Constată că faptele au fost săvârșite în concurs real.
Aplică pedeapsa cea mai grea de 1 an închisoare, la care adaugă o treime din cealaltă pedeapsă de 6 luni, pedeapsa rezultantă fiind de 1 an și 2 luni închisoare.
Deduce perioada reținerii inculpatului în perioada 22.06.2023 orele 21:00 - 23.06.2023 orele 21:00.`;
const d=analyze(contestSixMonthsOneYear);
assert.deepEqual(json(d.finalSentence),{years:1,months:2,days:0},'1 an + 1/3 din 6 luni = 1 an și 2 luni.');
assert.equal(d.primaryDocumentType,'MEPI/mandat');
assert.equal(d.startDate,'16.09.2026','Reținerea închisă de 24 h nu schimbă data începerii executării din mandat.');
assert.equal(d.startDateBasis,'mandate_date');
assert.ok(d.penalties.some(p=>p.years===1&&p.months===0&&p.group==='concurs'),'Trebuie extrasă pedeapsa componentă de 1 an.');
assert.ok(d.penalties.some(p=>p.years===0&&p.months===6&&p.group==='concurs'),'Trebuie extrasă pedeapsa componentă de 6 luni.');
assert.ok(d.deductions.some(x=>x.start==='22.06.2023'&&x.end==='23.06.2023'),'Reținerea de 24 h trebuie extrasă ca interval 22.06.2023–23.06.2023.');


console.log('AI BETA benchmark lot 7: start-date precedence, durate scrise în litere și mandate real-world anonimizate.');
