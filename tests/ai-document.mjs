import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('ai/index.html');
const app = read('ai/app.js');
const coreSource = read('ai/core.js');

assert.match(html, /^<!DOCTYPE html>/i);
assert.ok(html.includes('ALPHA'), 'Modulul AI trebuie marcat vizibil ALPHA');
assert.ok(html.includes('application/pdf,image/*'), 'Upload-ul trebuie să accepte PDF și imagini');
assert.ok(html.includes('tesseract.js'), 'OCR Tesseract lipsește');
assert.ok(html.includes('pdf.js'), 'PDF.js lipsește');
assert.ok(app.includes('ContopiriCore.calculate'), 'AI trebuie să reutilizeze motorul Contopiri');
assert.ok(app.includes('calculateLiberationSchedule'), 'AI trebuie să reutilizeze motorul Pedepse/LC');
assert.ok(app.includes('sumIntervals'), 'Deducerile trebuie calculate cu funcția comună');
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'AI nu trebuie să conțină script inline');

const context = { console, Date, globalThis:null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(coreSource, context, { filename:'ai/core.js' });
const sample = `Mandat de executare nr. 123/2026. Condamnat născut la data de 04.05.2001. Data începerii executării: 17.06.2026. În baza art. 39 se contopesc pedepsele. Condamnă la pedeapsa de 3 ani închisoare. Condamnă la pedeapsa de 2 ani închisoare. Va executa în final pedeapsa rezultantă de 3 ani și 8 luni închisoare. Se deduce perioada de la 01.01.2026 la 16.06.2026. Art. 100 Cod penal.`;
const parsed = context.AIDocumentCore.analyzeDocument(sample);
assert.equal(parsed.birthDate, '04.05.2001');
assert.equal(parsed.startDate, '17.06.2026');
assert.equal(parsed.article, 'NCP100');
assert.deepEqual(JSON.parse(JSON.stringify(parsed.finalSentence)), { years:3, months:8, days:0 });
assert.equal(parsed.penalties.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(parsed.penalties.map(p => p.group))), ['concurs','concurs']);
assert.deepEqual(JSON.parse(JSON.stringify(parsed.deductions[0])), { start:'01.01.2026', end:'16.06.2026', confidence:'ridicat', source:parsed.deductions[0].source });

console.log('AI Documente ALPHA: structură, parser și reutilizarea motoarelor verificate.');
