import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const html=read('ai/index.html');
const security=read('ai/security-runtime.js');
const benchmark=read('tests/ai-beta-benchmark-lot1.mjs');

assert.ok(html.includes('Content-Security-Policy'),'Pagina AI trebuie să aibă CSP explicită');
for(const rule of ["object-src 'none'","frame-src 'none'","base-uri 'self'","form-action 'none'","worker-src 'self' blob:"]){
  assert.ok(html.includes(rule),`Lipsește regula CSP: ${rule}`);
}
assert.ok(html.includes('https://cdn.jsdelivr.net'),'CSP trebuie să permită numai sursa versionată necesară runtime-ului');
assert.ok(!html.includes('cdnjs.cloudflare.com'),'Pagina AI nu trebuie să permită vechiul CDN PDF.js');
assert.match(html,/id="fileInput"[^>]*disabled/,'Selecția documentelor trebuie blocată până la inițializarea securizată');
assert.match(html,/id="analyzeFilesBtn"[^>]*disabled/,'Analiza trebuie blocată până la inițializarea securizată');
assert.ok(html.includes('PDF-ul nu este încărcat pe un server'),'Utilizatorul trebuie informat concis despre procesarea locală');
assert.ok(html.indexOf('ai/security-runtime.js')<html.indexOf('ai/app.js'),'Runtime-ul de securitate trebuie încărcat înaintea aplicației AI');
assert.ok(html.indexOf('ai/real-doc-deductions.js')<html.indexOf('ai/real-doc-hardening.js'),'Extractorul de deduceri reale trebuie activ în runtime înaintea hardening-ului');

assert.ok(security.includes("PDF_VERSION='6.2.108'"),'PDF.js trebuie fixat la versiunea reparată 6.2.108');
for(const guard of ['isEvalSupported:false','enableScripting:false','enableXfa:false','useWasm:false']){
  assert.ok(security.includes(guard),`Lipsește protecția PDF.js: ${guard}`);
}
for(const token of ['/JavaScript','/OpenAction','/Launch','/EmbeddedFile','/RichMedia','/SubmitForm']){
  assert.ok(security.includes(`'${token}'`),`Preflight-ul PDF trebuie să blocheze ${token}`);
}
assert.ok(security.includes("'%PDF-'"),'Fișierul PDF trebuie validat prin magic header, nu doar prin extensie');
assert.ok(security.includes('lockOutboundNetwork'),'După selectarea documentului trebuie blocat traficul extern din fereastra AI');
assert.ok(security.includes("sendBeacon',{configurable:true,value:()=>false}"),'sendBeacon trebuie dezactivat în modul sensibil');
assert.ok(security.includes("addEventListener('pagehide',scrubSensitiveDom"),'Datele sensibile din DOM trebuie șterse la părăsirea paginii');
assert.ok(security.includes('deps.ensurePdf=securePdf'),'Vechiul loader PDF trebuie înlocuit fail-closed cu runtime-ul securizat');
assert.ok(security.includes('await Promise.all([securePdf(),warmOcr()])'),'PDF/OCR trebuie inițializate înainte ca selecția documentelor să fie activată');

assert.ok(benchmark.includes('Fixture-uri complet sintetice'),'Benchmark-ul public trebuie să folosească numai date sintetice');
assert.ok(benchmark.includes('mepi-sintetic.pdf')&&benchmark.includes('complex-sintetic.pdf'),'Fixture-urile publice trebuie marcate explicit ca sintetice');

console.log('Security & Privacy 1.0.1: CSP, PDF.js 6.2.108 fail-closed, preflight PDF, blocare trafic extern și fixture-uri sintetice verificate.');
