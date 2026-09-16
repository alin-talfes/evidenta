import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const ctx={Date,globalThis:null}; ctx.globalThis=ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/quarantine-rules.js','utf8'),ctx,{filename:'js/quarantine-rules.js'});
const received=new Date(2026,8,1);
const q=ctx.QuarantineRules.schedule(received);
assert.equal(q.day21.getDate(),21);
assert.equal(q.day22.getDate(),22);

const ai=fs.readFileSync('ai/result-pedepse.js','utf8');
assert.match(ai,/DETALII MANDAT/);
assert.match(ai,/FRACȚII LIBERARE CONDIȚIONATĂ/);
assert.match(ai,/REANALIZARE 1\/5/);
assert.match(ai,/Math\.floor\(totalDays\/5\)/);
assert.match(ai,/thresholdDate\(startDate,fifth,ded,0\)/);
assert.match(ai,/CARANTINĂ — ZIUA 21/);
assert.match(ai,/REGIM PROVIZORIU — DIN ZIUA 22/);
assert.match(ai,/result-section/);
assert.match(ai,/result-grid/);
assert.match(ai,/result-item/);

const ped=fs.readFileSync('js/quarantine-ui.js','utf8');
assert.match(ped,/CARANTINĂ — ZIUA 21/);
assert.match(ped,/REGIM PROVIZORIU — DIN ZIUA 22/);
assert.match(ped,/ziua primirii .* ZIUA 1/);

const rootHtml=fs.readFileSync('index.html','utf8');
const aiHtml=fs.readFileSync('ai/index.html','utf8');
const version=fs.readFileSync('js/version.js','utf8');
assert.match(rootHtml,/quarantine-rules\.js/);
assert.match(rootHtml,/quarantine-ui\.js/);
assert.match(aiHtml,/quarantine-rules\.js/);
assert.match(aiHtml,/result-pedepse\.js/);
assert.doesNotMatch(version,/quarantine-rules\.js|result-pedepse\.js|quarantine-ui\.js/);

console.log('Paritate rezultate AI/Pedepse: 1/5 afișat, controllere declarative și carantină ziua 21/22.');
