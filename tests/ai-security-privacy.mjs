import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const html=read('ai/index.html');
const security=read('ai/security-runtime.js');
const securitySw=read('ai/security-sw.js');
const benchmark=read('tests/ai-beta-benchmark-lot1.mjs');

assert.ok(html.includes('Content-Security-Policy'),'Pagina AI trebuie să aibă CSP explicită');
for(const rule of ["object-src 'none'","frame-src 'none'","base-uri 'self'","form-action 'none'","worker-src 'self' blob:","connect-src 'self'"]){
  assert.ok(html.includes(rule),`Lipsește regula CSP: ${rule}`);
}
assert.ok(!html.includes('https://cdn.jsdelivr.net'),'Pagina AI nu trebuie să permită conexiuni directe către CDN');
assert.ok(!html.includes('tessdata.projectnaptha.com'),'Pagina AI nu trebuie să permită conexiuni directe către tessdata');
assert.ok(!html.includes('cdnjs.cloudflare.com'),'Pagina AI nu trebuie să permită vechiul CDN PDF.js');
assert.match(html,/id="fileInput"[^>]*disabled/,'Selecția documentelor trebuie blocată până la inițializarea securizată');
assert.match(html,/id="analyzeFilesBtn"[^>]*disabled/,'Analiza trebuie blocată până la inițializarea securizată');
assert.ok(html.includes('PDF-ul nu este încărcat pe un server'),'Utilizatorul trebuie informat concis despre procesarea locală');
assert.ok(html.indexOf('ai/security-runtime.js')<html.indexOf('ai/app.js'),'Runtime-ul de securitate trebuie încărcat înaintea aplicației AI');
assert.ok(html.indexOf('ai/real-doc-deductions.js')<html.indexOf('ai/real-doc-hardening.js'),'Extractorul de deduceri reale trebuie activ în runtime înaintea hardening-ului');

assert.ok(security.includes("PDF_VERSION='6.2.108'"),'PDF.js trebuie fixat la versiunea reparată 6.2.108');
assert.ok(security.includes('ensureSecurityWorker'),'Runtime-ul trebuie să ceară Service Worker-ul de integritate înainte de PDF/OCR');
assert.ok(security.includes("new URL('_secure/',SW_URL)"),'Dependențele trebuie expuse prin URL-uri virtuale same-origin');
for(const guard of ['isEvalSupported:false','enableScripting:false','enableXfa:false','useWasm:false']){
  assert.ok(security.includes(guard),`Lipsește protecția PDF.js: ${guard}`);
}
for(const token of ['/JavaScript','/OpenAction','/Launch','/EmbeddedFile','/RichMedia','/SubmitForm']){
  assert.ok(security.includes(`'${token}'`),`Preflight-ul PDF trebuie să blocheze ${token}`);
}
assert.ok(security.includes("'%PDF-'"),'Fișierul PDF trebuie validat prin magic header, nu doar prin extensie');
assert.ok(security.includes('lockOutboundNetwork'),'După selectarea documentului trebuie blocat traficul extern din fereastra AI');
assert.ok(security.includes("sendBeacon',{configurable:true,value:()=>false}"),'sendBeacon trebuie dezactivat în modul sensibil');
assert.ok(security.includes('scrubSensitiveDom'),'Datele sensibile din DOM trebuie șterse la părăsirea paginii');
assert.ok(security.includes('deps.ensurePdf=securePdf'),'Loaderul PDF trebuie înlocuit fail-closed cu runtime-ul securizat');
assert.ok(security.includes('deps.recognizeDetailed=secureRecognizeDetailed'),'OCR-ul trebuie rutat prin runtime-ul securizat');
assert.ok(security.includes('await Promise.all([securePdf(),warmOcr()])'),'PDF/OCR trebuie inițializate înainte ca selecția documentelor să fie activată');

assert.ok(securitySw.includes("CACHE_NAME = 'evidenta-ai-secure-deps-v2'"),'Cache-ul verificat trebuie versionat');
assert.ok(securitySw.includes("crypto.subtle.digest('SHA-256'"),'Service Worker-ul trebuie să verifice SHA-256 înainte de cache');
assert.ok(securitySw.includes('Dependency SHA-256 mismatch'),'Hash mismatch trebuie să blocheze resursa');
assert.ok(securitySw.includes("'Cross-Origin-Resource-Policy': 'same-origin'"),'Resursele verificate trebuie reexpuse same-origin');
for(const hash of [
  '9fab0c910bf1484835c5c2aeb68f7eb3dfce7f9eb435a004526c5af86d70890c',
  'bc0d1b88ea0b66196b1d36a58ac243c6d92adfe725624e2a9fdd381bdf8ef434',
  '000c27d9cd0def655f77b36c72a389c0ab13793aa31cb4d7aab56d09c0afbc7e',
  '576b7df7e3393e137e51849357c9adb53fe7ac1bb69bfa06cf3d61520f182c6d',
  'df2a1d0084f58da0fc6f08831e86fcac28f8995213e081331d06c3b0cab6b596'
]) assert.ok(securitySw.includes(hash),`Lipsește hash-ul allowlist ${hash}`);

assert.ok(benchmark.includes('Fixture-uri complet sintetice'),'Benchmark-ul public trebuie să folosească numai date sintetice');
assert.ok(benchmark.includes('mepi-sintetic.pdf')&&benchmark.includes('complex-sintetic.pdf'),'Fixture-urile publice trebuie marcate explicit ca sintetice');

console.log('Security & Privacy 1.0.1: CSP same-origin, proxy SHA-256, PDF.js 6.2.108 fail-closed și fixture-uri sintetice verificate.');
