(async()=>{
  const source=window.OMJ2188_SYNTHESIS||await window.OMJ2188_DATA_READY;
  if(!source?.articles?.length)return;

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let panel=null;
  for(let i=0;i<80&&!panel;i++){
    panel=document.getElementById("omj-synthesis-panel");
    if(!panel)await sleep(25);
  }
  if(!panel||document.getElementById("omj-progressive-session"))return;

  const asObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  state.omjSynthesisResults=asObject(state.omjSynthesisResults);
  state.omjSynthesisDrafts=asObject(state.omjSynthesisDrafts);
  state.omjSynthesisSchedule=asObject(state.omjSynthesisSchedule);

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

  const targets=source.articles.flatMap(article=>{
    const chunks=splitArticle(article.text);
    return chunks.map((text,index)=>({
      id:`omj-synthesis-${article.id}-${index+1}`,
      articleNumber:article.number,
      heading:article.heading,
      part:index+1,
      parts:chunks.length,
      text,
      wordCount:wordCount(text)
    }));
  });

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

  const now=()=>Date.now();
  const dueTime=item=>Date.parse(state.omjSynthesisSchedule[item.id]?.dueAt||0)||0;
  const resultFor=item=>state.omjSynthesisResults[item.id]||{};
  const scheduleFor=item=>state.omjSynthesisSchedule[item.id]||{};
  const isMastered=item=>(resultFor(item).best||0)>=95;
  const isDue=item=>!scheduleFor(item).dueAt||dueTime(item)<=now();
  const isNew=item=>(resultFor(item).attempts||0)===0;

  function priority(item){
    const result=resultFor(item),schedule=scheduleFor(item);
    if(isNew(item))return 1000;
    const last=result.last||result.best||0;
    const overdue=schedule.dueAt?Math.max(0,(now()-dueTime(item))/86400000):1;
    if(isDue(item)&&last<80)return 900+Math.min(60,overdue*10);
    if(isDue(item)&&last<95)return 760+Math.min(60,overdue*8);
    if(isDue(item))return 520+Math.min(40,overdue*5);
    return 100-Math.min(100,last);
  }

  function selectSession(size){
    const dueWeak=targets.filter(item=>!isNew(item)&&isDue(item)&&(resultFor(item).last||resultFor(item).best||0)<95).sort((a,b)=>priority(b)-priority(a));
    const dueMastered=targets.filter(item=>!isNew(item)&&isDue(item)&&!dueWeak.includes(item)).sort((a,b)=>priority(b)-priority(a));
    const fresh=targets.filter(isNew);
    const chosen=[];
    const take=(pool,count)=>{
      for(const item of pool){
        if(chosen.length>=size||count<=0)break;
        if(!chosen.includes(item)){chosen.push(item);count--}
      }
    };
    take(dueWeak,Math.ceil(size*.6));
    take(fresh,Math.max(1,Math.ceil(size*.3)));
    take(dueMastered,size-chosen.length);
    take(dueWeak,size-chosen.length);
    take(fresh,size-chosen.length);
    if(chosen.length<size){
      const remaining=targets.filter(item=>!chosen.includes(item)).sort((a,b)=>priority(b)-priority(a));
      take(remaining,size-chosen.length);
    }
    return chosen.slice(0,size);
  }

  const intervalLadder=[1,3,7,14,30,60];
  function scheduleAfter(item,score){
    const previous=scheduleFor(item);
    const previousStreak=Number(previous.streak||0);
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
    state.omjSynthesisSchedule[item.id]={
      dueAt,intervalDays,streak,lastScore:score,
      reviewedAt:new Date().toISOString()
    };
    return state.omjSynthesisSchedule[item.id];
  }

  function humanDue(schedule){
    if(!schedule?.dueAt)return "acum";
    const diff=Date.parse(schedule.dueAt)-now();
    if(diff<=0)return "acum";
    if(diff<3600000)return `în ${Math.max(1,Math.round(diff/60000))} min`;
    if(diff<86400000)return `în ${Math.max(1,Math.round(diff/3600000))} h`;
    const days=Math.max(1,Math.round(diff/86400000));
    return `în ${days} ${days===1?"zi":"zile"}`;
  }

  let session=[],index=0,phase="idle",lastComparison=null;
  const host=document.createElement("section");
  host.id="omj-progressive-session";
  host.className="omj-progressive-session";
  panel.insertBefore(host,panel.querySelector("#omj-synthesis-summary")||panel.firstChild);

  function stats(){
    const attempted=targets.filter(item=>(resultFor(item).attempts||0)>0).length;
    const mastered=targets.filter(isMastered).length;
    const due=targets.filter(item=>!isNew(item)&&isDue(item)).length;
    const fresh=targets.length-attempted;
    return {attempted,mastered,due,fresh};
  }

  function renderHub(){
    phase="idle";session=[];index=0;lastComparison=null;
    const s=stats();
    host.innerHTML=`<div class="omj-session-head"><div><p class="eyebrow">SESIUNE PROGRESIVĂ</p><h3>Memorează, reproduce, repetă</h3><p>Motorul prioritizează fragmentele slabe sau scadente și introduce treptat texte noi.</p></div><div class="omj-session-stats"><div><strong>${s.due}</strong><span>scadente</span></div><div><strong>${s.fresh}</strong><span>noi</span></div><div><strong>${s.mastered}</strong><span>≥95%</span></div></div></div>
      <div class="omj-session-start"><label>Mărimea sesiunii<select id="omj-session-size"><option value="5" selected>5 fragmente</option><option value="10">10 fragmente</option><option value="15">15 fragmente</option></select></label><button id="omj-session-start" class="primary" type="button">Începe sesiunea</button></div>
      <div class="omj-session-method"><span><b>1</b> Citește</span><span><b>2</b> Ascunde</span><span><b>3</b> Reproduce</span><span><b>4</b> Verifică</span><span><b>5</b> Repetă la termen</span></div>`;
    document.getElementById("omj-session-start").onclick=()=>{
      const size=Number(document.getElementById("omj-session-size").value)||5;
      session=selectSession(size);index=0;startItem();
    };
  }

  function current(){return session[index]}

  function startItem(){
    const item=current();
    if(!item){renderComplete();return}
    lastComparison=null;
    const last=resultFor(item).last||resultFor(item).best||0;
    phase=isNew(item)||last<80?"read":"recall";
    renderItem();
  }

  function progressMarkup(){
    const pct=session.length?Math.round((index/session.length)*100):0;
    return `<div class="omj-session-progress"><div><span>Fragment ${Math.min(index+1,session.length)} din ${session.length}</span><b>${pct}%</b></div><div class="progress"><i style="width:${pct}%"></i></div></div>`;
  }

  function renderItem(){
    const item=current();
    if(!item)return renderComplete();
    if(phase==="read"){
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card read-phase"><div class="omj-memory-meta"><span>${isNew(item)?"TEXT NOU":"RECITIRE NECESARĂ"}</span><b>${item.wordCount} cuvinte${item.parts>1?` · ${item.part}/${item.parts}`:""}</b></div><h3>${escape(item.heading)}</h3><div class="omj-read-text">${escape(item.text)}</div><p class="omj-memory-tip">Citește atent o singură dată. Numărul articolului rămâne ascuns.</p><button id="omj-hide-recall" class="primary" type="button">Ascunde și reproduce →</button></div><button id="omj-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      document.getElementById("omj-hide-recall").onclick=()=>{phase="recall";renderItem()};
    }else if(phase==="recall"){
      const draft=state.omjSynthesisDrafts[item.id]||"";
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card recall-phase"><div class="omj-memory-meta"><span>REPRODUCERE DIN MEMORIE</span><b>${item.wordCount} cuvinte${item.parts>1?` · ${item.part}/${item.parts}`:""}</b></div><h3>${escape(item.heading)}</h3><p>Redă formularea în ordinea textului. Nu trebuie să scrii sau să cunoști numărul articolului.</p><textarea id="omj-session-draft" rows="11" placeholder="Scrie textul din memorie…">${escape(draft)}</textarea><div class="omj-session-actions"><button id="omj-session-check" class="primary" type="button">Verifică fidelitatea</button><button id="omj-session-reread" class="secondary" type="button">Am blocaj · recitește</button></div></div><button id="omj-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      const textarea=document.getElementById("omj-session-draft");
      textarea.oninput=()=>{state.omjSynthesisDrafts[item.id]=textarea.value;persist()};
      document.getElementById("omj-session-reread").onclick=()=>{phase="read";renderItem()};
      document.getElementById("omj-session-check").onclick=()=>{
        const written=textarea.value.trim();
        if(!written){if(typeof toast==="function")toast("Scrie răspunsul înainte de verificare.");return}
        const comparison=compare(item.text,written),previous=resultFor(item);
        state.omjSynthesisResults[item.id]={
          ...previous,
          attempts:(previous.attempts||0)+1,
          last:comparison.score,
          best:Math.max(previous.best||0,comparison.score),
          updated:new Date().toISOString()
        };
        const schedule=scheduleAfter(item,comparison.score);
        lastComparison={...comparison,schedule};
        try{if(typeof updateStreak==="function")updateStreak()}catch{}
        persist();phase="result";renderItem();
      };
    }else{
      const c=lastComparison,schedule=c.schedule;
      const label=c.score>=95?"Stăpânit":c.score>=80?"Aproape":"De repetat";
      host.innerHTML=`${progressMarkup()}<div class="omj-memory-card result-phase ${c.score>=95?"mastered":c.score>=80?"close":"review"}"><div class="omj-result-score"><span>Fidelitate</span><strong>${c.score}%</strong><small>${label}</small></div><div class="omj-result-grid"><div><span>Aliniate</span><b>${c.matched}/${c.expected}</b></div><div><span>Omise / deplasate</span><b>${c.missing}</b></div><div><span>În plus / deplasate</span><b>${c.extra}</b></div><div><span>Repetare</span><b>${humanDue(schedule)}</b></div></div>${c.score<100?`<p class="first-difference"><strong>Prima abatere:</strong> control „${escape(c.firstExpected)}” · răspuns „${escape(c.firstWritten)}”.</p>`:""}<details class="omj-control-text"><summary>Vezi textul de control</summary><div>${escape(item.text)}</div><small>Sursă: ${escape(source.actTitle)} · ${escape(item.articleNumber)}${item.parts>1?` · fragment ${item.part}/${item.parts}`:""}. Articolul este afișat doar după verificare.</small></details><button id="omj-session-next" class="primary" type="button">${index+1<session.length?"Următorul fragment →":"Vezi rezultatul sesiunii"}</button></div><button id="omj-session-exit" class="text-btn" type="button">Încheie sesiunea</button>`;
      document.getElementById("omj-session-next").onclick=()=>{index++;startItem()};
    }
    document.getElementById("omj-session-exit").onclick=renderHub;
  }

  function renderComplete(){
    const completed=session.length;
    const scores=session.map(item=>resultFor(item).last||0);
    const masteredNow=scores.filter(score=>score>=95).length;
    const average=completed?Math.round(scores.reduce((sum,value)=>sum+value,0)/completed):0;
    host.innerHTML=`<div class="omj-session-complete"><p class="eyebrow">SESIUNE ÎNCHEIATĂ</p><h3>${completed} fragmente parcurse</h3><div class="omj-session-stats"><div><strong>${average}%</strong><span>medie</span></div><div><strong>${masteredNow}</strong><span>≥95%</span></div><div><strong>${completed-masteredNow}</strong><span>programate la repetare</span></div></div><p>Fragmentele sub 95% au fost reprogramate automat; cele foarte slabe revin rapid, iar cele stăpânite trec la intervale progresiv mai mari.</p><button id="omj-session-again" class="primary" type="button">Pornește altă sesiune</button></div>`;
    document.getElementById("omj-session-again").onclick=renderHub;
    try{document.getElementById("omj-synthesis-summary")?.scrollIntoView({block:"nearest"})}catch{}
  }

  renderHub();
})();