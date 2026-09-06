import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of ['js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js','ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js','ai/beta-lot3-metadata.js']) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;
const json=v=>JSON.parse(JSON.stringify(v));

const multi=`[bundle-sintetic.pdf — pagina 1 — OCR 92%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.10/2026 din 20.01.2026. Persoana născut la data de 01.01.1980. În final pedeapsa rezultantă de 3 ani și 8 luni închisoare. Deduce durata reținerii din data de 04.12.2023 - 1 zi.\n[bundle-sintetic.pdf — pagina 2 — OCR 91%]\nContinuare mandat.\n[bundle-sintetic.pdf — pagina 3 — OCR 89%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.11/2026 din 08.04.2026. Persoana născut la data de 01.01.1980. În final inculpatul execută pedeapsa rezultantă de 4 ani și 4 luni închisoare.\n[bundle-sintetic.pdf — pagina 4 — OCR 90%]\nContinuare mandat.`;
const a1=analyze(multi);
assert.equal(a1.multiplePrimaryDocuments,true);
assert.equal(a1.finalSentence.years,0);
assert.equal(a1.penalties.length,0);
assert.equal(a1.deductions.length,0);
assert.ok(a1.warnings.some(w=>w.startsWith('DOCUMENTE MULTIPLE:')));

const contest=`[concurs-sintetic.pdf — pagina 1 — OCR 91%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.20/2024 din 25.04.2024. Persoana născut la data de 31.05.1986.\n- 6 luni închisoare pentru fapta A;\n- 6 luni închisoare pentru fapta B;\n- 7 ani închisoare pentru fapta C.\nÎn temeiul art.39 alin.1 lit.b, contopește cele trei pedepse principale mai sus menționate și aplică pedeapsa cea mai grea de 7 ani închisoare, la care adaugă sporul obligatoriu de o treime din celelalte pedepse, respectiv 4 luni, în final inculpatul urmând a executa pedeapsa rezultantă de 7 ani 4 luni închisoare.\n[concurs-sintetic.pdf — pagina 2 — OCR 93%]\nÎn temeiul art.72 alin.1 scade durata reținerii de 24 de ore din data de 22.07.2023 și a arestării preventive de la data de 23.07.2023 până la data de 25.04.2024, inclusiv.`;
const a2=analyze(contest);
assert.deepEqual(json(a2.finalSentence),{years:7,months:4,days:0});
assert.deepEqual(json(a2.penalties.map(x=>[x.years,x.months,x.group])),[[0,6,'concurs'],[0,6,'concurs'],[7,0,'concurs']]);
assert.deepEqual(json(a2.deductions.map(x=>[x.start,x.end,x.type])),[['22.07.2023','22.07.2023','retention24h'],['23.07.2023','25.04.2024','preventive']]);

const intermediate=`[repatriere-sintetic.pdf — pagina 1 — OCR 84%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.30/2025 din 04.04.2025. Persoana născut la data de 18.12.1990. Constată pluralitatea intermediară. În baza art.44 alin.2 și art.39 alin.1 lit.b, contopește pedeapsa închisorii de 2 ani cu pedeapsa de 9 luni închisoare, aplicând pedeapsa cea mai grea de 2 ani la care adaugă 1/3 din 9 luni, urmând ca inculpatul să execute în final pedeapsa rezultantă de 2 ani și 3 luni închisoare. Din pedeapsă se deduce durata reținerii începând cu data de 12.04.2021 ora 16:15 până la data de 13.04.2021 ora 16:15.\n[repatriere-sintetic.pdf — pagina 2 — OCR 92%]\nContinuare mandat.\n[repatriere-sintetic.pdf — pagina 3 — OCR 86%]\nFIȘA URMĂRITULUI. Arestat în țara Germania în data de 08.08.2025.\n[repatriere-sintetic.pdf — pagina 4 — OCR 84%]\nPROCES - VERBAL de predare-primire.\n[repatriere-sintetic.pdf — pagina 5 — OCR 82%]\nADMINISTRAȚIA NAȚIONALĂ A PENITENCIARELOR. Garanții pentru persoană repatriată.`;
const a3=analyze(intermediate);
assert.deepEqual(json(a3.finalSentence),{years:2,months:3,days:0});
assert.deepEqual(json(a3.penalties.map(x=>[x.years,x.months,x.group])),[[2,0,'concurs'],[0,9,'concurs']]);
assert.equal(a3.startDate,'');
assert.equal(a3.ignoredAuxiliaryPages.length,3);
assert.ok(a3.deductions.some(x=>x.type==='retention24h'&&x.start==='12.04.2021'));

const combined=`[combinat-sintetic.pdf — pagina 1 — OCR 89%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.40 din 08.04.2026. Persoana născut la data de 26.03.1980. În final pedeapsa de executat este de 1 an și 2 luni închisoare. În baza art.72 deduce durata măsurilor preventive privative de libertate, respectiv reținere, arest preventiv și arest la domiciliu începând cu data de 27.02.2025 la zi - 08.04.2028.`;
const a4=analyze(combined);
assert.deepEqual(json(a4.finalSentence),{years:1,months:2,days:0});
assert.ok(a4.deductions.some(x=>x.start==='27.02.2025'&&x.end==='08.04.2026'&&x.type==='generic'&&x.reviewRequired));
assert.ok(!a4.deductions.some(x=>x.end==='08.04.2028'));

const outlier=`[outlier-sintetic.pdf — pagina 1 — OCR 83%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.50/2026 din 20.04.2026. Persoana născut la data de 24.10.2003. S-a dispus condamnarea la pedeapsa de: 72 ani și 6 luni închisoare. În final inculpatul va executa pedeapsa rezultantă de 2 ani și 6 luni închisoare. În baza art.72 s-a dedus durata reținerii, arestării preventive și arestului la domiciliu, de la 18.10.2024 la zi.\n[outlier-sintetic.pdf — pagina 2 — OCR 76%]\nPentru executarea pedepsei de 2 ani și 6 luni închisoare.`;
const a5=analyze(outlier);
assert.deepEqual(json(a5.finalSentence),{years:2,months:6,days:0});
assert.ok(a5.warnings.some(w=>w.includes('peste 30 de ani')));
assert.ok(a5.deductions.some(x=>x.start==='18.10.2024'&&x.end==='20.04.2026'));

const inline=`[inline-sintetic.pdf — pagina 1 — OCR 90%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.60/2026 din 08.04.2026. Persoana născut la data de 22.03.1954. În temeiul art.40 alin.2 și art.39 alin.1 lit.b, contopește pedepsele aplicate inculpatului de 3 ani închisoare, 2 ani închisoare și 2 ani închisoare în pedeapsa cea mai grea de 3 ani, la care adaugă un spor de 1 an și 4 luni, urmând ca în final inculpatul să execute pedeapsa rezultantă de 4 ani și 4 luni închisoare.`;
const a6=analyze(inline);
assert.deepEqual(json(a6.finalSentence),{years:4,months:4,days:0});
assert.deepEqual(json(a6.penalties.map(x=>[x.years,x.months,x.group])),[[3,0,'concurs'],[2,0,'concurs'],[2,0,'concurs']]);

console.log('AI BETA benchmark lot 2: documente multiple fail-closed, auxiliare excluse, contopiri verificate, deduceri mixte și garduri numerice.');
