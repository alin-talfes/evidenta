import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('ai/index.html');
const css = read('ai/styles.css');
const previewCss = read('ai/source-preview.css');

assert.ok(html.includes('ai-table-penalties'), 'Tabelul pedepselor trebuie să aibă stil mobil dedicat');
assert.ok(html.includes('ai-table-deductions'), 'Tabelul deducerilor trebuie să aibă stil mobil dedicat');
assert.ok(css.includes('@media (max-width:680px)'), 'AI trebuie să aibă breakpoint mobil');
assert.ok(css.includes('.ai-table-penalties thead') && css.includes('.ai-table-deductions thead'), 'Headerele tabelelor trebuie tratate explicit pe mobil');
assert.ok(css.includes('min-height:44px') || css.includes('min-height: 44px'), 'Controalele tactile trebuie să aibă minimum 44px');
assert.ok(css.includes('.ai-table-penalties td:nth-child(1)::before') && css.includes('content:"Ani"'), 'Cardurile mobile trebuie să păstreze etichetele câmpurilor de pedeapsă');
assert.ok(css.includes('.ai-table-deductions td:nth-child(1)::before') && css.includes('content:"Început"'), 'Cardurile mobile trebuie să păstreze etichetele deducerilor');
assert.ok(previewCss.includes('100dvh'), 'Previzualizarea sursei trebuie să folosească viewport dinamic pe mobil');
assert.ok(previewCss.includes('env(safe-area-inset-bottom'), 'Dialogul mobil trebuie să respecte safe-area iOS');
assert.ok(!html.includes('Dependențele OCR/PDF sunt încărcate local-first'), 'Detaliile tehnice despre cache nu trebuie afișate în fluxul principal');
assert.ok(!html.includes('Diacriticele românești vechi cu sedilă'), 'Detaliile interne de normalizare OCR nu trebuie afișate în fluxul principal');

console.log('AI mobile-first: carduri fără scroll lateral, touch targets, safe-area și text redus.');
