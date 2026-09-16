import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(here);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const source=read('js/deduction-ui.js');
const storage=read('js/storage.js');
const context={console,Date,Math,Number,String,Array,Object,Set,JSON,globalThis:null};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(read('js/utils.js'),context,{filename:'js/utils.js'});
vm.runInContext(read('js/rules.js'),context,{filename:'js/rules.js'});
vm.runInContext(source,context,{filename:'js/deduction-ui.js'});

const R=context.ManualDeductionRules;
const retentionStart=new Date(2025,1,12);
const retentionEnd=new Date(2025,1,13);
const preventiveEnd=new Date(2025,1,14);

assert.equal(R.calculateDays(R.TYPE_RETENTION_24H,retentionStart,retentionEnd),1,'Reținerea 24h trebuie să valoreze exact o zi');
assert.equal(R.calculateDays(R.TYPE_PREVENTIVE,retentionStart,retentionEnd),2,'Arestul preventiv 12-13 trebuie să valoreze două zile');
assert.equal(R.calculateDays(R.TYPE_HOUSE_ARREST,retentionStart,retentionEnd),2,'Arestul la domiciliu 12-13 trebuie să valoreze două zile');
assert.equal(R.calculateDays(R.TYPE_GENERIC,retentionStart,retentionEnd),2,'Perioada generică păstrează calculul inclusiv anterior');

const retentionInterval=R.getEffectiveInterval(R.TYPE_RETENTION_24H,retentionStart,retentionEnd);
const preventiveInterval=R.getEffectiveInterval(R.TYPE_PREVENTIVE,retentionEnd,preventiveEnd);
assert.equal(retentionInterval[0].getTime(),retentionInterval[1].getTime(),'Reținerea trebuie proiectată într-o singură zi efectivă pentru motor');
assert.equal(context.sumIntervals([retentionInterval,preventiveInterval]),3,'Reținere 12-13 + arest preventiv 13-14 trebuie să însumeze 3 zile');

assert(source.includes('class="ded-type"'),'Rândul de deducere trebuie să permită alegerea tipului');
assert(source.includes('Reținere 24 h — 1 zi'),'Opțiunea Reținere lipsește');
assert(source.includes('Arest preventiv'),'Opțiunea Arest preventiv lipsește');
assert(source.includes('Arest la domiciliu'),'Opțiunea Arest la domiciliu lipsește');
assert(source.includes("endWrap.classList.toggle('hidden', retention)"),'La reținere trebuie ascuns câmpul de sfârșit');
assert(source.includes('endInput.disabled = retention'),'La reținere câmpul de sfârșit trebuie dezactivat');
assert(source.includes('collectRows: collectTypedDedRows'),'API-ul deducerilor trebuie să expună colectarea tipizată');
assert(source.includes('syncRowsForCalculation'),'API-ul deducerilor trebuie să sincronizeze reținerea înainte de calcul');
assert(source.includes('enrichLastCalculation'),'API-ul deducerilor trebuie să expună îmbogățirea rezultatului explicit');
assert(source.includes('queueMicrotask(() => syncDeductionRow(r))'),'Sincronizarea după masca de dată trebuie făcută fără timer');
assert(!source.includes('bindCalculationLifecycle'),'Deducerile nu trebuie să intercepteze global butonul de calcul');
assert(!source.includes("closest('#calcBtn')"),'Deducerile nu trebuie să depindă de event delegation pentru calcul');
assert(!source.includes('setTimeout'),'Deducerile nu trebuie să folosească timere pentru sincronizarea calculului');
assert(!source.includes('root.collectStoredCaseData ='),'deduction-ui nu trebuie să suprascrie stocarea');
assert(!source.includes('root.populateStoredCase ='),'deduction-ui nu trebuie să suprascrie restaurarea spețelor');
assert(!source.includes('root.getInputData ='),'deduction-ui nu trebuie să suprascrie exportul');
assert(!source.includes('root.calculateAll ='),'deduction-ui nu trebuie să suprascrie motorul de calcul');

assert(storage.includes('ManualDeductionRules?.collectRows?.()'),'Storage trebuie să folosească direct API-ul deducerilor');
assert(storage.includes("type: r.type || 'generic'"),'Spețele legacy fără tip trebuie restaurate ca perioadă generică');
assert(storage.includes('addDedRow({'),'Restaurarea trebuie să transmită direct tipul și intervalul către addDedRow');

const index=read('index.html');
assert(index.includes('js/deduction-ui.js?v=2'),'Pedepse trebuie să încarce versiunea curentă a regulilor manuale de deducere');
assert(index.indexOf('js/deduction-ui.js?v=2')>index.indexOf('js/app.js?v=39'),'Regulile de deducere trebuie încărcate după motor, fără să îl suprascrie');

console.log('Pedepse manual: API explicit pentru deduceri, fără listener de calcul, monkey-patch sau timer; reținere 24h = 1 zi.');