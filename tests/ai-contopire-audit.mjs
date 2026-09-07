import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of ['js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js','ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js','ai/beta-lot3-metadata.js','ai/beta-lot3-measures.js','ai/contopire-audit.js']) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;
const json=v=>JSON.parse(JSON.stringify(v));

const sourcePhoto=`[contopire-sintetica-a.jpg — imagine — OCR 94%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 91/2031 din 14.02.2031. Persoana născut la data de 01.01.1980. Condamnă inculpatul la pedeapsa de 1 an închisoare pentru fapta A. Condamnă inculpatul la pedeapsa de 1 an și 3 luni închisoare pentru fapta B. În baza art. 38 alin. 2 raportat la art. 39 alin. 1 lit. b) Cod penal contopește pedepsele stabilite prin prezenta hotărâre, urmând să aplice pedeapsa cea mai grea de 1 an și 3 luni închisoare la care va adăuga un spor de o treime din cealaltă pedeapsă (1 an/3=4 luni), inculpatul urmând să execute pedeapsa rezultantă de 1 an și 7 luni închisoare.`;
const p1=analyze(sourcePhoto);
assert.equal(Boolean(p1.arithmeticConflict),false);
assert.ok(p1.evidence.some(x=>x.label==='Contopire verificată aritmetic'));
assert.deepEqual(json(p1.contopireAudits[0].expectedFinal),{years:1,months:7,days:0});

const wrongPhoto=sourcePhoto.replace('pedeapsa rezultantă de 1 an și 7 luni','pedeapsa rezultantă de 1 an și 6 luni');
const p2=analyze(wrongPhoto);
assert.equal(p2.arithmeticConflict,true);
assert.ok(p2.warnings.some(w=>w.includes('CONFLICT ARITMETIC CONTOPIRE')&&w.includes('rezultanta concursului')&&w.includes('7 luni')));

const sourceComplex=`[contopire-sintetica-b.pdf — pagina 1 — OCR 93%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 92/2031 din 15.02.2031. Persoana născut la data de 02.02.1980. Condamnă inculpatul la pedeapsa de 1 an închisoare pentru fapta A. Condamnă inculpatul la pedeapsa de 1 an închisoare pentru fapta B. Descontopește pedeapsa rezultantă de 1 an și 2 luni și repune în individualitatea lor pedepsele componente, respectiv pedeapsa de 8 luni închisoare și pedeapsa de 6 luni închisoare. În temeiul art. 39 alin. 1 lit. b) Cod penal contopește pedepsele de 1 an închisoare și 1 an închisoare aplicate în prezenta cauză cu pedeapsa de 8 luni închisoare, în pedeapsa cea mai grea de 1 an închisoare la care se adaugă un spor obligatoriu și fix de 1/3 din totalul celorlalte pedepse, respectiv 6 luni și 20 de zile, urmând ca în final inculpatul să execute pedeapsa de 1 an 6 luni și 20 de zile închisoare, la care se adaugă pedeapsa de 6 luni închisoare, urmând ca în final inculpatul să execute pedeapsa rezultantă de 2 ani și 20 de zile închisoare.\n[contopire-sintetica-b.pdf — pagina 2 — OCR 95%]\nUrmând să execute 2 ani și 20 zile închisoare.`;
const m1=analyze(sourceComplex);
assert.equal(Boolean(m1.arithmeticConflict),false);
assert.deepEqual(json(m1.contopireAudits[0].expectedContest),{years:1,months:6,days:20});
assert.deepEqual(json(m1.contopireAudits[0].expectedFinal),{years:2,months:0,days:20});
assert.ok(m1.evidence.some(x=>x.label==='Contopire verificată aritmetic'));

const wrongComplex=sourceComplex.replace('respectiv 6 luni și 20 de zile','respectiv 5 luni și 20 de zile');
const m2=analyze(wrongComplex);
assert.equal(m2.arithmeticConflict,true);
assert.ok(m2.warnings.some(w=>w.includes('CONFLICT ARITMETIC CONTOPIRE')&&w.includes('sporul')));

console.log('AI contopiri: structuri sintetice pentru contopire simplă și complexă, inclusiv detectarea erorilor aritmetice.');
