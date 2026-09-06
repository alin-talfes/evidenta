import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of [
  'js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js',
  'ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js'
]) vm.runInContext(read(file),ctx,{filename:file});
const analyze=ctx.AIDocumentSafety.analyze;

// 1. Reținere exprimată ca interval orar de exact 24 h: o singură zi dedusă.
const retentionClock=`[lot3-a.pdf — pagina 1 — OCR 92%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.1/2026 din 20.01.2026. Persoana născut la data de 01.01.1980. În final va executa pedeapsa rezultantă de 2 ani închisoare. Se deduce durata reținerii începând cu data de 12.04.2021, ora 16:15, până la data de 13.04.2021, ora 16:15.`;
const a1=analyze(retentionClock);
assert.ok(a1.deductions.some(x=>x.type==='retention24h'&&x.start==='12.04.2021'&&x.end==='12.04.2021'));
assert.ok(!a1.deductions.some(x=>x.start==='12.04.2021'&&x.end==='13.04.2021'&&x.type!=='retention24h'));

// 2. Reținere + arest preventiv + arest la domiciliu indicate global până „la zi”: un interval generic, nu o succesiune inventată.
const mixedToDate=`[lot3-b.pdf — pagina 1 — OCR 91%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.2/2026 din 25.06.2026. Persoana născut la data de 02.02.1980. Se execută pedeapsa de 1 an și 9 luni închisoare. În temeiul art.72 se deduce durata reținerii, arestării preventive și arestului la domiciliu, din data de 21.11.2025 la zi.`;
const a2=analyze(mixedToDate);
assert.ok(a2.deductions.some(x=>x.type==='generic'&&x.start==='21.11.2025'&&x.end==='25.06.2026'&&x.reviewRequired===true));

// 3. Reținere + arest preventiv indicate într-un singur interval fix: păstrăm totalul și cerem confirmare, fără a inventa data trecerii între măsuri.
const combinedFixed=`[lot3-c.pdf — pagina 1 — OCR 90%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.3/2023 din 19.12.2023. Persoana născut la data de 03.03.1980. Va executa pedeapsa de 4 ani închisoare. Se deduce durata reținerii și arestării preventive, începând cu data de 03.04.2023 până la data de 19.12.2023.`;
const a3=analyze(combinedFixed);
assert.ok(a3.deductions.some(x=>x.type==='generic'&&x.start==='03.04.2023'&&x.end==='19.12.2023'&&x.reviewRequired===true));

// 4. „EXECUTĂ: 15 ani” și arest preventiv „la zi” trebuie ancorate la data mandatului.
const simpleLong=`[lot3-d.pdf — pagina 1 — OCR 94%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.4/2018 din 13.03.2018. Persoana născut la data de 04.04.1975. EXECUTĂ: 15 ani închisoare. Din pedeapsa de executat se deduce timpul arestului preventiv începând cu data de 30.01.2018 la zi.`;
const a4=analyze(simpleLong);
assert.deepEqual([a4.finalSentence.years,a4.finalSentence.months,a4.finalSentence.days],[15,0,0]);
assert.ok(a4.deductions.some(x=>x.type==='preventive'&&x.start==='30.01.2018'&&x.end==='13.03.2018'));

// 5. Pagina ROCRIS/cazier atașată după MEPI este auxiliară și nu poate suprascrie datele mandatului.
const withCazier=`[lot3-e.pdf — pagina 1 — OCR 93%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.5/2026 din 25.06.2026. Persoana născut la data de 05.05.1980. În final va executa pedeapsa rezultantă de 1 an și 9 luni închisoare.\n[lot3-e.pdf — pagina 2 — OCR 92%]\nContinuare mandat.\n[lot3-e.pdf — pagina 3 — OCR 91%]\nSITUAȚIE GENERALĂ A CAZIERULUI JUDICIAR. Persoana născut la data de 09.09.1999. Document emis în aplicația ROCRIS – Sistemul Informatic al Cazierului Judiciar Român.`;
const a5=analyze(withCazier);
assert.equal(a5.birthDate,'05.05.1980');
assert.ok((a5.ignoredAuxiliaryPages||[]).some(x=>x.page===3));

// 6. Două mandate independente în același PDF rămân fail-closed și în Lotul 3.
const multi=`[lot3-f.pdf — pagina 1 — OCR 92%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.6/2022 din 09.12.2022. Persoana născut la data de 06.06.1980. În final va executa pedeapsa rezultantă de 6 ani și 8 luni.\n[lot3-f.pdf — pagina 2 — OCR 92%]\nContinuare mandat.\n[lot3-f.pdf — pagina 3 — OCR 91%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.7/2023 din 25.04.2023. Persoana născut la data de 06.06.1980. În final va executa pedeapsa rezultantă de 7 ani și 10 luni.`;
const a6=analyze(multi);
assert.equal(a6.multiplePrimaryDocuments,true);
assert.deepEqual([a6.finalSentence.years,a6.finalSentence.months,a6.finalSentence.days],[0,0,0]);
assert.equal(a6.deductions.length,0);

// 7. Componentele care nu reproduc rezultanta nu pot rămâne selectate automat.
const mismatch=`[lot3-g.pdf — pagina 1 — OCR 95%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.8/2026 din 25.06.2026. Persoana născut la data de 07.07.1980. Pentru faptele aflate în concurs, inculpatul a fost condamnat la pedeapsa de 2 ani închisoare și la pedeapsa de 2 ani închisoare. În final va executa pedeapsa rezultantă de 5 ani închisoare.`;
const a7=analyze(mismatch);
assert.ok((a7.penalties||[]).filter(x=>x.group!=='ignore').length===0);
assert.ok((a7.warnings||[]).some(w=>w.startsWith('CONFLICT ARITMETIC:')));

console.log('AI BETA benchmark lot 3: reținere 24h cu ore, măsuri combinate, arest la zi, pagini ROCRIS, mandate multiple și validare aritmetică fail-closed.');
