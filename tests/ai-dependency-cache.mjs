import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const deps = read('ai/dependencies.js');
const vendorReadme = read('ai/vendor/README.md');

for (const localPath of [
  'ai/vendor/pdfjs/pdf.min.js',
  'ai/vendor/pdfjs/pdf.worker.min.js',
  'ai/vendor/tesseract/tesseract.min.js',
  'ai/vendor/tesseract/worker.min.js',
  'ai/vendor/tesseract-core',
  'ai/vendor/tessdata-best'
]) {
  assert.ok(deps.includes(localPath), `Lipsește calea local-first: ${localPath}`);
}

assert.ok(deps.includes("RESOURCE_CACHE = 'evidenta-ai-deps-v1'"), 'Cache Storage trebuie versionat explicit');
assert.ok(deps.includes('caches.open(RESOURCE_CACHE)'), 'Dependențele JS externe trebuie reutilizate prin Cache Storage');
assert.ok(deps.includes('cacheFirstResponse'), 'Lipsește strategia cache-first pentru resursele JS');
assert.ok(deps.includes("cacheMethod: 'write'"), 'Tesseract trebuie să păstreze modelul OCR în cache');
assert.ok(deps.includes("OCR_CACHE_PATH = 'evidenta-ai-ron-best-v1'"), 'Cache-ul modelului românesc trebuie versionat');
assert.ok(deps.includes('resolveCorePath'), 'Core-ul Tesseract trebuie să permită local-first');
assert.ok(deps.includes('resolveLangPath'), 'Modelul ron trebuie să permită local-first');
assert.ok(deps.includes('resolveTesseractWorker'), 'Worker-ul Tesseract trebuie să permită local/cache-first');
assert.ok(deps.includes('resolvePdfWorker'), 'Worker-ul PDF.js trebuie să permită local/cache-first');
assert.ok(deps.includes('dependencyStatus'), 'Starea local/cache a dependențelor trebuie să poată fi auditată');
assert.ok(deps.includes("tesseract.js-core@7.0.0"), 'Core-ul Tesseract trebuie fixat la 7.0.0');
assert.ok(deps.includes("tesseract.js@7.0.0"), 'Tesseract.js trebuie să rămână fixat la 7.0.0');
assert.ok(deps.includes('4.0.0_best'), 'Modelul românesc best trebuie păstrat');
assert.ok(vendorReadme.includes('ron.traineddata.gz'), 'Documentația self-host trebuie să indice modelul românesc');
assert.ok(vendorReadme.includes('tesseract-core-relaxedsimd'), 'Documentația trebuie să includă variantele moderne de core');

console.log('AI dependency hardening: local-first, Cache Storage și cache IndexedDB pentru modelul românesc verificate.');
