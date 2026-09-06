import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('ai/index.html');
const source = read('ai/source-preview.js');
const css = read('ai/source-preview.css');

assert.ok(html.includes('ai/source-preview.js'), 'Modulul AI trebuie să încarce controllerul de previzualizare sursă');
assert.ok(html.includes('ai/source-preview.css'), 'Modulul AI trebuie să încarce stilurile previzualizării sursă');
assert.ok(html.includes('VEZI SURSA'), 'UI-ul trebuie să explice accesul direct la documentul-sursă');
assert.ok(source.includes('AIDocumentDependencies?.ensurePdf'), 'Previzualizarea PDF trebuie să reutilizeze PDF.js lazy din modulul AI');
assert.ok(source.includes('URL.createObjectURL'), 'Imaginile originale trebuie previzualizate local, fără upload');
assert.ok(source.includes('MutationObserver'), 'Sursele generate dinamic trebuie decorate cu acțiunea de previzualizare');
assert.ok(source.includes('showModal'), 'Previzualizarea trebuie deschisă într-un dialog accesibil');
assert.ok(source.includes('page.render'), 'Pagina PDF indicată de proveniență trebuie redată efectiv');
assert.ok(css.includes('var(--ev-surface)') && css.includes('var(--ev-border)') && css.includes('var(--ev-accent-strong)'), 'Dialogul sursă trebuie să folosească design-system-ul comun');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Previzualizarea sursă trebuie să respecte reduced motion');

const context = { globalThis:null, window:undefined, document:{ addEventListener(){} }, console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename:'ai/source-preview.js' });
const parsed = context.AISourcePreview.parseSourceReference('mandat.pdf — pagina 7 · OCR 91% — Pedeapsa rezultantă de 4 ani.');
assert.equal(parsed.fileName, 'mandat.pdf');
assert.equal(parsed.kind, 'pdf-page');
assert.equal(parsed.page, 7);
const image = context.AISourcePreview.parseSourceReference('foto mandat.jpg — imagine · OCR 88% — Sentință penală.');
assert.equal(image.fileName, 'foto mandat.jpg');
assert.equal(image.kind, 'image');
assert.equal(context.AISourcePreview.parseSourceReference('Adăugat manual'), null);

console.log('AI source preview: proveniență document/pagină, PDF/image local și design-system verificate.');
