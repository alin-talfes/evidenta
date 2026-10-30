import fs from 'node:fs';
import assert from 'node:assert/strict';

const ai = fs.readFileSync('ai/index.html','utf8');
const pedepse = fs.readFileSync('index.html','utf8');
const contopiri = fs.readFileSync('contopiri/index.html','utf8');
const transfer = fs.readFileSync('transfer/index.html','utf8');
const uppercaseButtonStyles = [
  'css/style.css',
  'semnalmente/style.css',
  'instructaj/styles.css',
  'ofiter/styles.css'
].map(file => [file, fs.readFileSync(file,'utf8')]);
const officerCss = fs.readFileSync('ofiter/styles.css','utf8');
const instructajCss = fs.readFileSync('instructaj/styles.css','utf8');
const visualAuditCss = fs.readFileSync('css/visual-audit.css','utf8');

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
  assert.match(css, /visual-audit\\.css\\?v=4/, `${file}: trebuie să încarce stratul vizual comun v4.`);
}

assert.match(visualAuditCss, /text-transform:\\s*uppercase\\s*!important;/, 'Stratul vizual comun trebuie să normalizeze capitalizarea butoanelor.');
assert.doesNotMatch(instructajCss, /text-transform:\\s*none\\s*!important;/, 'Instructaj nu trebuie să anuleze capitalizarea comună a butoanelor.');
assert.doesNotMatch(officerCss, /text-transform:\\s*none\\s*!important;/, 'Ofițer nu trebuie să anuleze capitalizarea comună a butoanelor.');

console.log('Consistență UI: titluri, butoane AZI și capitalizarea comună a controalelor sunt verificate.');
