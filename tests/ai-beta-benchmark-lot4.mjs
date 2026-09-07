import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of [
  'js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js',
  'ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js',
  'ai/beta-lot3-metadata.js','ai/beta-lot3-measures.js','ai/beta-lot4-hardening.js','ai/contopire-audit.js'
]) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;

// Fixture complet sintetic, derivat doar ca structură dintr-un MEPI simplu cu ștampilă de intrare și rubrică de deduceri necompletată.
const simpleStamped=`[lot4-sintetic.jpg — imagine — OCR 94%]\nPENITENCIARUL EXEMPLU Intrare Nr. 1234 / 18.05.2026 Ziua 18 luna 05 2026.\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 99/2026 din 15.05.2026. Persoana născut la data de 01.01.1990. Condamnă inculpatul la pedeapsa de 1 an închisoare. Urmând ca acesta să execute 1 an închisoare. ORDONĂM: arestarea și depunerea în penitenciar. Din pedeapsa de executat se va deduce timpul reținerii și arestării preventive de la --- până la ---.`;
const a1=analyze(simpleStamped);
assert.deepEqual([a1.finalSentence.years,a1.finalSentence.months,a1.finalSentence.days],[1,0,0]);
assert.equal(a1.receivedDate,'18.05.2026');
assert.equal(a1.startDate,'');
assert.equal(a1.deductions.length,0);
assert.equal(a1.blankDeductionClause,true);
assert.ok(a1.evidence.some(x=>x.label==='Pedeapsă finală explicită'));
assert.ok(a1.evidence.some(x=>x.label==='Data primirii în penitenciar'&&x.value==='18.05.2026'));
assert.ok(a1.warnings.some(w=>w.startsWith('DEDUCERI: rubrica')));

// Două date reale aflate după o rubrică goală nu pot fi transformate accidental într-o deducere.
const blankWithNearbyDates=`[lot4-sintetic-b.jpg — imagine — OCR 95%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 100/2026 din 15.05.2026. Persoana născut la data de 02.02.1990. Urmând ca acesta să execute 2 ani închisoare. Din pedeapsa de executat se va deduce timpul reținerii și arestării preventive de la --- până la ---. Hotărârea din 01.03.2025 a fost comunicată la 02.03.2025.`;
const a2=analyze(blankWithNearbyDates);
assert.equal(a2.blankDeductionClause,true);
assert.equal(a2.deductions.length,0);

// Data textuală de primire și ștampila care se contrazic => fail-closed.
const conflictingReceipt=`[lot4-sintetic-c.jpg — imagine — OCR 93%]\nPENITENCIARUL EXEMPLU Intrare Nr. 2222 / 20.06.2026. MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 101/2026 din 15.06.2026. Persoana născut la data de 03.03.1990. Urmând ca acesta să execute 3 ani închisoare. Primit în penitenciar la data de 21.06.2026.`;
const a3=analyze(conflictingReceipt);
assert.equal(a3.receivedDate,'');
assert.equal(Boolean(a3.conflicts?.receivedDate),true);
assert.ok(a3.warnings.some(w=>w.includes('diferă de ștampila de intrare')));

// Ștampila de pe o pagină OCR sub 80% rămâne doar sugestie.
const lowOcrStamp=`[lot4-sintetic-d.jpg — imagine — OCR 72%]\nPENITENCIARUL EXEMPLU Intrare Nr. 3333 / 22.07.2026. MANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr. 102/2026 din 20.07.2026. Persoana născut la data de 04.04.1990. Urmând ca acesta să execute 1 an închisoare.`;
const a4=analyze(lowOcrStamp);
assert.equal(a4.receivedDate,'');
assert.equal(a4.suggestedReceivedDate,'22.07.2026');
assert.ok(a4.warnings.some(w=>w.includes('data primirii din ștampila de intrare')&&w.includes('72%')));

console.log('AI BETA benchmark lot 4: pedeapsă finală explicită, ștampilă de intrare, start separat și rubrică deduceri goală fail-closed.');
