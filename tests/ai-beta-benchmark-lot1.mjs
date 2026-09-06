import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(read('js/contopiri-core.js'),ctx,{filename:'js/contopiri-core.js'});
vm.runInContext(read('ai/core.js'),ctx,{filename:'ai/core.js'});
vm.runInContext(read('ai/safety.js'),ctx,{filename:'ai/safety.js'});
vm.runInContext(read('ai/real-doc-hardening.js'),ctx,{filename:'ai/real-doc-hardening.js'});
vm.runInContext(read('ai/real-doc-deductions.js'),ctx,{filename:'ai/real-doc-deductions.js'});

const analyze=ctx.AIDocumentSafety.analyze;

const mepi=`[mepi.pdf — pagina 1 — OCR 88%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.103/A/2023 din 06.05.2026\nPersoana, născut la data de 13.05.1985, a fost condamnată. EXECUTĂ pedeapsa principală de 6 (șase) ani închisoare.\n[mepi.pdf — pagina 2 — OCR 93%]\nA fost condamnat inculpatul la pedeapsa închisorii de 4 ani închisoare. S-a constatat starea de recidivă postcondamnatorie față de pedeapsa de 2 ani închisoare. În temeiul legii a fost revocată suspendarea sub supraveghere a pedepsei de 2 ani închisoare și s-a dispus executarea acestei pedepse alături de pedeapsa aplicată prin prezenta hotărâre, inculpatul urmând să execute pedeapsa de 6 ani închisoare.`;
const a1=analyze(mepi);
assert.equal(a1.birthDate,'13.05.1985');
assert.deepEqual(JSON.parse(JSON.stringify(a1.finalSentence)),{years:6,months:0,days:0});
assert.equal(a1.startDate,'','MEPI fără dată explicită de începere nu trebuie să inventeze startDate');
assert.equal(a1.penalties.length,2,'Alăturarea 4 ani + revocare 2 ani trebuie extrasă numai dacă se verifică la 6 ani');
assert.deepEqual(JSON.parse(JSON.stringify(a1.penalties.map(x=>x.group))),['recidiva','revocare']);

const formulaOthers=['9 luni','9 luni','1 an și 6 luni',...Array(8).fill('3 ani')].join(' + ');
const complex=`[complex.pdf — pagina 1 — OCR 91%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.788/2022 din 30 iunie 2022. Persoana, născut în data de 17.09.1988. Anterior fusese aplicată pedeapsa principală rezultantă de 11 ani și 6 luni închisoare.\n[complex.pdf — pagina 3 — OCR 94%]\nÎn baza art. 39 alin. 1 lit. b Cod penal, aplică pedeapsa principală cea mai grea, de 3 ani închisoare, la care se adaugă sporul fix și obligatoriu de o treime din totalul celorlalte pedepse principale (${formulaOthers}), respectiv 9 ani închisoare, în final inculpatul executând pedeapsa principală rezultantă de 12 ani închisoare.\nDeduce durata reținerii din prezenta cauză din 25.03.2020 ora 09:30 — 26.03.2020 ora 09:30 (o zi), precum și durata reținerii, arestării preventive și la domiciliu și perioada deja executată în legătură cu altă cauză, respectiv 23.11.2017, 24.11.2017-15.06.2018, 30.03.2020 la zi.\nÎn final, pedeapsa de executat fiind de: 12 ani închisoare.`;
const a2=analyze(complex);
assert.equal(a2.birthDate,'17.09.1988','Trebuie acceptată formula „născut în data de”');
assert.deepEqual(JSON.parse(JSON.stringify(a2.finalSentence)),{years:12,months:0,days:0},'Formula finală explicită trebuie să prevaleze față de o rezultantă istorică');
assert.equal(a2.documentDate,'30.06.2022');
assert.equal(a2.penalties.length,12,'Formula art. 39 trebuie să reconstruiască pedeapsa cea mai grea + 11 pedepse celelalte');
assert.ok(a2.penalties.every(x=>x.group==='concurs'));
assert.equal(a2.deductions.length,4,'Trebuie păstrate toate cele patru deduceri distincte din formula complexă');
assert.deepEqual(JSON.parse(JSON.stringify(a2.deductions.map(x=>[x.start,x.end,x.type]))),[
  ['25.03.2020','26.03.2020','retention24h'],
  ['23.11.2017','23.11.2017','retention24h'],
  ['24.11.2017','15.06.2018','generic'],
  ['30.03.2020','30.06.2022','generic']
]);
assert.ok(a2.deductions.every(x=>x.reviewRequired),'Deducerile interpretate din formule mixte trebuie confirmate explicit');

const preventive=`[preventiv.pdf — pagina 1 — OCR 91%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.31/2026 din 28.05.2026. Persoana, născut la data de 20.01.1977, a fost condamnată la pedeapsa de 1 an și 6 luni închisoare. În baza art.72 s-a dedus perioada în care a fost reținut și arestat preventiv în prezenta cauză, anume de la data de 12.09.2025 la data de 13.09.2025 și de la data de 22.10.2025 la zi. În final, pedeapsa de executat este de 1 an și 6 luni închisoare.`;
const a3=analyze(preventive);
assert.equal(a3.birthDate,'20.01.1977');
assert.deepEqual(JSON.parse(JSON.stringify(a3.finalSentence)),{years:1,months:6,days:0});
assert.equal(a3.documentDate,'28.05.2026');
assert.deepEqual(JSON.parse(JSON.stringify(a3.deductions.map(x=>[x.start,x.end,x.type]))),[
  ['12.09.2025','12.09.2025','retention24h'],
  ['22.10.2025','28.05.2026','preventive']
], 'Prima perioadă trebuie să fie reținere = 1 zi; perioada „la zi” rămâne arest preventiv și cere confirmare');
assert.ok(a3.deductions.every(x=>x.reviewRequired));

console.log('AI BETA benchmark lot 1: finale explicite, revocare, contopire art.39 și deduceri mixte/„la zi” verificate pe fixture-uri anonimizate.');
