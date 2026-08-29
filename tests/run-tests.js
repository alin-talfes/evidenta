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
const css=fs.readFileSync('css/style.css','utf8');
assert(!/fonts\.googleapis\.com/.test(css),'external font import');
assert(!/UNIVERSAL COMPONENT NORMALIZATION/.test(css),'legacy normalization layer remains');
assert(css.includes('--bg: #0b1220;'),'dark palette missing');
assert(css.includes('--accent: #4f8cff;'),'accent palette missing');
assert(css.includes('body.light'),'light theme missing');
assert(!/#59e1c2|#ff8b99|#c7a8ff|#98600b|#b33248/i.test(css),'legacy hard-coded palette remains');

// Calibrare liberare condiționată: art. 99, schimbare la 60 ani, plafoane și suprapuneri.
let lr=load('js/utils.js',';'+fs.readFileSync('js/rules.js','utf8')+';globalThis.__schedule=calculateLiberationSchedule;globalThis.__over=findIntervalOverlaps;globalThis.__non=sumNonExecutedPeriods;');
let lifeStart=new Date(2026,7,29), lifeBirth=new Date(1980,0,1);
let lifeCalc=lr.__schedule({life:true,art:'NCP99',sentenceOver10:false,totalDays:7305,birthDate:lifeBirth,startDate:lifeStart,currentSex:'M',theorExp:null,dedDays:0,nonExecDays:0});
assert.equal(lifeCalc.mDays,7305); assert.equal(lifeCalc.tDays,7305); assert.equal(lifeCalc.mDate.getFullYear(),2046); assert.equal(lifeCalc.mDate.getMonth(),7); assert.equal(lifeCalc.mDate.getDate(),28);
let transitionStart=new Date(2026,0,1), transitionBirth=new Date(1968,0,1), transitionEnd=new Date(2030,11,31);
let transition=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1826,birthDate:transitionBirth,startDate:transitionStart,currentSex:'M',theorExp:transitionEnd,dedDays:0,nonExecDays:0});
assert.equal(transition.mDate.getFullYear(),2028); assert.equal(transition.mDate.getMonth(),0); assert.equal(transition.mDate.getDate(),1); assert.equal(transition.mR,1/3); assert(transition.ageTransitionApplied);
let already60=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1095,birthDate:new Date(1960,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,11,30),dedDays:0,nonExecDays:0}); assert.equal(already60.mR,1/3); assert.equal(already60.tR,1/2);
let over10=lr.__schedule({life:false,art:'NCP100',sentenceOver10:true,totalDays:9000,birthDate:new Date(1970,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2050,0,1),dedDays:0,nonExecDays:0}); assert(over10.mDays<=7305); assert(over10.tDays<=7305);
let ov=[[new Date(2026,0,1),new Date(2026,0,10)],[new Date(2026,0,5),new Date(2026,0,15)]]; assert.equal(lr.__over(ov).length,1); assert.equal(lr.sumIntervals?lr.sumIntervals(ov):15,15);
let nonRows=[{type:'escape',start:new Date(2026,0,1),end:new Date(2026,0,10)},{type:'interruption',start:new Date(2026,0,5),end:new Date(2026,0,12)}]; assert.equal(lr.__non(nonRows),10);

// Integritate UI pentru detențiunea pe viață: art. 99 este unic și zilele muncite nu se afișează pentru viață.
const appSource=fs.readFileSync('js/app.js','utf8');
assert(appSource.includes("life && art !== 'NCP99'"));
assert(appSource.includes("!life && art === 'NCP99'"));
assert(appSource.includes('if (!life) html += `<div class="result-section">'));
assert(appSource.includes("article.value = 'NCP99'")); assert(appSource.includes('article.disabled = true'));

// VCP: articolul rămâne neschimbat; se schimbă doar condițiile la pragul de vârstă (60 M / 55 F).
let vcpMale=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:2200,birthDate:new Date(1968,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2032,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpMale.mR,1/100); assert.equal(vcpMale.tR,1/3); assert(vcpMale.ageTransitionApplied); assert(vcpMale.articleInfo.includes('VCP art. 59'));
let vcpFemale=lr.__schedule({life:false,art:'VCP591',sentenceOver10:false,totalDays:1800,birthDate:new Date(1972,0,1),startDate:new Date(2026,0,1),currentSex:'F',theorExp:new Date(2031,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpFemale.mR,1/100); assert.equal(vcpFemale.tR,1/4); assert(vcpFemale.articleInfo.includes('VCP art. 59¹'));
let vcpYoung=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:900,birthDate:new Date(1985,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,5,1),dedDays:0,nonExecDays:0});
assert.equal(vcpYoung.mR,1/2); assert.equal(vcpYoung.tR,2/3); assert(!vcpYoung.ageTransitionApplied);
for(const f of ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']){ const h=fs.readFileSync(f,'utf8'); assert(/style\.css\?v=39/.test(h),f+' stale css cache version'); }

// Footer/versionare: toate paginile folosesc același version.js, iar numărul există numai în version.json.
const versionData=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(versionData.version,'0.168');
const versionSource=fs.readFileSync('js/version.js','utf8');
assert(versionSource.includes("new URL('../version.json', scriptUrl)"));
assert(versionSource.includes('© Alin Talfeș'));
assert(versionSource.includes('Toate datele sunt stocate exclusiv local'));
for(const f of ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']){
  const h=fs.readFileSync(f,'utf8');
  const expected=f.startsWith('transfer/')?'../js/version.js?v=38':'js/version.js?v=38';
  assert(h.includes(`src="${expected}"`),f+' missing centralized version.js');
  assert(!/Versiune\s+0\.168/.test(h),f+' hardcodes application version');
  assert(!/<footer\b/i.test(h),f+' contains duplicated static footer');
}
assert(!/0\.168/.test(versionSource),'version.js hardcodes the version number');

console.log('All audit regression tests passed.');
