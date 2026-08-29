const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(path,extra=''){ const ctx={console,Date,Math,Number,String,Array,Object,Set,JSON,globalThis:null}; ctx.globalThis=ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path,'utf8')+'\n'+extra,ctx,{filename:path}); return ctx; }
let u=load('js/utils.js',';globalThis.__add=addCalendarSafe;globalThis.__days=daysBetween;');
assert.equal(u.__add(new Date(2025,0,31),0,1,0).getDate(),28); assert.equal(u.__add(new Date(2024,1,29),1,0,0).getDate(),28);
let t=load('js/termene-core.js'); const T=t.TermeneCore;
assert.equal(T.orthodoxEasterSunday(2026).toISOString().slice(0,10),'2026-04-12'); assert(T.getRomanianPublicHolidays(2031).has('2031-12-25'));
let d=T.calculateDeadline({start:new Date(2014,3,15),duration:3,unit:'days',termType:'general'}); assert.equal(d.effectiveDeadline.getFullYear(),2014); assert.equal(d.effectiveDeadline.getMonth(),3); assert.equal(d.effectiveDeadline.getDate(),22);
let free=T.calculateDeadline({start:new Date(2026,5,8),duration:3,unit:'days',termType:'general'}); assert.equal(free.effectiveDeadline.getDate(),12);
let p=T.calculateDeadline({start:new Date(2026,0,10),duration:3,unit:'days',termType:'preventive'}); assert.equal(p.effectiveDeadline.getDate(),12);
let c=load('js/contopiri-core.js'); const C=c.ContopiriCore; assert.equal(C.toDays(1,0,0),360); assert.deepEqual(JSON.parse(JSON.stringify(C.fromDays(390))),{years:1,months:1,days:0});
let calc=C.calculate({concurs:[{totalDays:360,years:1,months:0,days:0},{totalDays:180,years:0,months:6,days:0}],recidiva:[],revocare:[{totalDays:30,years:0,months:1,days:0}]}); assert.equal(calc.finalDays,450); assert.deepEqual(JSON.parse(JSON.stringify(calc.finalDuration)),{years:1,months:3,days:0});
let tr=load('transfer/rules.js',';globalThis.__u=UNITATI;globalThis.__g=gasesteUnitati;'); assert(tr.__u.length>=39); assert.equal(new Set(tr.__u.map(x=>x.id)).size,tr.__u.length); assert(Array.isArray(tr.__g('masculin','major','inchis','Hunedoara','executare',false)));
for(const f of ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']){ const h=fs.readFileSync(f,'utf8'); assert(/^\s*<!DOCTYPE html>/i.test(h),f+' missing doctype'); assert(!/user-scalable=no/i.test(h),f+' disables zoom'); const inline=[...h.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)]; assert.equal(inline.length,0,f+' contains inline script'); }
const storage=fs.readFileSync('js/storage.js','utf8'); assert(!/function\s+(applyTheme|toggleTheme)\s*\(/.test(storage),'duplicate theme functions');
const css=fs.readFileSync('css/style.css','utf8'); assert(!/fonts\.googleapis\.com/.test(css),'external font import'); assert.equal((css.match(/\/\* ===== UNIVERSAL COMPONENT NORMALIZATION ===== \*\//g)||[]).length,1);
console.log('All audit regression tests passed.');
