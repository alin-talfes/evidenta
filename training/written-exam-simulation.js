(()=>{
  const examView=document.getElementById("exam");
  if(!examView||document.getElementById("full-written-exam"))return;

  const DAY=86400000;
  const SYNTHESIS_INTERVALS=[1,3,7,14,30,60];
  const esc=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const tokens=value=>normalize(value).split(/\s+/).filter(Boolean);
  const rand=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
  const pick=items=>items[rand(0,items.length-1)];
  const shuffle=items=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=rand(0,i);[result[i],result[j]]=[result[j],result[i]]}return result};
  const addDays=(date,days)=>new Date(date.getTime()+days*DAY);
  const parseISO=value=>new Date(`${value}T00:00:00Z`);
  const iso=date=>date.toISOString().slice(0,10);
  const ro=date=>new Intl.DateTimeFormat("ro-RO",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(date);
  const inclusiveDays=(from,to)=>Math.floor((to-from)/DAY)+1;
  const asObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};

  state.fullWrittenExamHistory=Array.isArray(state.fullWrittenExamHistory)?state.fullWrittenExamHistory:[];
  state.synthesisResults=asObject(state.synthesisResults);
  state.omjSynthesisResults=asObject(state.omjSynthesisResults);
  state.synthesisReviewSchedule=asObject(state.synthesisReviewSchedule);
  state.calculationSkillStats=asObject(state.calculationSkillStats);
  state.calculationFieldStats=asObject(state.calculationFieldStats);

  function addCalendar(date,years=0,months=0,days=0){
    const totalMonths=(date.getUTCFullYear()+years)*12+date.getUTCMonth()+months;
    const year=Math.floor(totalMonths/12),month=((totalMonths%12)+12)%12;
    const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    return addDays(new Date(Date.UTC(year,month,Math.min(date.getUTCDate(),lastDay))),days);
  }
  const sentenceEnd=(start,duration)=>addDays(addCalendar(start,duration.years,duration.months,duration.days),-1);
  const durationOverYears=(duration,years)=>duration.years!==years?duration.years>years:duration.months>0||duration.days>0;
  const durationLabel=duration=>[duration.years?`${duration.years} ani`:"",duration.months?`${duration.months} luni`:"",duration.days?`${duration.days} zile`:""].filter(Boolean).join(" și ");

  function excludedOn(date,periods=[]){
    const value=iso(date);
    return periods.some(period=>period.type==="interruption"?value>period.from&&value<period.to:false);
  }
  function dateForExecutedDays(start,targetDays,creditBefore=0,periods=[]){
    let needed=Math.max(0,targetDays-creditBefore);
    if(needed<=0)return new Date(start.getTime());
    let current=new Date(start.getTime()),executed=0,guard=0;
    while(guard++<25000){
      if(!excludedOn(current,periods))executed++;
      if(executed>=needed)return current;
      current=addDays(current,1);
    }
    throw new Error("Calcul calendaristic depășit");
  }
  const fractionRules=duration=>durationOverYears(duration,10)?{total:{n:3,d:4,label:"3/4"},minimum:{n:2,d:3,label:"2/3"}}:{total:{n:2,d:3,label:"2/3"},minimum:{n:1,d:2,label:"1/2"}};
  const regimeFor=duration=>durationOverYears(duration,13)?"maximă siguranță":durationOverYears(duration,3)?"închis":durationOverYears(duration,1)?"semideschis":"deschis";
  const baseStart=()=>new Date(Date.UTC(rand(2020,2025),rand(0,11),rand(2,20)));

  function makeRegimeCase(){
    const start=baseStart(),duration=pick([{years:1,months:0,days:0},{years:3,months:0,days:0},{years:3,months:1,days:0},{years:13,months:0,days:0},{years:13,months:1,days:0},{years:14,months:2,days:0}]);
    const end=sentenceEnd(start,duration),totalDays=inclusiveDays(start,end),fifthDays=Math.floor(totalDays/5);
    return {kind:"regime",variant:"regime",start:iso(start),duration,totalDays,theoreticalEnd:iso(end),regime:regimeFor(duration),fifthDays,fifthDate:iso(dateForExecutedDays(start,fifthDays))};
  }

  function fractionVariantWeakness(variant){
    const rows=state.fullWrittenExamHistory.filter(item=>item.calcKind==="fraction"&&item.calcVariant===variant);
    if(!rows.length)return 55+Math.random()*8;
    const avg=rows.reduce((sum,item)=>sum+Number(item.calcPct||0),0)/rows.length;
    return 100-avg+Math.random()*3;
  }
  function chooseFractionVariant(adaptive){
    const variants=["plain","deduction","gained","interruption"];
    if(!adaptive)return pick(variants);
    return variants.map(variant=>({variant,score:fractionVariantWeakness(variant)})).sort((a,b)=>b.score-a.score)[0].variant;
  }
  function makeFractionCase(adaptive=false){
    const start=baseStart(),duration=pick([{years:5,months:5,days:0},{years:6,months:7,days:0},{years:9,months:11,days:0},{years:10,months:0,days:0},{years:10,months:1,days:0},{years:12,months:6,days:0}]);
    const end=sentenceEnd(start,duration),totalDays=inclusiveDays(start,end),rules=fractionRules(duration),fractionDays=Math.floor(totalDays*rules.total.n/rules.total.d),minimumDays=Math.floor(totalDays*rules.minimum.n/rules.minimum.d);
    const variant=chooseFractionVariant(adaptive),item={kind:"fraction",variant,start:iso(start),duration,totalDays,theoreticalEnd:iso(end),fraction:rules.total.label,fractionDays,minimumFraction:rules.minimum.label,minimumDays,deductionDays:0,gainedDays:0,periods:[]};
    if(variant==="deduction")item.deductionDays=pick([30,45,60,75,90]);
    if(variant==="gained"){
      const gap=Math.max(1,fractionDays-minimumDays);
      item.gainedDays=Math.random()<.5?rand(Math.max(10,Math.floor(gap*.2)),Math.max(20,Math.floor(gap*.8))):gap+rand(5,60);
    }
    if(variant==="interruption"){
      const pStart=addDays(start,rand(100,Math.min(350,Math.max(120,totalDays-150)))),pReturn=addDays(pStart,rand(7,18));
      if(pReturn<end)item.periods=[{type:"interruption",from:iso(pStart),to:iso(pReturn)}];
      else item.variant="plain";
    }
    item.targetActualDays=item.gainedDays?Math.max(minimumDays,fractionDays-item.gainedDays):fractionDays;
    item.effectiveEnd=iso(dateForExecutedDays(start,totalDays,item.deductionDays,item.periods));
    item.fractionDate=iso(dateForExecutedDays(start,item.targetActualDays,item.deductionDays,item.periods));
    if(item.periods.length){const p=item.periods[0];item.excludedDays=Math.max(0,(parseISO(p.to)-parseISO(p.from))/DAY-1)}
    return item;
  }
  function makeAge60Case(){
    const start=baseStart(),long=Math.random()<.45,duration=long?pick([{years:10,months:1,days:0},{years:11,months:0,days:0},{years:12,months:6,days:0},{years:14,months:0,days:0}]):pick([{years:3,months:6,days:0},{years:6,months:7,days:0},{years:9,months:11,days:0},{years:10,months:0,days:0}]);
    const age=rand(60,72),birth=new Date(Date.UTC(start.getUTCFullYear()-age,start.getUTCMonth(),start.getUTCDate())),end=sentenceEnd(start,duration),totalDays=inclusiveDays(start,end),over10=durationOverYears(duration,10);
    const totalRule=over10?{n:2,d:3,label:"2/3"}:{n:1,d:2,label:"1/2"},minimumRule=over10?{n:1,d:2,label:"1/2"}:{n:1,d:3,label:"1/3"};
    const fractionDays=Math.floor(totalDays*totalRule.n/totalRule.d),minimumDays=Math.floor(totalDays*minimumRule.n/minimumRule.d),gap=Math.max(1,fractionDays-minimumDays),gainedDays=Math.random()<.5?rand(Math.max(10,Math.floor(gap*.2)),Math.max(20,Math.floor(gap*.75))):gap+rand(5,60),targetActualDays=Math.max(minimumDays,fractionDays-gainedDays);
    return {kind:"age60",variant:"age60",start:iso(start),birth:iso(birth),age,duration,totalDays,theoreticalEnd:iso(end),fraction:totalRule.label,fractionDays,minimumFraction:minimumRule.label,minimumDays,gainedDays,targetActualDays,fractionDate:iso(dateForExecutedDays(start,targetActualDays))};
  }

  function calculationAccuracy(kind){
    const stats=asObject(state.calculationSkillStats[kind]);
    if(Number(stats.totalFields)>0)return Number(stats.correctFields||0)/Number(stats.totalFields)*100;
    const history=state.fullWrittenExamHistory.filter(item=>item.calcKind===kind);
    if(history.length)return history.reduce((sum,item)=>sum+Number(item.calcPct||0),0)/history.length;
    if(kind==="age60"&&Number(state.ageCalculationStats?.total)>0)return Number(state.ageCalculationStats.correct||0)/Number(state.ageCalculationStats.total)*100;
    if(kind!=="age60"&&Number(state.generatedCalculationStats?.totalFields)>0)return Number(state.generatedCalculationStats.correctFields||0)/Number(state.generatedCalculationStats.totalFields)*100;
    return null;
  }
  function chooseCalculationKind(adaptive){
    const kinds=["fraction","regime","age60"];
    if(!adaptive)return pick(kinds);
    return kinds.map(kind=>{const accuracy=calculationAccuracy(kind);return {kind,score:accuracy==null?55+Math.random()*8:100-accuracy+Math.random()*3}}).sort((a,b)=>b.score-a.score)[0].kind;
  }
  function makeCalculationCase(adaptive=false){
    const kind=chooseCalculationKind(adaptive);
    return kind==="regime"?makeRegimeCase():kind==="age60"?makeAge60Case():makeFractionCase(adaptive);
  }

  function articleText(article){return [article.intro,...(article.items||[]),...(article.subsections||[]).flatMap(section=>[section.intro,...(section.items||[])])].filter(value=>String(value||"").trim()).join("\n").trim()}
  function splitArticle(text){
    if(tokens(text).length<=220)return [text];
    const units=String(text).split(/(?<=\.)\s+(?=[A-ZĂÂÎȘȚŞŢ])|\s+(?=\d+\.\s)/u).filter(Boolean),chunks=[];let current=[],count=0;
    for(const unit of units){const unitCount=tokens(unit).length;if(current.length&&count+unitCount>220&&count>=70){chunks.push(current.join(" "));current=[];count=0}current.push(unit);count+=unitCount}
    if(current.length){const tail=current.join(" "),tailCount=tokens(tail).length,previous=chunks[chunks.length-1];if(previous&&tailCount<35&&tokens(previous).length+tailCount<=260)chunks[chunks.length-1]=`${previous} ${tail}`;else chunks.push(tail)}
    return chunks;
  }
  function synthesisPool(){
    const base=(typeof legislationActs!=="undefined"?legislationActs:[]).flatMap(act=>(act.articles||[]).map(article=>{const text=articleText(article),count=tokens(text).length;return {id:`synthesis-${article.id}`,type:"base",actId:act.id,act:act.title,heading:article.heading||"Text legal",articleNumber:article.number,text,count}})).filter(item=>item.count>=35&&item.count<=220);
    const omj=window.OMJ2188_SYNTHESIS;
    const omjItems=omj?.articles?.flatMap(article=>splitArticle(article.text).map((text,index)=>({id:`omj-synthesis-${article.id}-${index+1}`,type:"omj",actId:omj.actId,act:omj.actTitle,heading:article.heading||"Text legal",articleNumber:article.number,text,count:tokens(text).length}))).filter(item=>item.count>=35&&item.count<=260)||[];
    return [...base,...omjItems];
  }
  const synthesisResult=item=>(item.type==="omj"?state.omjSynthesisResults:state.synthesisResults)[item.id]||{};
  const synthesisSchedule=item=>state.synthesisReviewSchedule[item.id]||{};
  function synthesisWeakness(item){
    const result=synthesisResult(item),attempts=Number(result.attempts||0),last=Number(result.last??result.best??0),schedule=synthesisSchedule(item),due=Date.parse(schedule.dueAt||0),isDue=!due||due<=Date.now();
    if(attempts&&last<80)return 5000+(100-last)*20+(isDue?1000:0)+Math.random()*5;
    if(attempts&&last<95)return 3500+(95-last)*20+(isDue?700:0)+Math.random()*5;
    if(!attempts)return 1800+Math.random()*100;
    if(isDue)return 1000+(100-last)*5+Math.random()*5;
    return 100-last+Math.random()*5;
  }
  function chooseSynthesis(adaptive){
    const pool=synthesisPool();if(!pool.length)return null;
    return adaptive?[...pool].sort((a,b)=>synthesisWeakness(b)-synthesisWeakness(a))[0]:pick(pool);
  }
  async function ensureOmj(){
    try{
      if(window.TRAINING_LAZY_LOADER?.ensureOmjData)await window.TRAINING_LAZY_LOADER.ensureOmjData();
      else if(window.OMJ2188_DATA_READY)await window.OMJ2188_DATA_READY;
    }catch{}
    return !!window.OMJ2188_SYNTHESIS?.articles?.length;
  }

  function lcsLength(a,b){if(!a.length||!b.length)return 0;let prev=new Uint16Array(b.length+1),cur=new Uint16Array(b.length+1);for(let i=1;i<=a.length;i++){for(let j=1;j<=b.length;j++)cur[j]=a[i-1]===b[j-1]?prev[j-1]+1:Math.max(prev[j],cur[j-1]);[prev,cur]=[cur,prev];cur.fill(0)}return prev[b.length]}
  function synthesisScore(expected,written){const a=tokens(expected),b=tokens(written),matched=lcsLength(a,b);return a.length||b.length?Math.round((2*matched/Math.max(1,a.length+b.length))*100):100}
  const lawLabel=id=>{try{return typeof law==="function"?(law(id)?.short||law(id)?.title||id):(typeof legislationActs!=="undefined"?legislationActs.find(act=>act.id===id)?.title:id)}catch{return id||"Act normativ"}};

  function eligibleQuestions(){return (typeof questions!=="undefined"?questions:[]).filter(q=>q&&Array.isArray(q.a)&&Number.isInteger(q.c)&&(q.kind||"content")!=="article")}
  function questionWeakness(q){
    const stats=state.questionStats?.[String(q.id)]||{},attempts=Number(stats.attempts||0),correct=Number(stats.correct||0),accuracy=attempts?correct/attempts:0,lastSeen=Date.parse(stats.lastSeen||0)||0,nextReview=Date.parse(stats.nextReview||0)||0,due=nextReview?nextReview<=Date.now():false,wrong=Array.isArray(state.mistakes)&&state.mistakes.includes(q.id),ageDays=lastSeen?Math.min(365,(Date.now()-lastSeen)/DAY):365;
    return (wrong?7000:0)+(due?6000:0)+(attempts===0?2600:0)+(1-accuracy)*2200+ageDays*2+Math.random()*10;
  }
  function adaptiveQuizPool(size=20){
    const pool=eligibleQuestions().map(q=>({q,score:questionWeakness(q)})).sort((a,b)=>b.score-a.score),chosen=[],lawCounts={};
    for(const item of pool){if(chosen.length>=size)break;const key=item.q.law||"other",count=lawCounts[key]||0;if(count>=4)continue;chosen.push(item.q);lawCounts[key]=count+1}
    if(chosen.length<size)for(const item of pool){if(chosen.length>=size)break;if(!chosen.includes(item.q))chosen.push(item.q)}
    return chosen.slice(0,size);
  }
  function quizPool(adaptive){const pool=eligibleQuestions();return adaptive?adaptiveQuizPool(Math.min(20,pool.length)):shuffle(pool).slice(0,Math.min(20,pool.length))}

  function weakQuizActs(limit=2){
    const grouped={};for(const q of eligibleQuestions()){const stats=state.questionStats?.[String(q.id)]||{},attempts=Number(stats.attempts||0);if(!attempts)continue;const row=grouped[q.law]||(grouped[q.law]={attempts:0,correct:0});row.attempts+=attempts;row.correct+=Number(stats.correct||0)}
    return Object.entries(grouped).map(([id,row])=>({id,label:lawLabel(id),accuracy:Math.round(row.correct/Math.max(1,row.attempts)*100),attempts:row.attempts})).sort((a,b)=>a.accuracy-b.accuracy||b.attempts-a.attempts).slice(0,limit);
  }
  const calcKindLabel=kind=>kind==="regime"?"regim + 1/5":kind==="age60"?"fracție specială 60+":"pedeapsă + fracții";
  function adaptiveSnapshot(){
    const perf=state.performanceIndex||window.TRAINING_ADAPTIVE_INDEX?.snapshot?.()||{};
    const weak=perf.weak||null;
    const calcKinds=["fraction","regime","age60"].map(kind=>({kind,accuracy:calculationAccuracy(kind)})).sort((a,b)=>(a.accuracy??-1)-(b.accuracy??-1));
    return {due:Number(perf.due||0),quizFocus:weak?lawLabel(weak.id):"materie neexersată",synthesisFocus:"se selectează la intrarea în Partea II",calcFocus:calcKindLabel(calcKinds[0]?.kind||"fraction")};
  }

  const host=document.createElement("section");host.id="full-written-exam";host.className="full-written-exam panel";
  const existing=document.getElementById("exam-area");examView.insertBefore(host,existing||null);
  let session=state.fullWrittenExam&&state.fullWrittenExam.active?state.fullWrittenExam:null,timer=null;

  function persist(){state.fullWrittenExam=session;try{if(typeof save==="function")save();else localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{}}
  function clearTimer(){if(timer){clearInterval(timer);timer=null}}
  function secondsLeft(){if(!session?.deadline)return null;return Math.max(0,Math.ceil((Date.parse(session.deadline)-Date.now())/1000))}
  const clock=seconds=>`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  function startTimer(){clearTimer();if(!session?.deadline)return;const tick=()=>{const left=secondsLeft(),node=document.getElementById("full-exam-timer");if(node)node.textContent=clock(left);if(left<=0){clearTimer();finishExam(true)}};timer=setInterval(tick,500);tick()}

  function makeSession(minutes,mode){
    const adaptive=mode!=="random",quiz=quizPool(adaptive),startedAt=new Date().toISOString();
    if(quiz.length<20)return null;
    return {active:true,id:`written-${Date.now()}`,mode:adaptive?"adaptive":"random",phase:"quiz",quizIds:quiz.map(q=>q.id),quizAnswers:{},quizIndex:0,synthesis:null,calculation:null,calcAnswers:{},startedAt,deadline:minutes?new Date(Date.now()+minutes*60000).toISOString():null,timedOut:false};
  }
  const questionByIdLocal=id=>(typeof questions!=="undefined"?questions:[]).find(q=>String(q.id)===String(id));

  function topbar(){const phaseLabel=session?.phase==="quiz"?"Partea I · Grile":session?.phase==="synthesis"?"Partea II · Sinteză":session?.phase==="calculation"?"Partea III · Calcul":"Rezultat";return `<div class="full-exam-top"><div><span>${phaseLabel} · ${session?.mode==="adaptive"?"adaptivă":"aleatorie"}</span><b>${session?.deadline?'<i id="full-exam-timer">--:--</i>':'fără cronometru'}</b></div><div class="full-exam-progress"><i style="width:${session?.phase==="quiz"?"20%":session?.phase==="synthesis"?"55%":session?.phase==="calculation"?"82%":"100%"}"></i></div></div>`}

  function renderHub(){
    clearTimer();session=null;state.fullWrittenExam=null;persist();
    const history=state.fullWrittenExamHistory,last=history[0],snapshot=adaptiveSnapshot();
    host.innerHTML=`<div class="full-exam-head"><div><p class="eyebrow">SIMULARE COMPLETĂ · PROBA SCRISĂ</p><h2>Grile + sinteză + speță de calcul</h2><p>Modul adaptiv folosește istoricul tău pentru a accentua zonele slabe. Punctajele și media sunt indicatori de antrenament, nu barem oficial ANP.</p></div>${last?`<div class="full-exam-last"><span>Ultima simulare</span><strong>${last.average}%</strong><small>${new Date(last.finishedAt).toLocaleDateString("ro-RO")}</small></div>`:""}</div>
      <div class="full-exam-plan"><div><b>I</b><strong>20 grile</strong><span>conținut juridic</span></div><div><b>II</b><strong>1 sinteză</strong><span>inclusiv OMJ 2188</span></div><div><b>III</b><strong>1 speță</strong><span>fracții · regim · 60+</span></div></div>
      <section class="full-exam-focus"><div><p class="eyebrow">FOCUS ADAPTIV ACTUAL</p><h3>Ce ar prioritiza aplicația acum</h3></div><dl><div><dt>Grile</dt><dd>${snapshot.due} scadente · ${esc(snapshot.quizFocus)}</dd></div><div><dt>Sinteză</dt><dd>${esc(snapshot.synthesisFocus)}</dd></div><div><dt>Calcule</dt><dd>${esc(snapshot.calcFocus)}</dd></div></dl></section>
      <div class="full-exam-launch"><label>Selecția subiectelor<select id="full-exam-mode"><option value="adaptive" selected>Adaptivă · puncte slabe</option><option value="random">Aleatorie · simulare neutră</option></select></label><label>Cronometru de antrenament<select id="full-exam-duration"><option value="0">Fără cronometru</option><option value="90">90 minute</option><option value="120" selected>120 minute</option></select></label><button id="full-exam-start" class="primary" type="button">Pornește simularea completă</button></div><p class="full-exam-note">Durata selectată este doar pentru antrenament. Modul adaptiv nu modifică dificultatea juridică; schimbă doar selecția către zonele unde istoricul indică nevoie de consolidare.</p>`;
    document.getElementById("full-exam-start").onclick=async()=>{
      const button=document.getElementById("full-exam-start"),minutes=Number(document.getElementById("full-exam-duration").value)||0,mode=document.getElementById("full-exam-mode").value||"adaptive";
      button.disabled=true;button.textContent="Pregătesc Partea I…";const next=makeSession(minutes,mode);
      if(!next){button.disabled=false;button.textContent="Pornește simularea completă";if(typeof toast==="function")toast("Nu există suficient conținut local pentru simularea completă.");return}
      session=next;persist();render();
    };
  }

  function renderQuiz(){
    const id=session.quizIds[session.quizIndex],q=questionByIdLocal(id);if(!q){session.quizIndex++;return renderQuiz()}
    const selected=session.quizAnswers[String(id)];
    host.innerHTML=`${topbar()}<div class="full-exam-stage"><div class="full-exam-stage-head"><div><p class="eyebrow">PARTEA I</p><h3>Grila ${session.quizIndex+1} din ${session.quizIds.length}</h3></div><span>${Object.keys(session.quizAnswers).length}/${session.quizIds.length} răspunsuri</span></div><article class="full-exam-question"><p class="full-exam-ref">${esc(lawLabel(q.law))}</p><h3>${esc(q.q)}</h3><div class="full-exam-options">${q.a.map((answer,index)=>`<button type="button" data-full-answer="${index}" class="${String(selected)===String(index)?"selected":""}"><b>${String.fromCharCode(65+index)}</b><span>${esc(answer)}</span></button>`).join("")}</div></article><div class="full-exam-actions"><button id="full-quiz-prev" class="secondary" type="button" ${session.quizIndex===0?"disabled":""}>← Anterior</button><button id="full-quiz-next" class="primary" type="button">${session.quizIndex===session.quizIds.length-1?"Treci la sinteză →":"Următoarea →"}</button></div><button id="full-exam-abort" class="text-btn" type="button">Abandonează simularea</button></div>`;
    document.querySelectorAll("[data-full-answer]").forEach(button=>button.onclick=()=>{session.quizAnswers[String(id)]=Number(button.dataset.fullAnswer);persist();document.querySelectorAll("[data-full-answer]").forEach(node=>node.classList.toggle("selected",node===button));const count=host.querySelector(".full-exam-stage-head > span");if(count)count.textContent=`${Object.keys(session.quizAnswers).length}/${session.quizIds.length} răspunsuri`});
    document.getElementById("full-quiz-prev").onclick=()=>{session.quizIndex=Math.max(0,session.quizIndex-1);persist();renderQuiz()};
    document.getElementById("full-quiz-next").onclick=async()=>{
      if(session.quizIndex<session.quizIds.length-1){session.quizIndex++;persist();render();return}
      const button=document.getElementById("full-quiz-next");button.disabled=true;button.textContent="Pregătesc sinteza…";await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      await ensureOmj();const synthesis=chooseSynthesis(session.mode!=="random");
      if(!synthesis){button.disabled=false;button.textContent="Treci la sinteză →";toast?.("Nu există text disponibil pentru sinteză.");return}
      session.synthesis={id:synthesis.id,type:synthesis.type,actId:synthesis.actId,act:synthesis.act,heading:synthesis.heading,articleNumber:synthesis.articleNumber,text:synthesis.text,count:synthesis.count,draft:""};session.phase="synthesis";persist();render();
    };document.getElementById("full-exam-abort").onclick=abort;
  }

  function renderSynthesis(){
    const s=session.synthesis;
    host.innerHTML=`${topbar()}<div class="full-exam-stage"><div class="full-exam-stage-head"><div><p class="eyebrow">PARTEA II</p><h3>Sinteză din textul legal</h3></div><span>${s.count} cuvinte în textul de control</span></div><div class="full-exam-prompt"><strong>${esc(s.heading)}</strong><p>${esc(s.act)}</p><small>Redă cât mai fidel conținutul normativ. Numărul articolului este ascuns și nu face parte din cerință.</small></div><label class="draft-label">Răspunsul tău<textarea id="full-synthesis-draft" rows="14" placeholder="Scrie textul din memorie…">${esc(s.draft||"")}</textarea></label><div class="full-exam-actions"><button id="full-back-quiz" class="secondary" type="button">← Înapoi la grile</button><button id="full-to-calc" class="primary" type="button">Treci la calcul →</button></div><button id="full-exam-abort" class="text-btn" type="button">Abandonează simularea</button></div>`;
    const draft=document.getElementById("full-synthesis-draft");draft.oninput=()=>{session.synthesis.draft=draft.value;persist()};document.getElementById("full-back-quiz").onclick=()=>{session.phase="quiz";session.quizIndex=session.quizIds.length-1;persist();render()};document.getElementById("full-to-calc").onclick=()=>{session.synthesis.draft=draft.value;if(!session.calculation)session.calculation=makeCalculationCase(session.mode!=="random");session.phase="calculation";persist();render()};document.getElementById("full-exam-abort").onclick=abort;
  }

  function calcField(name,label,type,options=[]){const value=session.calcAnswers[name]??"",control=type==="select"?`<select data-full-calc="${name}"><option value="">Alege…</option>${options.map(option=>`<option value="${esc(option)}" ${String(value)===String(option)?"selected":""}>${esc(option)}</option>`).join("")}</select>`:`<input data-full-calc="${name}" type="${type}" ${type==="number"?'inputmode="numeric" min="0" step="1"':""} value="${esc(value)}">`;return `<label class="calc-answer-field"><span>${esc(label)}</span>${control}</label>`}
  function calcNames(item){if(item.kind==="regime")return ["regime","totalDays","fifthDays","fifthDate"];if(item.kind==="age60")return ["totalDays","fraction","fractionDays","minimumFraction","minimumDays","targetActualDays","fractionDate"];return ["totalDays","theoreticalEnd",...(item.deductionDays||item.periods.length?["effectiveEnd"]:[]),...(item.periods.length?["excludedDays"]:[]),"fraction","fractionDays",...(item.gainedDays?["minimumDays","targetActualDays"]:[]),"fractionDate"]}
  function calcFields(item){
    if(item.kind==="regime")return [calcField("regime","Regimul inițial","select",["deschis","semideschis","închis","maximă siguranță"]),calcField("totalDays","Total zile pedeapsă","number"),calcField("fifthDays","1/5 din pedeapsă (zile)","number"),calcField("fifthDate","Data împlinirii 1/5","date")].join("");
    if(item.kind==="age60")return [calcField("totalDays","Total zile pedeapsă","number"),calcField("fraction","Fracția totală 60+","select",["1/2","2/3"]),calcField("fractionDays","Fracția totală în zile","number"),calcField("minimumFraction","Minimul efectiv","select",["1/3","1/2"]),calcField("minimumDays","Minimul efectiv în zile","number"),calcField("targetActualDays","Zile efectiv necesare după credit","number"),calcField("fractionDate","Data propozabilă","date")].join("");
    const out=[calcField("totalDays","Total zile pedeapsă","number"),calcField("theoreticalEnd","Expirarea teoretică","date")];if(item.deductionDays||item.periods.length)out.push(calcField("effectiveEnd","Expirarea ajustată","date"));if(item.periods.length)out.push(calcField("excludedDays","Zile neexecutate în întrerupere","number"));out.push(calcField("fraction","Fracția totală","select",["1/2","2/3","3/4"]),calcField("fractionDays","Fracția în zile","number"));if(item.gainedDays)out.push(calcField("minimumDays",`Minimul efectiv ${item.minimumFraction} (zile)`,"number"),calcField("targetActualDays","Zile efectiv necesare după credit","number"));out.push(calcField("fractionDate","Data fracției/propozabilei","date"));return out.join("");
  }
  function calcFacts(item){
    if(item.kind==="regime")return `<ul><li>Data începerii: <strong>${ro(parseISO(item.start))}</strong></li><li>Pedeapsa: <strong>${esc(durationLabel(item.duration))}</strong></li><li>Nu există factori excepționali de individualizare.</li></ul>`;
    if(item.kind==="age60")return `<ul><li>Data începerii: <strong>${ro(parseISO(item.start))}</strong></li><li>Pedeapsa: <strong>${esc(durationLabel(item.duration))}</strong></li><li>Data nașterii: <strong>${ro(parseISO(item.birth))}</strong> — persoana are <strong>${item.age} ani</strong> la începutul executării.</li><li>Zile considerate executate: <strong>${item.gainedDays}</strong>.</li></ul>`;
    const extra=[];if(item.deductionDays)extra.push(`<li>Deducere anterioară: <strong>${item.deductionDays} zile</strong>.</li>`);if(item.gainedDays)extra.push(`<li>Zile considerate executate: <strong>${item.gainedDays}</strong>.</li>`);if(item.periods.length){const p=item.periods[0];extra.push(`<li>Întrerupere: <strong>${ro(parseISO(p.from))}</strong> – <strong>${ro(parseISO(p.to))}</strong>; zilele-limită sunt executate.</li>`)}return `<ul><li>Data începerii: <strong>${ro(parseISO(item.start))}</strong></li><li>Pedeapsa: <strong>${esc(durationLabel(item.duration))}</strong></li>${extra.join("")}</ul>`;
  }
  function renderCalculation(){const item=session.calculation;host.innerHTML=`${topbar()}<div class="full-exam-stage"><div class="full-exam-stage-head"><div><p class="eyebrow">PARTEA III</p><h3>${esc(calcKindLabel(item.kind))}</h3></div><span>${calcNames(item).length} rezultate de completat</span></div><div class="generated-calc-facts"><strong>Datele speței</strong>${calcFacts(item)}</div><div class="generated-calc-form full-exam-calc-fields">${calcFields(item)}</div><div class="full-exam-actions"><button id="full-back-synthesis" class="secondary" type="button">← Înapoi la sinteză</button><button id="full-finish" class="primary" type="button">Predă simularea</button></div><button id="full-exam-abort" class="text-btn" type="button">Abandonează simularea</button></div>`;document.querySelectorAll("[data-full-calc]").forEach(input=>input.oninput=()=>{session.calcAnswers[input.dataset.fullCalc]=input.value;persist()});document.getElementById("full-back-synthesis").onclick=()=>{session.phase="synthesis";persist();render()};document.getElementById("full-finish").onclick=()=>{document.querySelectorAll("[data-full-calc]").forEach(input=>session.calcAnswers[input.dataset.fullCalc]=input.value);finishExam(false)};document.getElementById("full-exam-abort").onclick=abort}

  function scoreSession(){
    let quizCorrect=0;const wrongQuestions=[];
    for(const id of session.quizIds){const q=questionByIdLocal(id),ok=q&&Number(session.quizAnswers[String(id)])===Number(q.c);if(ok)quizCorrect++;else if(q)wrongQuestions.push(q)}
    const quizPct=Math.round(quizCorrect/session.quizIds.length*100),synthPct=synthesisScore(session.synthesis.text,session.synthesis.draft||""),calcKeys=calcNames(session.calculation),calcMissed=calcKeys.filter(name=>String(session.calcAnswers[name]??"").trim()!==String(session.calculation[name]??"")),calcCorrect=calcKeys.length-calcMissed.length,calcPct=Math.round(calcCorrect/calcKeys.length*100);
    return {quizCorrect,quizTotal:session.quizIds.length,quizPct,synthPct,calcCorrect,calcTotal:calcKeys.length,calcPct,calcMissed,wrongQuestions,average:Math.round((quizPct+synthPct+calcPct)/3)};
  }
  const calcLabels={regime:"regim inițial",totalDays:"total zile",fifthDays:"1/5 în zile",fifthDate:"data împlinirii 1/5",theoreticalEnd:"expirare teoretică",effectiveEnd:"expirare ajustată",excludedDays:"zile neexecutate",fraction:"fracție",fractionDays:"fracție în zile",minimumFraction:"minim efectiv",minimumDays:"minim efectiv în zile",targetActualDays:"zile efectiv necesare",fractionDate:"data fracției/propozabilei"};
  function diagnosis(result){
    const grouped={};result.wrongQuestions.forEach(q=>{const key=q.law||"other";grouped[key]=(grouped[key]||0)+1});const weakLaws=Object.entries(grouped).map(([id,count])=>({label:lawLabel(id),count})).sort((a,b)=>b.count-a.count).slice(0,3),items=[];
    if(result.quizPct<85)items.push({part:"Partea I",score:result.quizPct,title:"Consolidează grilele",detail:weakLaws.length?`Cele mai multe erori: ${weakLaws.map(item=>`${item.label} (${item.count})`).join(", ")}.`:"Repetă întrebările ratate și cele scadente."});else items.push({part:"Partea I",score:result.quizPct,title:"Menține nivelul la grile",detail:weakLaws.length?`Mai verifică: ${weakLaws.map(item=>item.label).join(", ")}.`:"Nu există un grup clar de erori în această sesiune."});
    if(result.synthPct<95)items.push({part:"Partea II",score:result.synthPct,title:"Repetă sinteza",detail:`Tema „${session.synthesis.heading}” din ${session.synthesis.act} trebuie reluată până la ≥95% fidelitate.`});else items.push({part:"Partea II",score:result.synthPct,title:"Sinteză stăpânită",detail:`Tema „${session.synthesis.heading}” a depășit ținta internă de 95%.`});
    if(result.calcPct<100)items.push({part:"Partea III",score:result.calcPct,title:"Refă operațiile de calcul",detail:`Au fost ratate: ${result.calcMissed.map(name=>calcLabels[name]||name).join(", ")}.`});else items.push({part:"Partea III",score:result.calcPct,title:"Calcul integral corect",detail:`Speța de tip ${calcKindLabel(session.calculation.kind)} a fost rezolvată integral.`});
    return {items,weakest:[...items].sort((a,b)=>a.score-b.score)[0]};
  }

  function updateQuestionLearning(){
    for(const id of session.quizIds){const q=questionByIdLocal(id);if(!q)continue;const ok=Number(session.quizAnswers[String(id)])===Number(q.c);state.answered=(Number(state.answered)||0)+1;if(typeof recordQuestionResult==="function")recordQuestionResult(q,ok);if(ok){state.correct=(Number(state.correct)||0)+1;if(!state.correctIds.includes(q.id))state.correctIds.push(q.id);state.mistakes=state.mistakes.filter(item=>item!==q.id)}else{state.correctIds=state.correctIds.filter(item=>item!==q.id);if(!state.mistakes.includes(q.id))state.mistakes.push(q.id)}}
  }
  function updateSynthesisLearning(score){
    const s=session.synthesis,store=s.type==="omj"?state.omjSynthesisResults:state.synthesisResults,previous=asObject(store[s.id]);store[s.id]={attempts:Number(previous.attempts||0)+1,last:score,best:Math.max(Number(previous.best||0),score),updated:new Date().toISOString()};
    const prior=asObject(state.synthesisReviewSchedule[s.id]),priorStreak=Number(prior.streak||0);let streak=0,intervalDays=0,dueAt;
    if(score>=95){streak=priorStreak+1;intervalDays=SYNTHESIS_INTERVALS[Math.min(streak-1,SYNTHESIS_INTERVALS.length-1)];dueAt=new Date(Date.now()+intervalDays*DAY).toISOString()}else if(score>=80){dueAt=new Date(Date.now()+DAY).toISOString()}else{dueAt=new Date(Date.now()+10*60000).toISOString()}
    state.synthesisReviewSchedule[s.id]={dueAt,intervalDays,streak,lastScore:score,reviewedAt:new Date().toISOString()};
  }
  function updateCalculationLearning(result){
    const kind=session.calculation.kind,skill=asObject(state.calculationSkillStats[kind]);skill.attempts=Number(skill.attempts||0)+1;skill.correctFields=Number(skill.correctFields||0)+result.calcCorrect;skill.totalFields=Number(skill.totalFields||0)+result.calcTotal;skill.updated=new Date().toISOString();state.calculationSkillStats[kind]=skill;
    for(const name of calcNames(session.calculation)){const row=asObject(state.calculationFieldStats[name]),ok=!result.calcMissed.includes(name);row.attempts=Number(row.attempts||0)+1;row.correct=Number(row.correct||0)+(ok?1:0);row.updated=new Date().toISOString();state.calculationFieldStats[name]=row}
    if(kind==="age60"){const s=asObject(state.ageCalculationStats);s.attempts=Number(s.attempts||0)+1;s.correct=Number(s.correct||0)+result.calcCorrect;s.total=Number(s.total||0)+result.calcTotal;state.ageCalculationStats=s}else{const s=asObject(state.generatedCalculationStats);s.attempts=Number(s.attempts||0)+1;s.correctFields=Number(s.correctFields||0)+result.calcCorrect;s.totalFields=Number(s.totalFields||0)+result.calcTotal;state.generatedCalculationStats=s}
  }
  function applyLearning(result){updateQuestionLearning();updateSynthesisLearning(result.synthPct);updateCalculationLearning(result);try{if(typeof updateStreak==="function")updateStreak()}catch{};try{if(typeof renderModules==="function")renderModules()}catch{}}

  function calcSolutionRows(){return calcNames(session.calculation).map(name=>{const value=session.calculation[name],isDate=/date|end/i.test(name);return `<div><span>${esc(calcLabels[name]||name)}</span><strong>${isDate?ro(parseISO(value)):esc(value)}</strong></div>`}).join("")}
  function renderDiagnosis(result){const report=diagnosis(result);return `<section class="full-exam-diagnosis"><div><p class="eyebrow">DIAGNOSTIC DE STUDIU</p><h3>Ce repeți după această simulare</h3><p>Pragurile folosite aici sunt ținte interne de antrenament, nu criterii oficiale de promovare.</p></div><div class="full-exam-diagnosis-grid">${report.items.map(item=>`<article class="${item===report.weakest?"priority":""}"><span>${esc(item.part)}</span><strong>${item.score}%</strong><h4>${esc(item.title)}</h4><p>${esc(item.detail)}</p>${item===report.weakest?"<b>Prioritatea #1</b>":""}</article>`).join("")}</div></section>`}
  function renderResult(result){
    host.innerHTML=`${topbar()}<div class="full-exam-results"><div class="full-exam-result-hero"><div><p class="eyebrow">SIMULARE PREDAȚĂ · ${session.mode==="adaptive"?"ADAPTIVĂ":"ALEATORIE"}</p><h2>${session.timedOut?"Timpul a expirat":"Raportul simulării complete"}</h2><p>Media de ${result.average}% este o medie simplă a celor trei părți și nu reprezintă nota sau baremul oficial ANP.</p></div><strong>${result.average}%</strong></div><div class="full-exam-result-grid"><article><span>PARTEA I</span><strong>${result.quizCorrect}/${result.quizTotal}</strong><b>${result.quizPct}%</b><p>grile corecte</p></article><article><span>PARTEA II</span><strong>${result.synthPct}%</strong><b>fidelitate</b><p>similaritate lexicală orientativă</p></article><article><span>PARTEA III</span><strong>${result.calcCorrect}/${result.calcTotal}</strong><b>${result.calcPct}%</b><p>etape corecte</p></article></div>${renderDiagnosis(result)}<details class="full-exam-review"><summary>Vezi textul de control pentru sinteză</summary><div class="full-exam-control-text"><strong>${esc(session.synthesis.heading)}</strong><p>${esc(session.synthesis.text).replace(/\n/g,"<br>")}</p><small>Sursă: ${esc(session.synthesis.act)}${session.synthesis.articleNumber?` · ${esc(session.synthesis.articleNumber)}`:""}. Numărul articolului este afișat numai ca reper după predare.</small></div></details><details class="full-exam-review"><summary>Vezi baremul speței de calcul</summary><div class="generated-calc-solution-grid">${calcSolutionRows()}</div></details><div class="full-exam-actions"><button id="full-exam-repeat" class="primary" type="button">Simulare nouă</button><button id="full-exam-quiz-only" class="secondary" type="button">Simulare rapidă de grile</button></div></div>`;
    document.getElementById("full-exam-repeat").onclick=renderHub;document.getElementById("full-exam-quiz-only").onclick=()=>document.getElementById("exam-area")?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function finishExam(timedOut){
    if(!session?.active)return;clearTimer();session.timedOut=!!timedOut;session.phase="result";const result=scoreSession(),report=diagnosis(result),finishedAt=new Date().toISOString();applyLearning(result);
    state.fullWrittenExamHistory.unshift({quizCorrect:result.quizCorrect,quizTotal:result.quizTotal,quizPct:result.quizPct,synthPct:result.synthPct,calcCorrect:result.calcCorrect,calcTotal:result.calcTotal,calcPct:result.calcPct,average:result.average,finishedAt,timedOut:session.timedOut,mode:session.mode,synthesisId:session.synthesis.id,synthesisAct:session.synthesis.act,synthesisHeading:session.synthesis.heading,calcKind:session.calculation.kind,calcVariant:session.calculation.variant,calcMissedFields:result.calcMissed,priorityPart:report.weakest.part,priorityTitle:report.weakest.title});state.fullWrittenExamHistory=state.fullWrittenExamHistory.slice(0,20);session.active=false;persist();renderResult(result);
  }
  function abort(){if(!session)return renderHub();clearTimer();session=null;state.fullWrittenExam=null;persist();renderHub()}
  function render(){if(!session)return renderHub();if(session.phase==="quiz")renderQuiz();else if(session.phase==="synthesis")renderSynthesis();else if(session.phase==="calculation")renderCalculation();else renderResult(scoreSession());startTimer()}

  const oldHeading=examView.querySelector(".page-heading");if(oldHeading){const eyebrow=oldHeading.querySelector(".eyebrow"),h=oldHeading.querySelector("h1"),p=oldHeading.querySelector("p:not(.eyebrow)");if(eyebrow)eyebrow.textContent="SIMULARE";if(h)h.textContent="Simulări de examen";if(p)p.textContent="Alege simularea rapidă a Părții I sau simularea completă, inclusiv în mod adaptiv pe punctele slabe."}
  render();
})();
