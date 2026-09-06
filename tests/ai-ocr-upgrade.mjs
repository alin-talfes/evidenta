import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const ocrSource = read('ai/ocr-ro.js');
const coreSource = read('ai/core.js');
const safetySource = read('ai/safety.js');
const deps = read('ai/dependencies.js');
const app = read('ai/app.js');
const css = read('ai/styles.css');

const context = { console, Date, globalThis:null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(ocrSource, context, { filename:'ai/ocr-ro.js' });
vm.runInContext(coreSource, context, { filename:'ai/core.js' });
vm.runInContext(safetySource, context, { filename:'ai/safety.js' });

assert.equal(context.AIRomanianOCR.ROMANIAN_LANGUAGE, 'ron');
assert.equal(context.AIRomanianOCR.normalizeRomanianText('Şedinţă Ţară'), 'Ședință Țară');
assert.equal(context.AIRomanianOCR.normalizeDateLikeGlyphs('O1.O2.2O25'), '01.02.2025');
assert.equal(context.AIRomanianOCR.normalizeDateLikeGlyphs('l2/Ol/2O26'), '12/01/2026');
assert.equal(context.AIRomanianOCR.desiredScale(800, 1200) > 1, true);
assert.equal(context.AIRomanianOCR.desiredScale(4000, 3000) < 1, true);
assert.ok(typeof context.AIRomanianOCR.estimateSkewAngle === 'function', 'Deskew-ul trebuie expus pentru audit/test');
assert.ok(typeof context.AIRomanianOCR.rotateCanvas === 'function', 'Rotirea canvas-ului trebuie separată și auditabilă');

const sourceText = `[mandat.pdf — pagina 2 — OCR 67%]\nPedeapsa rezultantă de 4 ani închisoare. Data începerii executării: 12.02.2025. Art. 100 Cod penal.`;
const analyzed = context.AIDocumentSafety.analyze(sourceText);
assert.deepEqual(JSON.parse(JSON.stringify(analyzed.finalSentence)), { years:0, months:0, days:0 }, 'Pedeapsa finală din OCR slab nu trebuie auto-populată');
assert.equal(analyzed.startDate, '', 'Data de începere din OCR slab nu trebuie auto-populată');
assert.equal(analyzed.article, '', 'Articolul din OCR slab nu trebuie auto-populat');
assert.ok(analyzed.warnings.some(w => w.includes('NECESITĂ VERIFICARE NUMERICĂ')));
assert.ok(context.AIDocumentCore.pageContextAt(sourceText, sourceText.indexOf('Pedeapsa')).label.includes('mandat.pdf'));
assert.equal(context.AIDocumentCore.pageContextAt(sourceText, sourceText.indexOf('Pedeapsa')).ocrConfidence, 67);

const goodText = `[mandat.pdf — pagina 3 — OCR 93%]\nData începerii executării: 12.02.2025. Pedeapsa rezultantă de 4 ani închisoare. Art. 100 Cod penal.`;
const good = context.AIDocumentSafety.analyze(goodText);
assert.equal(good.startDate, '12.02.2025');
assert.deepEqual(JSON.parse(JSON.stringify(good.finalSentence)), { years:4, months:0, days:0 });
assert.equal(good.article, 'NCP100');
assert.ok(good.evidence.some(item => item.source.includes('mandat.pdf — pagina 3')));

assert.ok(deps.includes('rotateAuto: true'), 'Prima recunoaștere trebuie să permită auto-rotirea Tesseract');
assert.ok(deps.includes('recognizeDetailed'), 'OCR-ul trebuie să păstreze metadatele de încredere');
assert.ok(app.includes('OCR ${Math.round(result.confidence)}%'), 'Textul agregat trebuie să păstreze încrederea pe pagină');
assert.ok(app.includes('numeric-review-check'), 'Valorile numerice cu risc trebuie să ceară verificare explicită');
assert.ok(css.includes('.ai-needs-review'), 'CSS-ul trebuie să evidențieze rândurile cu risc OCR');
assert.ok(css.includes('var(--ev-warning)'), 'Stările de risc trebuie să folosească tokenii design-system-ului');

console.log('AI OCR upgrade: română, auto-rotate, deskew, context pe pagină și protecție numerică verificate.');
