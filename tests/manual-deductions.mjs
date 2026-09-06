import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(here);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const source=read('js/deduction-ui.js');
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
assert(source.includes('root.collectStoredCaseData'),'Tipul deducerii trebuie păstrat în spețele salvate/autosave');
assert(source.includes('root.populateStoredCase'),'Tipul deducerii trebuie restaurat la încărcarea speței');
assert(source.includes('root.calculateAll'),'Calculul manual trebuie pregătit cu intervalul efectiv înainte de motor');

const index=read('index.html');
assert(index.includes('js/deduction-ui.js?v=1'),'Pedepse trebuie să încarce regulile manuale de deducere');
assert(index.indexOf('js/deduction-ui.js?v=1')>index.indexOf('js/app.js?v=37'),'Regulile de deducere trebuie încărcate după modulele existente pentru a extinde comportamentul fără duplicarea motorului');

console.log('Pedepse manual: reținere 24h = 1 zi; arest preventiv și arest la domiciliu = interval inclusiv.');
