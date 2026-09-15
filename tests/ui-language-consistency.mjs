import fs from 'node:fs';
import assert from 'node:assert/strict';

const ai = fs.readFileSync('ai/index.html','utf8');
const pedepse = fs.readFileSync('index.html','utf8');
const contopiri = fs.readFileSync('contopiri/index.html','utf8');
const transfer = fs.readFileSync('transfer/index.html','utf8');
const uppercaseButtonStyles = [
  'css/style.css',
  'semnalmente/style.css'
].map(file => [file, fs.readFileSync(file,'utf8')]);
const officerCss = fs.readFileSync('ofiter/styles.css','utf8');

assert.match(ai, /<h2 id="upload-title">ÎNCARCĂ DOCUMENTUL<\/h2>/);
assert.match(ai, /<h2 id="text-title">TEXT EXTRAS<\/h2>/);
assert.match(ai, /<h2 id="review-title">VERIFICĂ DATELE<\/h2>/);
assert.match(ai, /<h2 id="result-title">REZULTAT<\/h2>/);
assert.doesNotMatch(ai, /<h[1-6][^>]*>\s*\d+\.\s/);
assert.equal((ai.match(/data-ai-today=/g) || []).length, 2, 'AI trebuie să aibă exact două butoane AZI operaționale.');
assert.match(ai, /data-ai-today="startDate"[^>]*>AZI<\/button>/);
assert.match(ai, /data-ai-today="receivedDate"[^>]*>AZI<\/button>/);
assert.match(ai, /<label for="article">ALGORITM LIBERARE CONDIȚIONATĂ<\/label>/);
assert.match(pedepse, /<label for="liberationArticle">ALGORITM LIBERARE CONDIȚIONATĂ<\/label>/);
assert.match(contopiri, /<h3>ADAUGĂ PEDEPSE<\/h3>/);
assert.match(transfer, /<h3>CRITERII DE CĂUTARE<\/h3>/);

for (const [file, css] of uppercaseButtonStyles) {
  assert.match(css, /:where\([\s\S]*?button,[\s\S]*?a\.btn,[\s\S]*?\.btn,[\s\S]*?\.toggle-btn,[\s\S]*?\.access-submit[\s\S]*?\)\s*\{/, `${file}: lipsește selectorul comun extins pentru controalele tip buton.`);
  assert.match(css, /text-transform:\s*uppercase\s*!important;/, `${file}: butoanele operaționale nu sunt forțate la majuscule.`);
}

assert.match(officerCss, /:where\([\s\S]*?button,[\s\S]*?a\.btn,[\s\S]*?\.btn,[\s\S]*?\.toggle-btn,[\s\S]*?\.access-submit[\s\S]*?\)\s*\{/, 'ofiter/styles.css: lipsește selectorul comun pentru controalele tip buton.');
assert.match(officerCss, /text-transform:\s*none\s*!important;/, 'ofiter/styles.css: modulul de studiu trebuie să păstreze capitalizarea naturală a textului.');

console.log('Consistență UI: titluri, butoane AZI și capitalizarea intenționată pe fiecare modul sunt verificate.');
