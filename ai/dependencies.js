(function(root){
'use strict';

const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';

let pdfPromise = null;
let tesseractPromise = null;
let workerPromise = null;
let currentLogger = null;

function loadScript(url, globalName){
  if (root[globalName]) return Promise.resolve(root[globalName]);
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === url);
    const script = existing || document.createElement('script');
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Încărcarea resursei externe a expirat: ${globalName}.`));
    }, 30000);
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (root[globalName]) resolve(root[globalName]);
      else reject(new Error(`Resursa ${globalName} s-a încărcat fără obiectul global așteptat.`));
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Nu s-a putut încărca ${globalName}. Verifică accesul la internet.`));
    };
    script.addEventListener('load', done, { once:true });
    script.addEventListener('error', fail, { once:true });
    if (!existing) {
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.dataset.aiExternalDependency = globalName;
      document.head.appendChild(script);
    }
  });
}

async function ensurePdf(){
  if (!pdfPromise) {
    pdfPromise = loadScript(PDFJS_URL, 'pdfjsLib').then(pdfjsLib => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
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
    tesseractPromise = loadScript(TESSERACT_URL, 'Tesseract').catch(error => {
      tesseractPromise = null;
      throw error;
    });
  }
  return tesseractPromise;
}

async function getOcrWorker(logger){
  currentLogger = typeof logger === 'function' ? logger : null;
  if (!workerPromise) {
    const Tesseract = await ensureTesseract();
    workerPromise = Tesseract.createWorker('ron', 1, {
      logger: message => currentLogger?.(message),
      errorHandler: error => console.error('Tesseract worker:', error)
    }).catch(error => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function recognize(source, logger){
  const worker = await getOcrWorker(logger);
  const result = await worker.recognize(source);
  return result?.data?.text || '';
}

async function terminateOcr(){
  currentLogger = null;
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch (_) {
    // Resetarea trebuie să continue chiar dacă worker-ul era deja oprit.
  } finally {
    workerPromise = null;
  }
}

root.AIDocumentDependencies = {
  PDFJS_URL,
  PDFJS_WORKER_URL,
  TESSERACT_URL,
  ensurePdf,
  ensureTesseract,
  recognize,
  terminateOcr
};

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { void terminateOcr(); }, { once:true });
}
})(typeof window !== 'undefined' ? window : globalThis);
