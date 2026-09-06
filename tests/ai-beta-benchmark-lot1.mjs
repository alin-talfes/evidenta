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

// Fixture-uri complet sintetice: păstrează doar structurile juridice testate.
const mepi=`[mepi-sintetic.pdf — pagina 1 — OCR 88%]\nPENITENCIARUL TEST Intrarea Nr. 99001 Ziua 08 luna 07 20 26\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.900/A/2026 din 01.07.2026\nPersoana, născut la data de 14.02.1980, a fost condamnată. EXECUTĂ pedeapsa principală de 6 (șase) ani închisoare.\nVăzând sentința penală și decizia penală prin care hotărârea a rămas definitivă.\n[mepi-sintetic.pdf — pagina 2 — OCR 93%]\nA fost condamnat inculpatul la pedeapsa închisorii de 4 ani închisoare. S-a constatat starea de recidivă postcondamnatorie față de pedeapsa de 2 ani închisoare. În temeiul legii a fost revocată suspendarea sub supraveghere a pedepsei de 2 ani închisoare și s-a dispus executarea acestei pedepse alături de pedeapsa aplicată prin prezenta hotărâre, inculpatul urmând să execute pedeapsa de 6 ani închisoare.`;
const a1=analyze(mepi);
assert.equal(a1.birthDate,'14.02.1980');
assert.equal(a1.receivedDate,'08.07.2026','Ștampila „Intrarea Nr. … Ziua … luna … 20 26” trebuie citită ca dată a primirii');
assert.equal(a1.primaryDocumentType,'MEPI/mandat');
assert.deepEqual(JSON.parse(JSON.stringify(a1.documentTypes)),['MEPI/mandat'],'Referirile la sentință/decizie dintr-un MEPI nu trebuie confundate cu tipul documentului principal');
assert.deepEqual(JSON.parse(JSON.stringify(a1.finalSentence)),{years:6,months:0,days:0});
assert.equal(a1.startDate,'','MEPI fără dată explicită de începere nu trebuie să inventeze startDate');
assert.equal(a1.penalties.length,2,'Alăturarea 4 ani + revocare 2 ani trebuie extrasă numai dacă se verifică la 6 ani');
assert.deepEqual(JSON.parse(JSON.stringify(a1.penalties.map(x=>x.group))),['recidiva','revocare']);

const formulaOthers=['9 luni','9 luni','1 an și 6 luni',...Array(8).fill('3 ani')].join(' + ');
const complex=`[complex-sintetic.pdf — pagina 1 — OCR 91%]\nPENITENCIARUL TEST Intrarea Nr. 99002 Ziua 16 luna 07 2026\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.901/2026 din 15 iulie 2026. Persoana, născut în data de 10.10.1990. Anterior fusese aplicată pedeapsa principală rezultantă de 11 ani și 6 luni închisoare.\n[complex-sintetic.pdf — pagina 3 — OCR 94%]\nÎn baza art. 39 alin. 1 lit. b Cod penal, aplică pedeapsa principală cea mai grea, de 3 ani închisoare, la care se adaugă sporul fix și obligatoriu de o treime din totalul celorlalte pedepse principale (${formulaOthers}), respectiv 9 ani închisoare, în final inculpatul executând pedeapsa principală rezultantă de 12 ani închisoare.\nDeduce durata reținerii din prezenta cauză din 10.01.2020 ora 09:30 — 11.01.2020 ora 09:30 (o zi), precum și durata reținerii, arestării preventive și la domiciliu și perioada deja executată în legătură cu altă cauză, respectiv 05.05.2018, 06.05.2018-20.12.2018, 15.01.2020 la zi.\nÎn final, pedeapsa de executat fiind de: 12 ani închisoare.`;
const a2=analyze(complex);
assert.equal(a2.birthDate,'10.10.1990','Trebuie acceptată formula „născut în data de”');
assert.equal(a2.receivedDate,'16.07.2026');
assert.equal(a2.primaryDocumentType,'MEPI/mandat');
assert.deepEqual(JSON.parse(JSON.stringify(a2.finalSentence)),{years:12,months:0,days:0},'Formula finală explicită trebuie să prevaleze față de o rezultantă istorică');
assert.equal(a2.documentDate,'15.07.2026');
assert.equal(a2.penalties.length,12,'Formula art. 39 trebuie să reconstruiască pedeapsa cea mai grea + 11 pedepse celelalte');
assert.ok(a2.penalties.every(x=>x.group==='concurs'));
assert.equal(a2.deductions.length,4,'Trebuie păstrate toate cele patru deduceri distincte din formula complexă');
assert.deepEqual(JSON.parse(JSON.stringify(a2.deductions.map(x=>[x.start,x.end,x.type]))),[
  ['10.01.2020','11.01.2020','retention24h'],
  ['05.05.2018','05.05.2018','retention24h'],
  ['06.05.2018','20.12.2018','generic'],
  ['15.01.2020','15.07.2026','generic']
]);
assert.ok(a2.deductions.every(x=>x.reviewRequired),'Deducerile interpretate din formule mixte trebuie confirmate explicit');

const preventive=`[preventiv-sintetic.pdf — pagina 1 — OCR 91%]\nPENITENCIARUL TEST Intrarea Nr. 99003 Ziua 21 luna 07 20 26\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.902/2026 din 20.07.2026. Persoana, născut la data de 01.03.1982, a fost condamnată la pedeapsa de 1 an și 6 luni închisoare. În baza art.72 s-a dedus perioada în care a fost reținut și arestat preventiv în prezenta cauză, anume de la data de 10.09.2025 la data de 11.09.2025 și de la data de 01.11.2025 la zi. În final, pedeapsa de executat este de 1 an și 6 luni închisoare.`;
const a3=analyze(preventive);
assert.equal(a3.birthDate,'01.03.1982');
assert.equal(a3.receivedDate,'21.07.2026');
assert.equal(a3.primaryDocumentType,'MEPI/mandat');
assert.deepEqual(JSON.parse(JSON.stringify(a3.finalSentence)),{years:1,months:6,days:0});
assert.equal(a3.documentDate,'20.07.2026');
assert.deepEqual(JSON.parse(JSON.stringify(a3.deductions.map(x=>[x.start,x.end,x.type]))),[
  ['10.09.2025','10.09.2025','retention24h'],
  ['01.11.2025','20.07.2026','preventive']
], 'Prima perioadă trebuie să fie reținere = 1 zi; perioada „la zi” rămâne arest preventiv și cere confirmare');
assert.ok(a3.deductions.every(x=>x.reviewRequired));

const lowStamp=`[stamp-low-sintetic.pdf — pagina 1 — OCR 72%]\nPENITENCIARUL TEST Intrarea Nr. 99004 Ziua 04 luna 08 20 26\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.903/2026 din 03.08.2026. EXECUTĂ pedeapsa principală de 2 ani închisoare.`;
const a4=analyze(lowStamp);
assert.equal(a4.receivedDate,'','O ștampilă de intrare din OCR sub 80% nu trebuie folosită automat');
assert.equal(a4.suggestedReceivedDate,'04.08.2026');
assert.ok(a4.warnings.some(w=>w.includes('data primirii din ștampila de intrare')));

console.log('AI BETA benchmark lot 1: finale explicite, revocare, art.39, deduceri mixte/„la zi”, ștampile de intrare și clasificarea documentului principal.');
