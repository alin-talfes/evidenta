(function(root){
'use strict';

const ROMANIAN_LANGUAGE = 'ron';
const MIN_LONG_EDGE = 1800;
const MAX_LONG_EDGE = 3400;
const LEGAL_TERMS = [
  'pedeaps', 'inchisoare', 'închisoare', 'condamn', 'execut', 'mandat',
  'sentin', 'deciz', 'arest', 'retin', 'rețin', 'deduc', 'penitenciar',
  'cod penal', 'definitiv', 'contop', 'liberare'
];

function normalizeDateLikeGlyphs(text){
  return String(text || '').replace(/\b[0-3OQIl|][0-9OQIl|]?[.\/-][0-1OQIl|][0-9OQIl|]?[.\/-][12OQIl|][0-9OQIl|]{3}\b/g, token => token
    .replace(/[OQ]/g, '0')
    .replace(/[Il|]/g, '1'));
}

function normalizeRomanianText(value){
  let text = String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00ad/g, '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFC')
    .replace(/Ş/g, 'Ș')
    .replace(/ş/g, 'ș')
    .replace(/Ţ/g, 'Ț')
    .replace(/ţ/g, 'ț');

  text = normalizeDateLikeGlyphs(text)
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\n[ ]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function fold(value){
  return normalizeRomanianText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function scoreCandidate(text, confidence = 0){
  const normalized = normalizeRomanianText(text);
  if (!normalized) return 0;

  const letters = (normalized.match(/[A-Za-zĂÂÎȘȚăâîșț]/g) || []).length;
  const strange = (normalized.match(/[�□■]/g) || []).length;
  const printableRatio = Math.min(1, letters / Math.max(1, normalized.length) * 1.9);
  const folded = fold(normalized);
  const legalHits = LEGAL_TERMS.reduce((count, term) => count + (folded.includes(fold(term)) ? 1 : 0), 0);
  const legalBonus = Math.min(12, legalHits * 1.5);
  const confidencePart = Math.max(0, Math.min(100, Number(confidence) || 0)) * 0.7;
  const structurePart = printableRatio * 22;
  const penalty = Math.min(24, strange * 6);
  return confidencePart + structurePart + legalBonus - penalty;
}

function percentile(histogram, total, ratio){
  const target = total * ratio;
  let seen = 0;
  for (let i = 0; i < histogram.length; i++) {
    seen += histogram[i];
    if (seen >= target) return i;
  }
  return histogram.length - 1;
}

function desiredScale(width, height){
  const longEdge = Math.max(width, height);
  if (!longEdge) return 1;
  if (longEdge < MIN_LONG_EDGE) return Math.min(2.5, MIN_LONG_EDGE / longEdge);
  if (longEdge > MAX_LONG_EDGE) return MAX_LONG_EDGE / longEdge;
  return 1;
}

function createCanvas(width, height){
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function enhanceCanvas(sourceCanvas){
  if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) return sourceCanvas;
  const scale = desiredScale(sourceCanvas.width, sourceCanvas.height);
  const canvas = createCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale);
  if (!canvas) return sourceCanvas;
  const ctx = canvas.getContext('2d', { willReadFrequently:true });
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  const histogram = new Uint32Array(256);
  let total = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]);
    histogram[gray] += 1;
    total += 1;
  }

  const low = percentile(histogram, total, 0.015);
  const high = percentile(histogram, total, 0.985);
  const spread = Math.max(55, high - low);
  const effectiveHigh = low + spread;

  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    const linear = Math.max(0, Math.min(1, (gray - low) / Math.max(1, effectiveHigh - low)));
    const corrected = Math.round(Math.pow(linear, 0.92) * 255);
    pixels[i] = corrected;
    pixels[i + 1] = corrected;
    pixels[i + 2] = corrected;
    pixels[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

async function sourceToCanvas(source){
  if (typeof document === 'undefined') return null;

  if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    const clone = createCanvas(source.width, source.height);
    const ctx = clone?.getContext('2d');
    if (!clone || !ctx) return source;
    ctx.drawImage(source, 0, 0);
    return clone;
  }

  if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
    const canvas = createCanvas(source.width, source.height);
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;
    ctx.drawImage(source, 0, 0);
    return canvas;
  }

  if (typeof Blob !== 'undefined' && source instanceof Blob && typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(source);
    try {
      const canvas = createCanvas(bitmap.width, bitmap.height);
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return null;
      ctx.drawImage(bitmap, 0, 0);
      return canvas;
    } finally {
      bitmap.close?.();
    }
  }

  return null;
}

async function preprocessSource(source){
  try {
    const canvas = await sourceToCanvas(source);
    return canvas ? enhanceCanvas(canvas) : source;
  } catch (error) {
    console.warn('Preprocesare OCR română indisponibilă; se folosește sursa originală.', error);
    return source;
  }
}

root.AIRomanianOCR = {
  ROMANIAN_LANGUAGE,
  MIN_LONG_EDGE,
  MAX_LONG_EDGE,
  normalizeRomanianText,
  normalizeDateLikeGlyphs,
  scoreCandidate,
  desiredScale,
  enhanceCanvas,
  preprocessSource
};
})(typeof window !== 'undefined' ? window : globalThis);
