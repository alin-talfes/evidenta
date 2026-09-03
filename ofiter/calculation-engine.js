(()=>{
  const view=document.getElementById("calculations");
  if(!view||document.getElementById("generated-calculation-lab"))return;

  const DAY=86400000;
  const asObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  state.generatedCalculationStats=asObject(state.generatedCalculationStats);

  const galatiSet=officialSets.find(set=>set.id==="anp2024");
  if(galatiSet&&/pragul legal actual este 65 de ani/i.test(galatiSet.legalNote||"")){
    galatiSet.legalNote=(galatiSet.legalNote||"").replace(/pragul legal actual este 65 de ani/i,"pragul legal actual pentru această fracție este 60 de ani");
  }

  const esc=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const pick=items=>items[rand(0,items.length-1)];
  const cloneDate=date=>new Date(date.getTime());
  const addDays=(date,days)=>new Date(date.getTime()+days*DAY);
  const iso=date=>date.toISOString().slice(0,10);
  const ro=date=>new Intl.DateTimeFormat("ro-RO",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(date);
  const parseISO=value=>new Date(`${value}T00:00:00Z`);
  const inclusiveDays=(from,to)=>Math.floor((to-from)/DAY)+1;

  function addCalendar(date,years=0,months=0,days=0){
    const totalMonths=(date.getUTCFullYear()+years)*12+date.getUTCMonth()+months;
    const year=Math.floor(totalMonths/12),month=((totalMonths%12)+12)%12;
    const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    const result=new Date(Date.UTC(year,month,Math.min(date.getUTCDate(),lastDay)));
    return addDays(result,days);
  }

  function sentenceEnd(start,duration){return addDays(addCalendar(start,duration.years,duration.months,duration.days),-1)}
  function durationOverYears(duration,years){if(duration.years!==years)return duration.years>years;return duration.months>0||duration.days>0}

  function excludedOn(date,periods=[]){
    const value=iso(date);
    return periods.some(period=>{
      if(period.type==="interruption")return value>period.from&&value<period.to;
      if(period.type==="escape")return value>=period.from&&value<period.to;
      return false;
    });
  }

  function dateForExecutedDays(start,targetDays,creditBefore=0,periods=[]){
    let needed=Math.max(0,targetDays-creditBefore);
    if(needed<=0)return cloneDate(start);
    let current=cloneDate(start),executed=0,guard=0;
    while(guard++<20000){
      if(!excludedOn(current,periods))executed++;
      if(executed>=needed)return current;
      current=addDays(current,1);
    }
    throw new Error("Calcul calendaristic depășit");
  }

  function fractionRules(duration){
    if(durationOverYears(duration,10))return {total:{n:3,d:4,label:"3/4"},minimum:{n:2,d:3,label:"2/3"}};
    return {total:{n:2,d:3,label:"2/3"},minimum:{n:1,d:2,label:"1/2"}};
  }

  function regimeFor(duration){
    if(durationOverYears(duration,13))return "maximă siguranță";
    if(durationOverYears(duration,3))return "închis";
    if(durationOverYears(duration,1))return "semideschis";
    return "deschis";
  }

  function baseStart(){return new Date(Date.UTC(rand(2019,2025),rand(0,11),rand(2,20)))}

  function fractionDuration(difficulty){
    if(difficulty==="intermediate")return pick([{years:10,months:0,days:0},{years:10,months:1,days:0},{years:9,months:11,days:0},{years:11,months:0,days:0}]);
    if(difficulty==="advanced"&&Math.random()<.35)return pick([{years:10,months:0,days:0},{years:10,months:1,days:0}]);
    const long=Math.random()<.32;
    return long?{years:rand(11,17),months:rand(0,11),days:0}:{years:rand(2,9),months:rand(0,11),days:0};
  }

  function regimeDuration(difficulty){
    if(difficulty==="intermediate")return pick([{years:1,months:0,days:0},{years:3,months:0,days:0},{years:13,months:0,days:0}]);
    if(difficulty==="advanced")return pick([{years:1,months:1,days:0},{years:3,months:1,days:0},{years:13,months:1,days:0},{years:14,months:0,days:0}]);
    const group=pick(["semi","closed","max"]);
    if(group==="semi")return {years:rand(1,2),months:rand(1,11),days:0};
    if(group==="closed")return {years:rand(4,12),months:rand(0,11),days:0};
    return {years:rand(14,18),months:rand(0,11),days:0};
  }

  const durationLabel=duration=>[duration.years?`${duration.years} ani`:"",duration.months?`${duration.months} luni`:"",duration.days?`${duration.days} zile`:""].filter(Boolean).join(" și ");

  function makeFractionCase(difficulty){
    const start=baseStart(),duration=fractionDuration(difficulty),theoreticalEnd=sentenceEnd(start,duration),totalDays=inclusiveDays(start,theoreticalEnd),rules=fractionRules(duration);
    const fractionDays=Math.floor(totalDays*rules.total.n/rules.total.d),minimumDays=Math.floor(totalDays*rules.minimum.n/rules.minimum.d);
    const caseData={id:`gen-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,kind:"fraction",difficulty,start:iso(start),duration,totalDays,theoreticalEnd:iso(theoreticalEnd),fraction:rules.total.label,fractionDays,minimumFraction:rules.minimum.label,minimumDays,deductionDays:0,gainedDays:0,periods:[]};

    if(difficulty==="intermediate")caseData.deductionDays=pick([20,30,45,60,75,90,120]);
    if(difficulty==="advanced"){
      if(Math.random()<.5){
        const gap=Math.max(1,fractionDays-minimumDays);
        caseData.gainedDays=Math.min(gap+rand(10,50),rand(Math.max(20,Math.floor(gap*.25)),Math.max(30,Math.floor(gap*1.15))));
      }else{
        const interruptionStart=addDays(start,rand(90,Math.min(300,Math.max(100,totalDays-120))));
        const interruptionReturn=addDays(interruptionStart,rand(6,18));
        if(interruptionReturn<theoreticalEnd)caseData.periods=[{type:"interruption",from:iso(interruptionStart),to:iso(interruptionReturn)}];
      }
    }

    const targetActual=caseData.gainedDays?Math.max(minimumDays,fractionDays-caseData.gainedDays):fractionDays;
    caseData.targetActualDays=targetActual;
    caseData.effectiveEnd=iso(dateForExecutedDays(start,totalDays,caseData.deductionDays,caseData.periods));
    caseData.fractionDate=iso(dateForExecutedDays(start,targetActual,caseData.deductionDays,caseData.periods));
    if(caseData.periods.length){const p=caseData.periods[0];caseData.excludedDays=Math.max(0,(parseISO(p.to)-parseISO(p.from))/DAY-1)}
    return caseData;
  }

  function makeRegimeCase(difficulty){
    const start=baseStart(),duration=regimeDuration(difficulty),theoreticalEnd=sentenceEnd(start,duration),totalDays=inclusiveDays(start,theoreticalEnd),fifthDays=Math.floor(totalDays/5);
    return {id:`gen-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,kind:"regime",difficulty,start:iso(start),duration,totalDays,theoreticalEnd:iso(theoreticalEnd),regime:regimeFor(duration),fifthDays,fifthDate:iso(dateForExecutedDays(start,fifthDays,0,[]))};
  }

  function makeCase(category,difficulty){if(category==="mixed")category=Math.random()<.68?"fraction":"regime";return category==="regime"?makeRegimeCase(difficulty):makeFractionCase(difficulty)}
  function persist(){try{if(typeof save==="function")save();else localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{try{localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{}}}

  const panel=document.createElement("section");
  panel.id="generated-calculation-lab";panel.className="generated-calculation-lab";
  const list=document.getElementById("calculation-list");
  view.insertBefore(panel,list||document.getElementById("calculation-workspace")||null);
  if(list&&!document.getElementById("official-calculation-heading")){
    const heading=document.createElement("div");heading.id="official-calculation-heading";heading.className="calculation-section-heading";
    heading.innerHTML='<p class="eyebrow">BAREME ANP</p><h2>Spețe oficiale de calibrare</h2><p>După antrenamentul generat, verifică și spețele publicate în baremele oficiale.</p>';
    list.before(heading);
  }

  let currentCase=state.generatedCalculationCase&&state.generatedCalculationCase.id?state.generatedCalculationCase:null;

  function field(name,label,type,options=[]){
    const control=type==="select"?`<select data-calc-field="${name}"><option value="">Alege…</option>${options.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join("")}</select>`:`<input data-calc-field="${name}" type="${type}" ${type==="number"?'inputmode="numeric" min="0" step="1"':""}>`;
    return `<label class="calc-answer-field" data-calc-wrap="${name}"><span>${esc(label)}</span>${control}<small data-calc-feedback="${name}"></small></label>`;
  }

  function factsMarkup(item){
    if(item.kind==="regime")return `<ul><li>Data începerii executării: <strong>${ro(parseISO(item.start))}</strong></li><li>Pedeapsa: <strong>${esc(durationLabel(item.duration))}</strong></li><li>Nu există factori excepționali care să determine un regim imediat inferior sau superior.</li></ul>`;
    const extra=[];
    if(item.deductionDays)extra.push(`<li>Se deduc <strong>${item.deductionDays} zile</strong> executate anterior punerii în executare.</li>`);
    if(item.gainedDays)extra.push(`<li>Există <strong>${item.gainedDays} zile considerate executate</strong>, eligibile și dobândite înainte de data propozabilă.</li>`);
    if(item.periods?.length){const p=item.periods[0];extra.push(`<li>Executarea este întreruptă din <strong>${ro(parseISO(p.from))}</strong> până la <strong>${ro(parseISO(p.to))}</strong>; ziua punerii în libertate și ziua revenirii sunt considerate executate.</li>`)}
    return `<ul><li>Data începerii executării: <strong>${ro(parseISO(item.start))}</strong></li><li>Pedeapsa: <strong>${esc(durationLabel(item.duration))}</strong></li>${extra.join("")}</ul>`;
  }

  function fieldsMarkup(item){
    if(item.kind==="regime")return [field("regime","Regimul inițial","select",["deschis","semideschis","închis","maximă siguranță"]),field("totalDays","Total zile pedeapsă","number"),field("fifthDays","1/5 din pedeapsă (zile)","number"),field("fifthDate","Data împlinirii unei cincimi","date")].join("");
    const fields=[field("totalDays","Total zile pedeapsă","number"),field("theoreticalEnd","Expirarea teoretică","date")];
    if(item.deductionDays||item.periods?.length)fields.push(field("effectiveEnd","Expirarea ajustată","date"));
    if(item.periods?.length)fields.push(field("excludedDays","Zile neconsiderate executate în întrerupere","number"));
    fields.push(field("fraction","Fracția totală aplicabilă","select",["1/2","2/3","3/4"]),field("fractionDays","Fracția totală în zile","number"));
    if(item.gainedDays)fields.push(field("minimumDays",`Minimul efectiv ${item.minimumFraction} (zile)`,"number"),field("targetActualDays","Zile efectiv necesare după zilele considerate executate","number"));
    fields.push(field("fractionDate","Data corespunzătoare fracției/propozabilei","date"));
    return fields.join("");
  }

  function ruleNotes(item){
    if(item.kind==="regime")return [
      "În lipsa factorilor excepționali, durata orientează regimul inițial: peste 13 ani — maximă siguranță; peste 3 și până la 13 ani — închis; peste 1 și până la 3 ani — semideschis; cel mult 1 an — deschis.",
      "Analiza pentru schimbarea regimului se face după executarea unei cincimi din durata pedepsei cu închisoarea; în exercițiu fracția în zile este trunchiată, fără rotunjire în sus."
    ];
    const notes=[
      "Totalul se calculează calendaristic, incluzând prima și ultima zi; luna și anul se împlinesc cu o zi înainte de data corespunzătoare.",
      "Fracția se calculează din totalul zilelor pedepsei și se trunchiază la numărul întreg de zile, fără rotunjire în sus."
    ];
    if(item.deductionDays)notes.push(`Cele ${item.deductionDays} zile deduse nu modifică totalul pedepsei folosit la fracție; ele modifică data la care creditul de executare atinge fracția.`);
    if(item.periods?.length)notes.push("La întrerupere, zilele dintre punerea în libertate și revenire nu sunt executate; cele două zile-limită sunt considerate executate.");
    if(item.gainedDays)notes.push(`Zilele considerate executate pot avansa propozabila numai până la minimul efectiv de ${item.minimumFraction}; surplusul nu poate coborî sub această limită.`);
    return notes;
  }

  const expected=(item,name)=>String(item[name]??"");

  function renderCase(){
    if(!currentCase)return renderHub();
    panel.innerHTML=`<div class="generated-calc-head"><div><p class="eyebrow">ANTRENAMENT GENERAT · PARTEA III</p><h2>${currentCase.kind==="regime"?"Regim și termen de reanalizare":"Pedeapsă, expirare și fracții"}</h2><p>Rezolvă fiecare etapă separat. Nu se cere memorarea numerelor articolelor.</p></div><button id="calc-new-case" class="secondary" type="button">Alte opțiuni</button></div><div class="generated-calc-facts"><strong>Datele speței</strong>${factsMarkup(currentCase)}</div><form id="generated-calc-form" class="generated-calc-form">${fieldsMarkup(currentCase)}<div class="generated-calc-actions"><button class="primary" type="submit">Verifică toate etapele</button><button id="calc-show-method" class="secondary" type="button">Arată metoda</button></div></form><section id="generated-calc-result" class="generated-calc-result hidden" aria-live="polite"></section>`;
    document.getElementById("calc-new-case").onclick=()=>{currentCase=null;state.generatedCalculationCase=null;persist();renderHub();panel.scrollIntoView({behavior:"smooth",block:"start"})};
    document.getElementById("calc-show-method").onclick=()=>showSolution(false);
    document.getElementById("generated-calc-form").onsubmit=event=>{event.preventDefault();checkCase()};
  }

  function renderHub(){
    const stats=state.generatedCalculationStats||{},attempts=Number(stats.attempts||0),accuracy=stats.totalFields?Math.round((stats.correctFields||0)/stats.totalFields*100):0;
    panel.innerHTML=`<div class="generated-calc-head"><div><p class="eyebrow">ANTRENAMENT GENERAT · PARTEA III</p><h2>Generator de spețe de calcul</h2><p>Spețe noi, construite numai pe reguli validate. Rezultatul este verificat etapă cu etapă.</p></div><div class="generated-calc-kpi"><strong>${attempts}</strong><span>spețe verificate</span><b>${attempts?`${accuracy}% acuratețe`:"fără istoric"}</b></div></div><div class="generated-calc-controls"><label>Tip<select id="calc-category"><option value="mixed">Mixt</option><option value="fraction">Pedeapsă + fracții</option><option value="regime">Regim + 1/5</option></select></label><label>Nivel<select id="calc-difficulty"><option value="basic">Bază</option><option value="intermediate">Intermediar</option><option value="advanced">Avansat</option></select></label><button id="calc-start" class="primary" type="button">Generează speța</button></div><div class="generated-calc-scope"><strong>Acoperire actuală</strong><span>durată calendaristică · deduceri anterioare · întrerupere · zile considerate executate · fracții · minim efectiv · regim inițial · 1/5</span><small>Cazurile de vârstă și evadare rămân momentan în seturile oficiale; nu sunt generate automat până la calibrarea completă a excepțiilor.</small></div>`;
    document.getElementById("calc-start").onclick=()=>newCase();
  }

  function newCase(){
    const category=document.getElementById("calc-category")?.value||"mixed",difficulty=document.getElementById("calc-difficulty")?.value||"basic";
    currentCase=makeCase(category,difficulty);state.generatedCalculationCase=currentCase;persist();renderCase();panel.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function answersFor(item){return item.kind==="regime"?["regime","totalDays","fifthDays","fifthDate"]:["totalDays","theoreticalEnd",...(item.deductionDays||item.periods?.length?["effectiveEnd"]:[]),...(item.periods?.length?["excludedDays"]:[]),"fraction","fractionDays",...(item.gainedDays?["minimumDays","targetActualDays"]:[]),"fractionDate"]}

  function checkCase(){
    const names=answersFor(currentCase);let correct=0;
    names.forEach(name=>{
      const input=document.querySelector(`[data-calc-field="${name}"]`),wrap=document.querySelector(`[data-calc-wrap="${name}"]`),feedback=document.querySelector(`[data-calc-feedback="${name}"]`);
      const actual=String(input?.value??"").trim(),wanted=expected(currentCase,name),ok=actual===wanted;
      if(ok)correct++;
      wrap?.classList.toggle("correct",ok);wrap?.classList.toggle("wrong",!ok);
      if(feedback)feedback.textContent=ok?"Corect":`Corect: ${name.toLowerCase().includes("date")||name.toLowerCase().includes("end")?ro(parseISO(wanted)):wanted}`;
    });
    const stats=state.generatedCalculationStats;stats.attempts=(Number(stats.attempts)||0)+1;stats.correctFields=(Number(stats.correctFields)||0)+correct;stats.totalFields=(Number(stats.totalFields)||0)+names.length;stats.best=Math.max(Number(stats.best)||0,Math.round(correct/names.length*100));stats.updated=new Date().toISOString();
    persist();showSolution(true,correct,names.length);try{if(typeof updateStreak==="function")updateStreak()}catch{}
  }

  function showSolution(scored=false,correct=0,total=0){
    const result=document.getElementById("generated-calc-result");if(!result)return;
    const labels={regime:"Regim inițial",totalDays:"Total zile",fifthDays:"1/5 în zile",fifthDate:"Data împlinirii 1/5",theoreticalEnd:"Expirare teoretică",effectiveEnd:"Expirare ajustată",excludedDays:"Zile neexecutate",fraction:"Fracție totală",fractionDays:"Fracție în zile",minimumDays:`Minim efectiv ${currentCase.minimumFraction||""}`,targetActualDays:"Zile efectiv necesare",fractionDate:"Data fracției/propozabilei"};
    const rows=answersFor(currentCase).map(name=>{const value=expected(currentCase,name),isDate=name.toLowerCase().includes("date")||name.toLowerCase().includes("end");return `<div><span>${esc(labels[name]||name)}</span><strong>${isDate?ro(parseISO(value)):esc(value)}</strong></div>`}).join("");
    result.classList.remove("hidden");
    result.innerHTML=`${scored?`<div class="generated-calc-score"><span>Rezultat</span><strong>${correct}/${total}</strong><b>${Math.round(correct/Math.max(1,total)*100)}%</b></div>`:""}<div class="generated-calc-solution-grid">${rows}</div><section class="generated-calc-method"><p class="eyebrow">METODA DE CONTROL</p><ol>${ruleNotes(currentCase).map(note=>`<li>${esc(note)}</li>`).join("")}</ol><p class="generated-calc-source">Surse de calibrare: Instrucțiunile de evidență OMJ 2188/C/2022, Codul penal și Legea nr. 254/2013. Numerele articolelor sunt omise intenționat din exercițiu.</p></section>`;
    result.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function selfTest(){
    const checks=[Math.floor(2404/2)===1202,Math.floor(2404*2/3)===1602,Math.floor(1278/2)===639,Math.floor(1278*2/3)===852,Math.floor(1975/5)===395,iso(sentenceEnd(new Date(Date.UTC(2019,10,2)),{years:6,months:7,days:0}))==="2026-06-01",inclusiveDays(new Date(Date.UTC(2019,10,2)),new Date(Date.UTC(2026,5,1)))===2404,iso(dateForExecutedDays(new Date(Date.UTC(2024,0,1)),15,0,[{type:"interruption",from:"2024-01-05",to:"2024-01-10"}]))==="2024-01-19"];
    if(!checks.every(Boolean))console.error("Calculation engine calibration failed",checks);
  }

  selfTest();currentCase?renderCase():renderHub();
})();