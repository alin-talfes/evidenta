const fs=require('fs'),vm=require('vm'),assert=require('assert');
function load(...files){const ctx={console};vm.createContext(ctx);for(const f of files){const [p,extra='']=f.split(';');vm.runInContext(fs.readFileSync(p,'utf8')+extra,ctx);}return ctx;}

let u=load('js/utils.js',';globalThis.__parse=parseDate;globalThis.__fmt=fmtDate;globalThis.__add=addCalendarSafe;globalThis.__days=daysBetween;');
let d=u.__parse('31.01.2024'); assert(d && u.__fmt(d)==='31.01.2024');
assert.equal(u.__parse('31.02.2024'),null); assert.equal(u.__parse('1.1.2024'),null);
let jan31=new Date(2024,0,31); assert.equal(u.__fmt(u.__add(jan31,0,1,0)),'29.02.2024');
assert.equal(u.__days(new Date(2024,0,1),new Date(2024,0,2)),1);

let r=load('js/utils.js',';'+fs.readFileSync('js/rules.js','utf8')+';globalThis.__frac=getLiberationFractions;');
let total=3650,birth=new Date(1980,0,1),exp=new Date(2030,0,1);
let f=r.__frac(false,'NCP100','MAJOR',false,total,birth,exp); assert.equal(f.mR,1/3); assert.equal(f.tR,1/2);
f=r.__frac(false,'NCP100','MAJOR',false,total,new Date(1990,0,1),new Date(2028,0,1)); assert.equal(f.mR,1/2); assert.equal(f.tR,2/3);
f=r.__frac(false,'NCP100','MAJOR',true,10000,new Date(1990,0,1),new Date(2028,0,1)); assert(f.pM===7305 && f.pT===7305);
f=r.__frac(false,'VCP59','MAJOR',false,1000,birth,exp); assert.equal(f.mR,1/2); assert.equal(f.tR,2/3);
f=r.__frac(false,'VCP591','MAJOR',false,1000,birth,exp); assert.equal(f.mR,1/3); assert.equal(f.tR,1/2);
f=r.__frac(false,'VCP602','BATRAN',false,1000,birth,exp); assert.equal(f.mR,1/100); assert.equal(f.tR,1/3);
f=r.__frac(false,'VCP603','BATRAN',false,1000,birth,exp); assert.equal(f.mR,1/100); assert.equal(f.tR,1/4);
f=r.__frac(false,'PRE14059','MAJOR',false,1000,birth,exp); assert.equal(f.mR,1/3); assert.equal(f.tR,1/2);
f=r.__frac(false,'PRE14060','MAJOR',false,1000,birth,exp); assert.equal(f.mR,1/2); assert.equal(f.tR,2/3);
f=r.__frac(false,'PRE140604','BATRAN',false,1000,birth,exp); assert.equal(f.mR,1/100); assert.equal(f.tR,1/4);
f=r.__frac(true,'NCP99','MAJOR',false,7305,birth,null); assert.equal(f.mR,1/2); assert.equal(f.tR,1/2); assert.equal(f.pM,7305);
f=r.__frac(true,'VCP551','MAJOR',false,7305,birth,null); assert.equal(f.mR,1/2); assert.equal(f.tR,1/2); assert.equal(f.pM,7305); assert(f.articleInfo.includes('VCP art. 55¹'));

let lr=load('js/utils.js',';'+fs.readFileSync('js/rules.js','utf8')+';globalThis.__schedule=calculateLiberationSchedule;globalThis.__over=findIntervalOverlaps;globalThis.__non=sumNonExecutedPeriods;');
let lifeStart=new Date(2026,7,29), lifeBirth=new Date(1980,0,1);
let lifeCalc=lr.__schedule({life:true,art:'NCP99',sentenceOver10:false,totalDays:7305,birthDate:lifeBirth,startDate:lifeStart,currentSex:'M',theorExp:null,dedDays:0,nonExecDays:0});
assert.equal(lifeCalc.mDays,7305); assert.equal(lifeCalc.tDays,7305); assert.equal(lifeCalc.mDate.getFullYear(),2046); assert.equal(lifeCalc.mDate.getMonth(),7); assert.equal(lifeCalc.mDate.getDate(),28);
let vcpLife=lr.__schedule({life:true,art:'VCP551',sentenceOver10:false,totalDays:7305,birthDate:lifeBirth,startDate:lifeStart,currentSex:'M',theorExp:null,dedDays:0,nonExecDays:0});
assert.equal(vcpLife.mDays,7305); assert(vcpLife.articleInfo.includes('VCP art. 55¹'));

let transitionStart=new Date(2026,0,1), transitionBirth=new Date(1968,0,1), transitionEnd=new Date(2030,11,31);
let transition=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1826,birthDate:transitionBirth,startDate:transitionStart,currentSex:'M',theorExp:transitionEnd,dedDays:0,nonExecDays:0});
assert.equal(transition.mDate.getFullYear(),2028); assert.equal(transition.mDate.getMonth(),0); assert.equal(transition.mDate.getDate(),1); assert.equal(transition.mR,1/3); assert(transition.ageTransitionApplied);
assert(transition.workReductionFloorDate>=new Date(2028,0,1),'work-day reduction may cross the 60-year threshold');
let already60=lr.__schedule({life:false,art:'NCP100',sentenceOver10:false,totalDays:1095,birthDate:new Date(1960,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,11,30),dedDays:0,nonExecDays:0});
assert.equal(already60.mR,1/3); assert.equal(already60.tR,1/2);
let over10=lr.__schedule({life:false,art:'NCP100',sentenceOver10:true,totalDays:9000,birthDate:new Date(1970,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2050,0,1),dedDays:0,nonExecDays:0});
assert(over10.mDays<=7305); assert(over10.tDays<=7305);

let old59=lr.__schedule({life:false,art:'PRE14059',sentenceOver10:false,totalDays:1461,birthDate:new Date(1990,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2029,11,31),dedDays:0,nonExecDays:0});
assert.equal(old59.mR,1/3); assert.equal(old59.tR,1/2);
let old60=lr.__schedule({life:false,art:'PRE14060',sentenceOver10:false,totalDays:1461,birthDate:new Date(1990,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2029,11,31),dedDays:0,nonExecDays:0});
assert.equal(old60.mR,1/2); assert.equal(old60.tR,2/3);
let old604=lr.__schedule({life:false,art:'PRE140604',sentenceOver10:false,totalDays:1461,birthDate:new Date(1960,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2029,11,31),dedDays:0,nonExecDays:0});
assert.equal(old604.mR,1/100); assert.equal(old604.tR,1/4);

let ov=[[new Date(2026,0,1),new Date(2026,0,10)],[new Date(2026,0,5),new Date(2026,0,15)]];
assert.equal(lr.__over(ov).length,1); assert.equal(lr.sumIntervals?lr.sumIntervals(ov):21,21);
let nonRows=[{type:'escape',start:new Date(2026,0,1),end:new Date(2026,0,10)},{type:'interruption',start:new Date(2026,0,5),end:new Date(2026,0,12)}];
assert.equal(lr.__non(nonRows),15);

const appSource=fs.readFileSync('js/app.js','utf8');
assert(appSource.includes("new Set(['NCP99', 'VCP551'])"),'life article matrix missing VCP 55¹');
assert(appSource.includes('EDUCATIONAL_ARTICLES.has(art)'),'educational-measure guard missing');
assert(appSource.includes('else if (!isEducationalMeasure)'),'1/5 must not be applied automatically to NCP 124/125');
assert(appSource.includes('lastWorkReductionFloorDate'),'age/work-day floor missing');
assert(appSource.includes('quarantineEnd = new Date(prisonReceivedDate)'),'quarantine must be anchored to prison receipt date');
assert(appSource.includes("article.value = 'NCP99'"));
assert(appSource.includes('article.disabled = false'));

let vcpMale=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:2200,birthDate:new Date(1968,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2032,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpMale.mR,1/100); assert.equal(vcpMale.tR,1/3); assert(vcpMale.ageTransitionApplied); assert(vcpMale.articleInfo.includes('VCP art. 59'));
let vcpFemale=lr.__schedule({life:false,art:'VCP591',sentenceOver10:false,totalDays:1800,birthDate:new Date(1972,0,1),startDate:new Date(2026,0,1),currentSex:'F',theorExp:new Date(2031,0,1),dedDays:0,nonExecDays:0});
assert.equal(vcpFemale.mR,1/100); assert.equal(vcpFemale.tR,1/4); assert(vcpFemale.articleInfo.includes('VCP art. 59¹'));
let vcpYoung=lr.__schedule({life:false,art:'VCP59',sentenceOver10:false,totalDays:900,birthDate:new Date(1985,0,1),startDate:new Date(2026,0,1),currentSex:'M',theorExp:new Date(2028,5,1),dedDays:0,nonExecDays:0});
assert.equal(vcpYoung.mR,1/2); assert.equal(vcpYoung.tR,2/3); assert(!vcpYoung.ageTransitionApplied);

const indexSource=fs.readFileSync('index.html','utf8');
assert(/style\.css\?v=43/.test(indexSource),'index.html stale css cache version');
assert(/theme\.js\?v=40/.test(indexSource),'index.html stale theme cache version');
assert(/version\.js\?v=42/.test(indexSource),'index.html stale version cache version');
assert(/utils\.js\?v=36/.test(indexSource),'index.html stale utils cache version');
assert(/rules\.js\?v=37/.test(indexSource),'index.html stale rules cache version');
assert(/legal\.js\?v=36/.test(indexSource),'index.html stale legal cache version');
assert(/storage\.js\?v=37/.test(indexSource),'index.html stale storage cache version');
assert(/export\.js\?v=37/.test(indexSource),'index.html stale export cache version');
assert(/ui\.js\?v=37/.test(indexSource),'index.html stale ui cache version');
assert(/app\.js\?v=37/.test(indexSource),'index.html stale app cache version');
assert(!/rules\.js\?v=36/.test(indexSource),'index.html must not load stale rules v36');
assert(!/app\.js\?v=36/.test(indexSource),'index.html must not load stale app v36');

console.log('OK');
