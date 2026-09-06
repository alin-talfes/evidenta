(function(root){
'use strict';

const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';
const TESSERACT_LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0_best';
const OCR_LANGUAGE = 'ron';
const OCR_DPI = '300';
const LOW_CONFIDENCE_THRESHOLD = 78;

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
    workerPromise = Tesseract.createWorker(OCR_LANGUAGE, oem, {
      langPath: TESSERACT_LANG_PATH,
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

function normalizedCandidate(result){
  const rawText = result?.data?.text || '';
  const text = root.AIRomanianOCR?.normalizeRomanianText
    ? root.AIRomanianOCR.normalizeRomanianText(rawText)
    : rawText;
  const confidence = Number(result?.data?.confidence || 0);
  const score = root.AIRomanianOCR?.scoreCandidate
    ? root.AIRomanianOCR.scoreCandidate(text, confidence)
    : confidence;
  return { text, confidence, score };
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

async function recognize(source, logger){
  const Tesseract = await ensureTesseract();
  const worker = await getOcrWorker(logger);
  const prepared = root.AIRomanianOCR?.preprocessSource
    ? await root.AIRomanianOCR.preprocessSource(source)
    : source;

  const autoMode = psmValue(Tesseract, 'AUTO', '3');
  const blockMode = psmValue(Tesseract, 'SINGLE_BLOCK', '6');

  await configureWorker(worker, Tesseract, autoMode);
  currentLogger = scaledLogger(logger, 0, 0.76);
  const first = normalizedCandidate(await worker.recognize(prepared));

  const retry = first.confidence < LOW_CONFIDENCE_THRESHOLD || first.text.length < 120 || first.score < 68;
  if (!retry) {
    currentLogger = typeof logger === 'function' ? logger : null;
    return first.text;
  }

  await configureWorker(worker, Tesseract, blockMode);
  currentLogger = scaledLogger(logger, 0.76, 0.24);
  const second = normalizedCandidate(await worker.recognize(prepared));
  await configureWorker(worker, Tesseract, autoMode);
  currentLogger = typeof logger === 'function' ? logger : null;

  return second.score > first.score ? second.text : first.text;
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
  TESSERACT_LANG_PATH,
  OCR_LANGUAGE,
  OCR_DPI,
  ensurePdf,
  ensureTesseract,
  recognize,
  terminateOcr,
  revokeConfirmation
};

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initReviewGuards, { once:true });
  window.addEventListener('pagehide', () => { void terminateOcr(); }, { once:true });
}
})(typeof window !== 'undefined' ? window : globalThis);
