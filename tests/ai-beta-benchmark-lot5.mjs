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

// Fixture complet sintetic inspirat numai din structura documentului real.
const simple=`[lot5-a.jpg — imagine — OCR 86%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.500/2025 din 15.12.2025. Persoana născut la data de 01.01.2000. A fost condamnat la pedeapsa principală de 2 ani și 10 luni închisoare. EXECUTĂ pedeapsa principală de 2 ani și 10 luni închisoare. Din pedeapsa de executat, în baza art.72 alin.1 C.P., se scade durata reținerii și a arestării preventive din data de 25.07.2024 la 15.12.2025.`;
const a=analyze(simple);
assert.deepEqual([a.finalSentence.years,a.finalSentence.months,a.finalSentence.days],[2,10,0]);
assert.equal(a.startDate,'','Data deducerii nu poate deveni automat data începerii executării.');
assert.equal(a.receivedDate,'','Fără ștampilă/formulă de primire nu se inventează data primirii.');
const row=a.deductions.find(x=>x.start==='25.07.2024'&&x.end==='15.12.2025');
assert.ok(row,'Intervalul agregat reținere + arest preventiv trebuie identificat.');
assert.equal(row.type,'generic');
assert.equal(row.reviewRequired,true);
assert.ok(!a.deductions.some(x=>x.start==='25.07.2024'&&x.type==='retention24h'),'Nu se inventează o reținere separată când documentul dă numai intervalul global.');
assert.ok(a.warnings.some(w=>w.startsWith('DEDUCERI: documentul indică global')));

// OCR sub prag pentru formula EXECUTĂ: pedeapsa trebuie doar sugerată, nu folosită automat.
const low=`[lot5-b.jpg — imagine — OCR 74%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.501/2025 din 15.12.2025. Persoana născut la data de 01.01.2000. EXECUTĂ pedeapsa principală de 2 ani și 10 luni închisoare.`;
const b=analyze(low);
assert.deepEqual([b.finalSentence.years,b.finalSentence.months,b.finalSentence.days],[0,0,0]);
assert.deepEqual([b.suggestedFinalSentence.years,b.suggestedFinalSentence.months,b.suggestedFinalSentence.days],[2,10,0]);
assert.ok(b.warnings.some(w=>w.includes('EXECUTĂ pedeapsa principală')&&w.includes('74%')));

// Conflict între două formule finale explicite: fail-closed.
const conflict=`[lot5-c.jpg — imagine — OCR 93%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.502/2025 din 15.12.2025. Persoana născut la data de 01.01.2000. În final va executa pedeapsa rezultantă de 3 ani închisoare. EXECUTĂ pedeapsa principală de 2 ani și 10 luni închisoare.`;
const c=analyze(conflict);
assert.deepEqual([c.finalSentence.years,c.finalSentence.months,c.finalSentence.days],[0,0,0]);
assert.ok(c.warnings.some(w=>w.startsWith('CONFLICT:')&&w.includes('EXECUTĂ pedeapsa principală')));

console.log('AI BETA benchmark lot 5: EXECUTĂ pedeapsa principală, deducere agregată reținere + arest preventiv și fail-closed numeric.');
