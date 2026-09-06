(function(root){
'use strict';

const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
const TESSERACT_WORKER_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/worker.min.js';
const TESSERACT_CORE_PATH = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0';
const TESSERACT_LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0_best';

const LOCAL_PDFJS_URL = 'ai/vendor/pdfjs/pdf.min.js';
const LOCAL_PDFJS_WORKER_URL = 'ai/vendor/pdfjs/pdf.worker.min.js';
const LOCAL_TESSERACT_URL = 'ai/vendor/tesseract/tesseract.min.js';
const LOCAL_TESSERACT_WORKER_URL = 'ai/vendor/tesseract/worker.min.js';
const LOCAL_TESSERACT_CORE_PATH = 'ai/vendor/tesseract-core';
const LOCAL_TESSERACT_LANG_PATH = 'ai/vendor/tessdata-best';

const RESOURCE_CACHE = 'evidenta-ai-deps-v1';
const OCR_CACHE_PATH = 'evidenta-ai-ron-best-v1';
const OCR_LANGUAGE = 'ron';
const OCR_DPI = '300';
const LOW_CONFIDENCE_THRESHOLD = 78;

let pdfPromise = null;
let tesseractPromise = null;
let workerPromise = null;
let currentLogger = null;
let tesseractWorkerObjectUrl = '';
let pdfWorkerObjectUrl = '';

function absoluteUrl(path){
  try { return new URL(path, document.baseURI).href; }
  catch (_) { return path; }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000){
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    return await fetch(url, {
      cache: 'force-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      ...options,
      ...(controller ? { signal:controller.signal } : {})
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function localAssetAvailable(path){
  const url = absoluteUrl(path);
  try {
    const response = await fetchWithTimeout(url, { method:'HEAD' }, 5000);
    if (response.ok) return true;
    if (response.status === 405) {
      const probe = await fetchWithTimeout(url, { method:'GET', headers:{ Range:'bytes=0-0' } }, 5000);
      return probe.ok;
    }
  } catch (_) {}
  return false;
}

async function cacheStorage(){
  if (!('caches' in root)) return null;
  try { return await caches.open(RESOURCE_CACHE); }
  catch (_) { return null; }
}

async function cacheFirstResponse(url){
  const cache = await cacheStorage();
  if (cache) {
    const cached = await cache.match(url);
    if (cached) return { response:cached, cached:true };
  }
  const response = await fetchWithTimeout(url, { mode:'cors' }, 20000);
  if (!response.ok) throw new Error(`Resursa nu a putut fi descărcată (${response.status}).`);
  if (cache) {
    try { await cache.put(url, response.clone()); } catch (_) {}
  }
  return { response, cached:false };
}

async function cachedBlobUrl(url, mime = 'application/javascript'){
  const { response } = await cacheFirstResponse(url);
  const blob = await response.blob();
  return URL.createObjectURL(blob.type ? blob : new Blob([blob], { type:mime }));
}

function loadScriptUrl(url, globalName, cleanupUrl = ''){
  if (root[globalName]) {
    if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
    return Promise.resolve(root[globalName]);
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      script.remove();
      if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
      reject(new Error(`Încărcarea resursei a expirat: ${globalName}.`));
    }, 30000);
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
      if (root[globalName]) resolve(root[globalName]);
      else reject(new Error(`Resursa ${globalName} s-a încărcat fără obiectul global așteptat.`));
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.remove();
      if (cleanupUrl) URL.revokeObjectURL(cleanupUrl);
      reject(new Error(`Nu s-a putut încărca ${globalName}.`));
    };
    script.addEventListener('load', done, { once:true });
    script.addEventListener('error', fail, { once:true });
    script.src = url;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    script.dataset.aiDependency = globalName;
    document.head.appendChild(script);
  });
}

async function loadScript(localPath, remoteUrl, globalName){
  if (root[globalName]) return root[globalName];

  if (await localAssetAvailable(localPath)) {
    try { return await loadScriptUrl(absoluteUrl(localPath), globalName); }
    catch (_) {
      // Un asset local corupt nu trebuie să blocheze fallback-ul versionat.
    }
  }

  try {
    const objectUrl = await cachedBlobUrl(remoteUrl);
    return await loadScriptUrl(objectUrl, globalName, objectUrl);
  } catch (cacheError) {
    try { return await loadScriptUrl(remoteUrl, globalName); }
    catch (networkError) {
      const error = new Error(`Nu s-a putut încărca ${globalName}. Nici copia locală/cache, nici fallback-ul extern nu sunt disponibile.`);
      error.cause = networkError || cacheError;
      throw error;
    }
  }
}

async function resolvePdfWorker(){
  if (await localAssetAvailable(LOCAL_PDFJS_WORKER_URL)) return absoluteUrl(LOCAL_PDFJS_WORKER_URL);
  if (pdfWorkerObjectUrl) return pdfWorkerObjectUrl;
  try {
    pdfWorkerObjectUrl = await cachedBlobUrl(PDFJS_WORKER_URL);
    return pdfWorkerObjectUrl;
  } catch (_) {
    return PDFJS_WORKER_URL;
  }
}

async function ensurePdf(){
  if (!pdfPromise) {
    pdfPromise = loadScript(LOCAL_PDFJS_URL, PDFJS_URL, 'pdfjsLib').then(async pdfjsLib => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = await resolvePdfWorker();
      return pdfjsLib;
    }).catch(error => {
      pdfPromise = null;
      throw error;
    });
  }
  return pdfPromise;
}

async function ensureTesseract(){
  if (!tesseractPromise) {
    tesseractPromise = loadScript(LOCAL_TESSERACT_URL, TESSERACT_URL, 'Tesseract').catch(error => {
      tesseractPromise = null;
      throw error;
    });
  }
  return tesseractPromise;
}

async function resolveTesseractWorker(){
  if (await localAssetAvailable(LOCAL_TESSERACT_WORKER_URL)) {
    return { path:absoluteUrl(LOCAL_TESSERACT_WORKER_URL), blob:false };
  }
  if (tesseractWorkerObjectUrl) return { path:tesseractWorkerObjectUrl, blob:true };
  try {
    tesseractWorkerObjectUrl = await cachedBlobUrl(TESSERACT_WORKER_URL);
    return { path:tesseractWorkerObjectUrl, blob:true };
  } catch (_) {
    return { path:TESSERACT_WORKER_URL, blob:false };
  }
}

async function resolveCorePath(){
  const sentinel = `${LOCAL_TESSERACT_CORE_PATH}/tesseract-core.wasm.js`;
  return (await localAssetAvailable(sentinel)) ? absoluteUrl(LOCAL_TESSERACT_CORE_PATH) : TESSERACT_CORE_PATH;
}

async function resolveLangPath(){
  const sentinel = `${LOCAL_TESSERACT_LANG_PATH}/${OCR_LANGUAGE}.traineddata.gz`;
  return (await localAssetAvailable(sentinel)) ? absoluteUrl(LOCAL_TESSERACT_LANG_PATH) : TESSERACT_LANG_PATH;
}

function psmValue(Tesseract, key, fallback){
  return Tesseract?.PSM?.[key] ?? fallback;
}

async function configureWorker(worker, Tesseract, pageSegMode){
  await worker.setParameters({
    tessedit_pageseg_mode: pageSegMode,
    preserve_interword_spaces: '1',
    user_defined_dpi: OCR_DPI
  });
}

async function getOcrWorker(logger){
  currentLogger = typeof logger === 'function' ? logger : null;
  if (!workerPromise) {
    const Tesseract = await ensureTesseract();
    const oem = Tesseract?.OEM?.LSTM_ONLY ?? 1;
    const [workerSource, corePath, langPath] = await Promise.all([
      resolveTesseractWorker(),
      resolveCorePath(),
      resolveLangPath()
    ]);

    workerPromise = Tesseract.createWorker(OCR_LANGUAGE, oem, {
      workerPath: workerSource.path,
      workerBlobURL: !workerSource.blob,
      corePath,
      langPath,
      cachePath: OCR_CACHE_PATH,
      cacheMethod: 'write',
      gzip: true,
      logger: message => currentLogger?.(message),
      errorHandler: error => console.error('Tesseract worker:', error)
    }).then(async worker => {
      await configureWorker(worker, Tesseract, psmValue(Tesseract, 'AUTO', '3'));
      return worker;
    }).catch(error => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

function normalizedCandidate(result, pass){
  const rawText = result?.data?.text || '';
  const text = root.AIRomanianOCR?.normalizeRomanianText
    ? root.AIRomanianOCR.normalizeRomanianText(rawText)
    : rawText;
  const confidence = Number(result?.data?.confidence || 0);
  const score = root.AIRomanianOCR?.scoreCandidate
    ? root.AIRomanianOCR.scoreCandidate(text, confidence)
    : confidence;
  return { text, confidence, score, pass };
}

function scaledLogger(logger, offset, span){
  if (typeof logger !== 'function') return null;
  return message => {
    const copy = { ...message };
    if (copy.status === 'recognizing text' && Number.isFinite(copy.progress)) {
      copy.progress = Math.max(0, Math.min(1, offset + copy.progress * span));
    }
    logger(copy);
  };
}

async function recognizeDetailed(source, logger){
  const Tesseract = await ensureTesseract();
  const worker = await getOcrWorker(logger);
  const prepared = root.AIRomanianOCR?.preprocessSource
    ? await root.AIRomanianOCR.preprocessSource(source)
    : source;

  const autoMode = psmValue(Tesseract, 'AUTO', '3');
  const blockMode = psmValue(Tesseract, 'SINGLE_BLOCK', '6');

  await configureWorker(worker, Tesseract, autoMode);
  currentLogger = scaledLogger(logger, 0, 0.76);
  const first = normalizedCandidate(await worker.recognize(prepared, { rotateAuto: true }), 'auto');

  const retry = first.confidence < LOW_CONFIDENCE_THRESHOLD || first.text.length < 120 || first.score < 68;
  if (!retry) {
    currentLogger = typeof logger === 'function' ? logger : null;
    return { ...first, retried:false };
  }

  await configureWorker(worker, Tesseract, blockMode);
  currentLogger = scaledLogger(logger, 0.76, 0.24);
  const second = normalizedCandidate(await worker.recognize(prepared, { rotateAuto: true }), 'single-block');
  await configureWorker(worker, Tesseract, autoMode);
  currentLogger = typeof logger === 'function' ? logger : null;

  const best = second.score > first.score ? second : first;
  return { ...best, retried:true };
}

async function recognize(source, logger){
  return (await recognizeDetailed(source, logger)).text;
}

async function dependencyStatus(){
  const [pdfLocal, pdfWorkerLocal, tesseractLocal, workerLocal, coreLocal, langLocal] = await Promise.all([
    localAssetAvailable(LOCAL_PDFJS_URL),
    localAssetAvailable(LOCAL_PDFJS_WORKER_URL),
    localAssetAvailable(LOCAL_TESSERACT_URL),
    localAssetAvailable(LOCAL_TESSERACT_WORKER_URL),
    localAssetAvailable(`${LOCAL_TESSERACT_CORE_PATH}/tesseract-core.wasm.js`),
    localAssetAvailable(`${LOCAL_TESSERACT_LANG_PATH}/${OCR_LANGUAGE}.traineddata.gz`)
  ]);
  return {
    pdfLocal, pdfWorkerLocal, tesseractLocal, workerLocal, coreLocal, langLocal,
    cacheStorage: 'caches' in root,
    languageCache: OCR_CACHE_PATH
  };
}

async function terminateOcr(){
  currentLogger = null;
  if (workerPromise) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch (_) {
      // Resetarea trebuie să continue chiar dacă worker-ul era deja oprit.
    } finally {
      workerPromise = null;
    }
  }
}

function releaseDependencyObjectUrls(){
  for (const key of ['tesseractWorkerObjectUrl','pdfWorkerObjectUrl']) {
    const url = key === 'tesseractWorkerObjectUrl' ? tesseractWorkerObjectUrl : pdfWorkerObjectUrl;
    if (!url) continue;
    try { URL.revokeObjectURL(url); } catch (_) {}
    if (key === 'tesseractWorkerObjectUrl') tesseractWorkerObjectUrl = '';
    else pdfWorkerObjectUrl = '';
  }
}

function revokeConfirmation(message = 'Datele au fost modificate. Verifică din nou documentul și reconfirmă înainte de calcul.'){
  const confirmed = document.getElementById('confirmedData');
  const button = document.getElementById('calculateBtn');
  if (confirmed) confirmed.checked = false;
  if (button) button.disabled = true;
  document.getElementById('resultCard')?.classList.add('ai-hidden');
  if (message && document.getElementById('statusText')) document.getElementById('statusText').textContent = message;
}

function initReviewGuards(){
  const review = document.getElementById('reviewCard');
  const confirmed = document.getElementById('confirmedData');
  const calculate = document.getElementById('calculateBtn');
  const revokeFromEdit = event => {
    if (event.target?.id === 'confirmedData') return;
    if (confirmed?.checked) revokeConfirmation();
  };

  review?.addEventListener('input', revokeFromEdit);
  review?.addEventListener('change', revokeFromEdit);
  review?.addEventListener('click', event => {
    if (event.target.closest('#addPenaltyBtn,#addDeductionBtn,.p-remove,.d-remove')) revokeConfirmation();
  });

  document.getElementById('rawText')?.addEventListener('input', () => {
    if (!review?.classList.contains('ai-hidden')) {
      revokeConfirmation('Textul extras a fost modificat. Apasă „REANALIZEAZĂ TEXTUL” înainte de calcul.');
      review.classList.add('ai-hidden');
      document.getElementById('evidenceCard')?.classList.add('ai-hidden');
    }
  });

  const invalidateFiles = () => {
    revokeConfirmation('Selecția de documente s-a schimbat. Rulează din nou analiza.');
    review?.classList.add('ai-hidden');
    document.getElementById('evidenceCard')?.classList.add('ai-hidden');
  };
  document.getElementById('fileInput')?.addEventListener('change', invalidateFiles);
  document.getElementById('dropZone')?.addEventListener('drop', invalidateFiles);

  calculate?.addEventListener('click', event => {
    for (const [id, label] of [
      ['birthDate', 'Data nașterii'],
      ['startDate', 'Data începerii executării'],
      ['receivedDate', 'Data primirii în penitenciar/centru']
    ]) {
      const input = document.getElementById(id);
      const raw = input?.value.trim() || '';
      if (!raw || root.parseDate?.(raw)) continue;
      event.preventDefault();
      event.stopImmediatePropagation();
      const box = document.getElementById('calcError');
      if (box) {
        box.textContent = `${label}: dată invalidă. Folosește formatul zz.ll.aaaa.`;
        box.classList.remove('ai-hidden');
      }
      return;
    }
  }, true);
}

root.AIDocumentDependencies = {
  PDFJS_URL,
  PDFJS_WORKER_URL,
  TESSERACT_URL,
  TESSERACT_WORKER_URL,
  TESSERACT_CORE_PATH,
  TESSERACT_LANG_PATH,
  LOCAL_PDFJS_URL,
  LOCAL_PDFJS_WORKER_URL,
  LOCAL_TESSERACT_URL,
  LOCAL_TESSERACT_WORKER_URL,
  LOCAL_TESSERACT_CORE_PATH,
  LOCAL_TESSERACT_LANG_PATH,
  RESOURCE_CACHE,
  OCR_CACHE_PATH,
  OCR_LANGUAGE,
  OCR_DPI,
  ensurePdf,
  ensureTesseract,
  recognize,
  recognizeDetailed,
  dependencyStatus,
  terminateOcr,
  revokeConfirmation
};

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initReviewGuards, { once:true });
  window.addEventListener('pagehide', () => {
    void terminateOcr().finally(releaseDependencyObjectUrls);
  }, { once:true });
}
})(typeof window !== 'undefined' ? window : globalThis);
