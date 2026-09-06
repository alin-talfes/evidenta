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
const safetySource = read('ai/safety.js');
const deps = read('ai/dependencies.js');
const dateMaskSource = read('ai/date-mask.js');
const deductionRulesSource = read('ai/deduction-rules.js');

assert.match(html, /^<!DOCTYPE html>/i);
assert.ok(html.includes('ALPHA'), 'Modulul AI trebuie marcat vizibil ALPHA');
assert.ok(html.includes('application/pdf'), 'Upload-ul trebuie să accepte PDF');
assert.ok(html.includes('image/png') && html.includes('image/jpeg'), 'Upload-ul trebuie limitat la imagini raster suportate');
assert.ok(html.includes('id="confirmedData"'), 'Confirmarea verificării umane lipsește');
assert.ok(html.includes('id="calculateBtn" disabled'), 'Calculul ALPHA trebuie blocat înainte de confirmare');
assert.ok(!html.includes('<script src="https://'), 'Dependențele externe nu trebuie încărcate la simpla deschidere a paginii');
assert.ok(html.includes('ai/dependencies.js') && html.includes('ai/safety.js'), 'Straturile de siguranță/dependențe lipsesc');
assert.ok(html.includes('ai/date-mask.js'), 'Masca de dată comună modulului AI trebuie încărcată');
assert.ok(html.includes('ai/deduction-rules.js'), 'Regulile speciale pentru măsurile preventive trebuie încărcate');
assert.ok(html.includes('Reținere de 24 de ore') || html.includes('reținere de 24 de ore'), 'UI trebuie să explice regula reținerii de 24 de ore');
assert.ok((html.match(/class="date-masked"/g) || []).length >= 3, 'Câmpurile statice de dată trebuie marcate date-masked');
assert.ok(app.includes('ContopiriCore.calculate'), 'AI trebuie să reutilizeze motorul Contopiri');
assert.ok(app.includes('calculateLiberationSchedule'), 'AI trebuie să reutilizeze motorul Pedepse/LC');
assert.ok(app.includes('sumIntervals'), 'Deducerile trebuie calculate cu funcția comună');
assert.ok(app.includes('AIDocumentDependencies.ensurePdf'), 'PDF.js trebuie încărcat lazy');
assert.ok(app.includes('AIDocumentDependencies.recognize'), 'OCR trebuie executat prin worker-ul reutilizabil');
assert.ok(app.includes('Confirmă că ai verificat datele'), 'Calculul trebuie să ceară confirmare explicită');
assert.ok(app.includes('sfârșitul nu poate preceda începutul'), 'Deducerile inversate trebuie respinse explicit');
assert.ok(deps.includes("tesseract.js@7.0.0"), 'Tesseract trebuie fixat la o versiune exactă');
assert.ok(deps.includes('createWorker'), 'OCR trebuie să reutilizeze un worker Tesseract');
assert.ok(deps.includes('terminateOcr'), 'Worker-ul OCR trebuie eliberat la reset/ieșire');
assert.ok(deps.includes('revokeConfirmation'), 'Editarea datelor trebuie să revoce confirmarea umană');
assert.ok(deps.includes('Textul extras a fost modificat'), 'Modificarea textului trebuie să invalideze analiza anterioară');
assert.ok(deps.includes('dată invalidă. Folosește formatul'), 'Datele manuale invalide trebuie blocate înainte de calcul');
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'AI nu trebuie să conțină script inline');

const context = { console, Date, globalThis:null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(coreSource, context, { filename:'ai/core.js' });
vm.runInContext(safetySource, context, { filename:'ai/safety.js' });
vm.runInContext(dateMaskSource, context, { filename:'ai/date-mask.js' });
vm.runInContext(deductionRulesSource, context, { filename:'ai/deduction-rules.js' });

assert.equal(context.AIDateMask.formatDateValue('01012026'), '01.01.2026');
assert.equal(context.AIDateMask.formatDateValue('01.01.2026'), '01.01.2026');
assert.equal(context.AIDateMask.formatDateValue('010'), '01.0');
assert.equal(context.AIDateMask.formatDateValue('ab01-01/2026xyz'), '01.01.2026');
assert.equal(context.AIDateMask.formatDateValue('010120261234'), '01.01.2026');

assert.equal(context.AIDeductionRules.inferTypeFromSource('Se deduce reținerea de 24 de ore de la 12.02.2025 până la 13.02.2025.'), 'retention24h');
assert.equal(context.AIDeductionRules.inferTypeFromSource('Se deduce arestul preventiv de la 12.02.2025 până la 13.02.2025.'), 'preventive');
assert.equal(context.AIDeductionRules.deductionDays('retention24h', '12.02.2025', '13.02.2025'), 1, 'Reținerea de 24h care traversează două date trebuie să însemne o singură zi');
assert.equal(context.AIDeductionRules.deductionDays('preventive', '12.02.2025', '13.02.2025'), 2, 'Arestul preventiv păstrează ambele capete incluse');
assert.equal(context.AIDeductionRules.deductionDays('generic', '12.02.2025', '13.02.2025'), 2, 'Deducerea generică rămâne inclusivă');
assert.equal(context.AIDeductionRules.deductionDays('retention24h', '12.02.2025', '14.02.2025'), null, 'O reținere de 24h nu poate acoperi trei date calendaristice');

const sample = `Mandat de executare nr. 123/2026. Condamnat născut la data de 04.05.2001. Data începerii executării: 17.06.2026. Primit în penitenciar la data de 18.06.2026. În baza art. 39 se contopesc pedepsele. Condamnă la pedeapsa de 3 ani închisoare. Condamnă la pedeapsa de 2 ani închisoare. Va executa în final pedeapsa rezultantă de 3 ani și 8 luni închisoare. Se deduce perioada de la 01.01.2026 la 16.06.2026. Art. 100 Cod penal.`;
const parsed = context.AIDocumentSafety.analyze(sample);
assert.equal(parsed.birthDate, '04.05.2001');
assert.equal(parsed.startDate, '17.06.2026');
assert.equal(parsed.receivedDate, '18.06.2026');
assert.equal(parsed.article, 'NCP100');
assert.deepEqual(JSON.parse(JSON.stringify(parsed.finalSentence)), { years:3, months:8, days:0 });
assert.equal(parsed.penalties.length, 2);
assert.deepEqual(JSON.parse(JSON.stringify(parsed.penalties.map(p => p.group))), ['concurs','concurs']);
assert.deepEqual(JSON.parse(JSON.stringify(parsed.deductions[0])), { start:'01.01.2026', end:'16.06.2026', confidence:'ridicat', source:parsed.deductions[0].source });
assert.ok(parsed.documentTypes.includes('MEPI/mandat'));

const conflicting = context.AIDocumentSafety.analyze(`Data nașterii: 04.05.2001. Data nașterii: 05.05.2001. Data începerii executării: 01.01.2026. Va executa în final pedeapsa rezultantă de 3 ani. Pedeapsa rezultantă de 4 ani. Art. 100 Cod penal. Art. 99 Cod penal.`);
assert.equal(conflicting.birthDate, '', 'Datele de naștere contradictorii nu trebuie auto-selectate');
assert.deepEqual(JSON.parse(JSON.stringify(conflicting.finalSentence)), { years:0, months:0, days:0 }, 'Pedepsele finale contradictorii nu trebuie auto-selectate');
assert.equal(conflicting.article, '', 'Articolele contradictorii nu trebuie auto-selectate');
assert.ok(conflicting.warnings.some(w => w.includes('CONFLICT')));

console.log('AI Documente ALPHA: lazy-load, mască zz.ll.aaaa, reținere 24h=1 zi, arest preventiv inclusiv, validare umană, conflicte și motoare verificate.');
