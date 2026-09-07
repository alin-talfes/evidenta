import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(f,'utf8');
const ctx={console,Date,Math,Number,String,Array,Object,Set,Map,JSON,Uint32Array,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx);
for(const file of ['js/contopiri-core.js','ai/core.js','ai/safety.js','ai/real-doc-deductions.js','ai/real-doc-hardening.js','ai/beta-lot2-hardening.js','ai/beta-lot2-postprocess.js','ai/beta-lot3-hardening.js','ai/beta-lot3-postprocess.js','ai/beta-lot3-metadata.js','ai/beta-lot3-measures.js']) vm.runInContext(read(file),ctx,{filename:file});
const combined=`[combinat-sintetic.pdf — pagina 1 — OCR 89%]\nMANDAT DE EXECUTARE A PEDEPSEI ÎNCHISORII Nr.40 din 08.04.2026. Persoana născut la data de 26.03.1980. În final pedeapsa de executat este de 1 an și 2 luni închisoare. În baza art.72 deduce durata măsurilor preventive privative de libertate, respectiv reținere, arest preventiv și arest la domiciliu începând cu data de 27.02.2025 la zi - 08.04.2028.`;
const a=ctx.AIDocumentSafety.analyze(combined);
console.log('DEBUG COMBINAT',JSON.stringify({documentDate:a.documentDate,deductions:a.deductions,warnings:a.warnings},null,2));
