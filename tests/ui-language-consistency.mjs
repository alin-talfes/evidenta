import fs from 'node:fs';
import assert from 'node:assert/strict';

const ai = fs.readFileSync('ai/index.html','utf8');
const pedepse = fs.readFileSync('index.html','utf8');
const contopiri = fs.readFileSync('contopiri/index.html','utf8');
const transfer = fs.readFileSync('transfer/index.html','utf8');
const buttonStyles = [
  'css/style.css',
  'ofiter/styles.css',
  'semnalmente/style.css'
].map(file => [file, fs.readFileSync(file,'utf8')]);

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

for (const [file, css] of buttonStyles) {
  assert.match(css, /:where\([\s\S]*?button,[\s\S]*?a\.btn,[\s\S]*?\.btn,[\s\S]*?\.toggle-btn,[\s\S]*?\.access-submit[\s\S]*?\)\s*\{/, `${file}: lipsește selectorul comun extins pentru controalele tip buton.`);
  assert.match(css, /text-transform:\s*uppercase\s*!important;/, `${file}: butoanele nu sunt forțate la majuscule.`);
}

console.log('Consistență UI: titluri, numerotare, butoane AZI și controalele tip buton din modulele operaționale sunt verificate cu majuscule.');
