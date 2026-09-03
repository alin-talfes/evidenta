(async()=>{
  const omj=window.OMJ2188_SYNTHESIS||await window.OMJ2188_DATA_READY;
  if(!omj?.articles?.length||!Array.isArray(window.legislationActs)&&typeof legislationActs==="undefined")return;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const synthesisView=document.getElementById("synthesis");
  if(!synthesisView)return;
  for(let i=0;i<80&&!document.getElementById("omj-synthesis-panel");i++)await sleep(25);

  document.getElementById("omj-progressive-session")?.remove();
  if(document.getElementById("synthesis-progressive-session"))return;

  const asObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  state.synthesisResults=asObject(state.synthesisResults);
  state.omjSynthesisResults=asObject(state.omjSynthesisResults);
  state.synthesisReviewSchedule=asObject(state.synthesisReviewSchedule);
  const legacyOmjSchedule=asObject(state.omjSynthesisSchedule);
  Object.entries(legacyOmjSchedule).forEach(([id,value])=>{
    if(!state.synthesisReviewSchedule[id])state.synthesisReviewSchedule[id]=value;
  });

  const normalize=value=>String(value??"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[„”“”«»"'’`´.,;:!?()\[\]{}\/\\|–—−+=_*#<>]/g," ")
    .replace(/\s+/g," ")
    .trim();
  const tokens=value=>normalize(value).split(" ").filter(Boolean);
  const wordCount=value=>tokens(value).length;
  const escape=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  function articleText(article){
    const blocks=[];
    if(article.intro?.trim())blocks.push(article.intro.trim());
    (article.items||[]).forEach(item=>{if(String(item).trim())blocks.push(String(item).trim())});
    (article.subsections||[]).forEach(section=>{
      if(section.intro?.trim())blocks.push(section.intro.trim());
      (section.items||[]).forEach(item=>{if(String(item).trim())blocks.push(String(item).trim())});
    });
    return blocks.join("\n");
  }

  function splitArticle(text){
    if(wordCount(text)<=220)return [text];
    const units=String(text).split(/(?<=\.)\s+(?=[A-ZĂÂÎȘȚŞŢ])|\s+(?=\d+\.\s)/u).filter(Boolean);
    const chunks=[];let current=[],count=0;
    for(const unit of units){
      const unitCount=wordCount(unit);
      if(current.length&&count+unitCount>220&&count>=70){chunks.push(current.join(" "));current=[];count=0}
      current.push(unit);count+=unitCount;
    }
    if(current.length){
      const tail=current.join(" "),tailCount=wordCount(tail),previous=chunks[chunks.length-1];
      if(previous&&tailCount<35&&wordCount(previous)+tailCount<=260)chunks[chunks.length-1]=`${previous} ${tail}`;
      else chunks.push(tail);
    }
    return chunks;
  }

  const baseTargets=legislationActs.flatMap(act=>(act.articles||[]).map(article=>{
    const text=articleText(article);
    return {
      id:`synthesis-${article.id}`,
      type:"base",
      actId:act.id,
      actTitle:act.title,
      articleNumber:article.number,
      heading:article.heading,
      part:1,parts:1,text,wordCount:wordCount(text)
    };
  })).filter(item=>item.wordCount>=4);

  const omjTargets=omj.articles.flatMap(article=>{
    const chunks=splitArticle(article.text);
    return chunks.map((text,index)=>({
      id:`omj-synthesis-${article.id}-${index+1}`,
      type:"omj",
      actId:omj.actId,
      actTitle:omj.actTitle,
      articleNumber:article.number,
      heading:article.heading,
      part:index+1,parts:chunks.length,text,wordCount:wordCount(text)
    }));
  });

  const targets=[...baseTargets,...omjTargets];

  const resultFor=item=>(item.type==="omj"?state.omjSynthesisResults:state.synthesisResults)[item.id]||{};
  const resultStore=item=>item.type==="omj"?state.omjSynthesisResults:state.synthesisResults;
  const scheduleFor=item=>state.synthesisReviewSchedule[item.id]||{};
  const dueTime=item=>Date.parse(scheduleFor(item).dueAt||0)||0;
  const now=()=>Date.now();
  const isNew=item=>(resultFor(item).attempts||0)===0;
  const lastScore=item=>resultFor(item).last??resultFor(item).best??0;
  const isMastered=item=>lastScore(item)>=95;
  const isDue=item=>!scheduleFor(item).dueAt||dueTime(item)<=now();

  function persist(){
    try{if(typeof save==="function")save();else localStorage.setItem("evidenta-training",JSON.stringify(state))}
    catch{try{localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{}}
  }

  function lcsLength(a,b){
    if(!a.length||!b.length)return 0;
    let previous=new Uint16Array(b.length+1),current=new Uint16Array(b.length+1);
    for(let i=1;i<=a.length;i++){
      for(let j=1;j<=b.length;j++)current[j]=a[i-1]===b[j-1]?previous[j-1]+1:Math.max(previous[j],current[j-1]);
      [previous,current]=[current,previous];current.fill(0);
    }
    return previous[b.length];
  }

  function compare(expected,written){
    const target=tokens(expected),answer=tokens(written),matched=lcsLength(target,answer);
    const score=target.length||answer.length?Math.round((2*matched/Math.max(1,target.length+answer.length))*100):100;
    let prefix=0;
    while(prefix<target.length&&prefix<answer.length&&target[prefix]===answer[prefix])prefix++;
    return {
      score,matched,expected:target.length,written:answer.length,
      missing:Math.max(0,target.length-matched),
      extra:Math.max(0,answer.length-matched),
      firstExpected:target[prefix]||"—",
      firstWritten:answer[prefix]||"—"
    };
  }

  function currentAct(){
    return document.getElementById("synthesis-act")?.value||"all";
  }
  function eligibleTargets(){
    const act=currentAct();
    return act==="all"?targets:targets.filter(item=>item.actId===act);
  }

  function priority(item){
    if(isNew(item))return 1000;
    const score=lastScore(item),schedule=scheduleFor(item);
    const overdue=schedule.dueAt?Math.max(0,(now()-dueTime(item))/86400000):1;
    if(isDue(item)&&score<80)return 920+Math.min(60,overdue*10);
    if(isDue(item)&&score<95)return 780+Math.min(60,overdue*8);
    if(isDue(item))return 540+Math.min(40,overdue*5);
    return 100-Math.min(100,score);
  }

  function selectSession(size){
    const pool=eligibleTargets();
    const dueWeak=pool.filter(item=>!isNew(item)&&isDue(item)&&lastScore(item)<95).sort((a,b)=>priority(b)-priority(a));
    const dueMastered=pool.filter(item=>!isNew(item)&&isDue(item)&&lastScore(item)>=95).sort((a,b)=>priority(b)-priority(a));
    const fresh=pool.filter(isNew);
    const chosen=[];
    const take=(items,count)=>{
      for(const item of items){
        if(chosen.length>=size||count<=0)break;
        if(!chosen.includes(item)){chosen.push(item);count--}
      }
    };
    take(dueWeak,Math.ceil(size*.6));
    take(fresh,Math.max(1,Math.ceil(size*.3)));
    take(dueMastered,size-chosen.length);
    take(dueWeak,size-chosen.length);
    take(fresh,size-chosen.length);
    if(chosen.length<size)take(pool.filter(item=>!chosen.includes(item)).sort((a,b)=>priority(b)-priority(a)),size-chosen.length);
    return chosen.slice(0,size);
  }

  const intervalLadder=[1,3,7,14,30,60];
  function scheduleAfter(item,score){
    const previous=scheduleFor(item),previousStreak=Number(previous.streak||0);
    let streak=previousStreak,dueAt,intervalDays=0;
    if(score>=95){
      streak=previousStreak+1;
      intervalDays=intervalLadder[Math.min(streak-1,intervalLadder.length-1)];
      dueAt=new Date(now()+intervalDays*86400000).toISOString();
    }else if(score>=80){
      streak=0;intervalDays=1;
      dueAt=new Date(now()+86400000).toISOString();
    }else{
      streak=0;intervalDays=0;
      dueAt=new Date(now()+10*60000).toISOString();
    }
    return state.synthesisReviewSchedule[item.id]={dueAt,intervalDays,streak,lastScore:score,reviewedAt:new Date().toISOString()};
  }

  function humanDue(schedule){
    const diff=Date.parse(schedule?.dueAt||0)-now();
    if(!Number.isFinite(diff)||diff<=0)return "acum";
    if(diff<3600000)return `în ${Math.max(1,Math.round(diff/60000))} min`;
    if(diff<86400000)return `în ${Math.max(1,Math.round(diff/3600000))} h`;
    const days=Math.max(1,Math.round(diff/86400000));
    return `în ${days} ${days===1?"zi":"zile"}`;
  }

  const anchor=document.getElementById("omj-synthesis-panel")||document.getElementById("synthesis-list");
  const host=document.createElement("section");
  host.id="synthesis-progressive-session";
  host.className="omj-progressive-session";
  if(anchor?.parentNode)anchor.parentNode.insertBefore(host,anchor);
  else synthesisView.querySelector(".notice")?.insertAdjacentElement("afterend",host);

  let session=[],index=0,phase="idle",lastComparison=null;
  const sessionDrafts={};

  function stats(){
    const pool=eligibleTargets();
    const attempted=pool.filter(item=>!isNew(item)).length;
    const mastered=pool.filter(isMastered).length;
    const due=pool.filter(item=>!isNew(item)&&isDue(item)).length;
    return {total:pool.length,attempted,mastered,due,fresh:pool.length-attempted};
  }

  function selectedActLabel(){
    const select=document.getElementById("synthesis-act");
    return select?.selectedOptions?.[0]?.textContent?.trim()||"Toată bibliografia";
  }

  function renderHub(){
    phase="idle";session=[];index=0;lastComparison=null;
    const s=stats();
    host.innerHTML=`<div class="omj-session-head"><div><p class="eyebrow">PARTEA II · SESIUNE PROGRESIVĂ</p><h3>Memorează, reproduce, repetă</h3><p>Selecția curentă: <strong>${escape(selectedActLabel())}</strong>. Sunt prioritizate textele slabe sau scadente, apoi sunt introduse treptat texte noi.</p></div><div class="omj-session-stats"><div><strong>${s.due}</strong><span>scadente</span></div><div><strong>${s.fresh}</strong><span>noi</span></div><div><strong>${s.mastered}</strong><span>≥95%</span></div></div></div>
      <div class="omj-session-start"><label>Mărimea sesiunii<select id="synthesis-session-size"><option value="5" selected>5 fragmente</option><option value="10">10 fragmente</option><option value="15">15 fragmente</option></select></label><button id="synthesis-session-start" class="primary" type="button" ${s.total?"":"disabled"}>Începe sesiunea</button></div>
      <div class="omj-session-method"><span><b>1</b> Citește</span><span><b>2</b> Ascunde</span><span><b>3</b> Reproduce</span><span><b>4</b> Verifică</span><span><b>5</b> Repetă la termen</span></div>`;
    const start=document.getElementById("synthesis-session-start");
    if(start)start.onclick=()=>{
      const size=Number(document.getElementById("synthesis-session-size").value)||5;
      session=selectSession(size);index=0;startItem();
    };
  }

  const current=()=>session[index];

  function startItem(){
    const item=current();
    if(!item){renderComplete();return}
    lastComparison=null;
    sessionDrafts[item.id]="";
    phase=isNew(item)||lastScore(item)<80?"read":"recall";
    renderItem();
  }

  function progressMarkup(){
    return `<div class="omj-session-position">Fragment ${Math.min(index+1,session.length)} din ${session.length}</div>`;
  }

  function renderItem(){
    const item=current();
    if(!item)return renderComplete();
    if(phase==="read"){
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card read-phase"><div class="omj-memory-meta"><span>${isNew(item)?"TEXT NOU":"RECITIRE NECESARĂ"}</span><b>${escape(item.actTitle)} · ${item.wordCount} cuvinte</b></div><h3>${escape(item.heading)}</h3><div class="omj-read-text">${escape(item.text)}</div><p class="omj-memory-tip">Citește atent. Numărul articolului este ascuns; nu este obiect de memorare.</p><button id="synthesis-hide-recall" class="primary" type="button">Ascunde și reproduce →</button></div><button id="synthesis-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      document.getElementById("synthesis-hide-recall").onclick=()=>{phase="recall";sessionDrafts[item.id]="";renderItem()};
    }else if(phase==="recall"){
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card recall-phase"><div class="omj-memory-meta"><span>REPRODUCERE DIN MEMORIE</span><b>${escape(item.actTitle)} · ${item.wordCount} cuvinte</b></div><h3>${escape(item.heading)}</h3><p>Redă formularea în ordinea textului. Nu trebuie să scrii sau să cunoști numărul articolului.</p><textarea id="synthesis-session-draft" rows="11" placeholder="Scrie textul din memorie…">${escape(sessionDrafts[item.id]||"")}</textarea><div class="omj-session-actions"><button id="synthesis-session-check" class="primary" type="button">Verifică fidelitatea</button><button id="synthesis-session-reread" class="secondary" type="button">Am blocaj · recitește</button></div></div><button id="synthesis-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      const field=document.getElementById("synthesis-session-draft");
      field.oninput=()=>{sessionDrafts[item.id]=field.value};
      document.getElementById("synthesis-session-reread").onclick=()=>{phase="read";renderItem()};
      document.getElementById("synthesis-session-check").onclick=()=>{
        const written=field.value.trim();
        if(!written){if(typeof toast==="function")toast("Scrie răspunsul înainte de verificare.");return}
        const comparison=compare(item.text,written),store=resultStore(item),previous=resultFor(item);
        store[item.id]={...previous,attempts:(previous.attempts||0)+1,last:comparison.score,best:Math.max(previous.best||0,comparison.score),updated:new Date().toISOString()};
        const schedule=scheduleAfter(item,comparison.score);
        lastComparison={...comparison,schedule};
        sessionDrafts[item.id]="";
        try{if(typeof updateStreak==="function")updateStreak()}catch{}
        persist();phase="result";renderItem();
      };
    }else{
      const c=lastComparison,label=c.score>=95?"Stăpânit":c.score>=80?"Aproape":"De repetat";
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card result-phase ${c.score>=95?"mastered":c.score>=80?"close":"review"}"><div class="omj-result-score"><span>Fidelitate</span><strong>${c.score}%</strong><small>${label}</small></div><div class="omj-result-grid"><div><span>Aliniate</span><b>${c.matched}/${c.expected}</b></div><div><span>Omise / deplasate</span><b>${c.missing}</b></div><div><span>În plus / deplasate</span><b>${c.extra}</b></div><div><span>Repetare</span><b>${humanDue(c.schedule)}</b></div></div>${c.score<100?`<p class="first-difference"><strong>Prima abatere:</strong> control „${escape(c.firstExpected)}” · răspuns „${escape(c.firstWritten)}”.</p>`:""}<details class="omj-control-text"><summary>Vezi textul de control</summary><div>${escape(item.text)}</div><small>Sursă: ${escape(item.actTitle)} · ${escape(item.articleNumber)}${item.parts>1?` · fragment ${item.part}/${item.parts}`:""}. Articolul apare numai după verificare, ca reper.</small></details><button id="synthesis-session-next" class="primary" type="button">${index+1<session.length?"Următorul fragment →":"Vezi rezultatul sesiunii"}</button></div><button id="synthesis-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      document.getElementById("synthesis-session-next").onclick=()=>{index++;startItem()};
    }
    document.getElementById("synthesis-session-exit").onclick=renderHub;
  }

  function renderComplete(){
    const scores=session.map(lastScore),masteredNow=scores.filter(score=>score>=95).length;
    const average=session.length?Math.round(scores.reduce((sum,value)=>sum+value,0)/session.length):0;
    host.innerHTML=`<div class="omj-session-complete"><p class="eyebrow">SESIUNE ÎNCHEIATĂ</p><h3>${session.length} fragmente parcurse</h3><div class="omj-session-stats"><div><strong>${average}%</strong><span>medie</span></div><div><strong>${masteredNow}</strong><span>≥95%</span></div><div><strong>${session.length-masteredNow}</strong><span>de consolidat</span></div></div><p>Textele sub 95% au fost reprogramate automat. Cele sub 80% revin rapid; textele stăpânite intră pe intervale progresive de 1, 3, 7, 14, 30 și 60 de zile.</p><button id="synthesis-session-again" class="primary" type="button">Pornește altă sesiune</button></div>`;
    document.getElementById("synthesis-session-again").onclick=renderHub;
  }

  document.getElementById("synthesis-act")?.addEventListener("change",()=>{if(phase==="idle")renderHub()});
  renderHub();
})();
