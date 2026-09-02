(async()=>{
  const synthesisView=document.getElementById("synthesis");
  if(!synthesisView)return;
  let source=window.OMJ2188_SYNTHESIS;
  if(!source&&window.OMJ2188_DATA_READY){
    try{source=await window.OMJ2188_DATA_READY}catch(error){console.error(error)}
  }
  if(!source?.articles?.length){
    const notice=document.createElement("div");
    notice.className="notice warning omj-load-error";
    notice.innerHTML="<strong>Corpusul OMJ 2188/C/2022 nu a putut fi încărcat.</strong><br>Restul modulelor rămân disponibile. Reîncarcă aplicația online pentru a reactiva Sinteza OMJ.";
    synthesisView.querySelector(".page-heading")?.insertAdjacentElement("afterend",notice);
    return;
  }

  const asObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  state.omjSynthesisResults=asObject(state.omjSynthesisResults);
  state.omjSynthesisDrafts=asObject(state.omjSynthesisDrafts);

  const normalize=value=>String(value??"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[„”“”«»"'’`´.,;:!?()\[\]{}\/\\|–—−+=_*#<>]/g," ")
    .replace(/\s+/g," ")
    .trim();
  const tokens=value=>normalize(value).split(" ").filter(Boolean);
  const wordCount=value=>tokens(value).length;
  const band=score=>score>=95?{key:"mastered",label:"Stăpânit"}:score>=80?{key:"close",label:"Aproape"}:score>0?{key:"review",label:"De repetat"}:{key:"new",label:"Nelucrat"};

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
      articleId:article.id,
      articleNumber:article.number,
      heading:article.heading,
      part:index+1,
      parts:chunks.length,
      text,
      wordCount:wordCount(text),
      length:wordCount(text)<=70?"short":wordCount(text)<=180?"medium":"long"
    }));
  });

  let visibleLimit=36;

  function persist(){
    try{save()}catch{try{localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{}}
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
    let prefix=0;while(prefix<target.length&&prefix<answer.length&&target[prefix]===answer[prefix])prefix++;
    return {score,matched,expected:target.length,written:answer.length,missing:Math.max(0,target.length-matched),extra:Math.max(0,answer.length-matched),firstExpected:target[prefix]||"—",firstWritten:answer[prefix]||"—"};
  }

  function filters(){
    return {
      query:normalize(document.getElementById("synthesis-search")?.value||""),
      act:document.getElementById("synthesis-act")?.value||"all",
      length:document.getElementById("synthesis-length")?.value||"all",
      status:document.getElementById("synthesis-status")?.value||"all"
    };
  }

  function filteredTargets(){
    const f=filters();
    if(f.act!=="all"&&f.act!==source.actId)return [];
    return targets.filter(item=>{
      const result=state.omjSynthesisResults[item.id]||{},stateBand=band(result.best||0);
      const searchable=normalize(`${source.actTitle} ${item.heading} ${item.text}`);
      return (!f.query||searchable.includes(f.query))&&(f.length==="all"||item.length===f.length)&&(f.status==="all"||stateBand.key===f.status);
    });
  }

  function updateSummary(){
    const attempted=targets.filter(item=>(state.omjSynthesisResults[item.id]?.attempts||0)>0).length;
    const mastered=targets.filter(item=>(state.omjSynthesisResults[item.id]?.best||0)>=95).length;
    const summary=document.getElementById("omj-synthesis-summary");
    if(summary)summary.innerHTML=`<div><strong>${source.articles.length}</strong><span>articole în corpul normativ</span></div><div><strong>${targets.length}</strong><span>fragmente de memorare</span></div><div><strong>${mastered}</strong><span>stăpânite ≥95%</span></div>`;

    const baseTargets=legislationActs.flatMap(act=>(act.articles||[]).map(article=>`synthesis-${article.id}`));
    const baseMastered=baseTargets.filter(id=>(state.synthesisResults?.[id]?.best||0)>=95).length;
    const dashboard=document.getElementById("exam-synthesis-progress");
    if(dashboard)dashboard.textContent=`${baseMastered+mastered}/${baseTargets.length+targets.length} stăpânite`;
  }

  function resultMarkup(item,comparison){
    const stateBand=band(comparison.score);
    return `<section class="synthesis-result ${stateBand.key}" aria-live="polite">
      <div class="fidelity-score"><span>Fidelitate lexicală</span><strong>${comparison.score}%</strong><small>${stateBand.label}</small></div>
      <div class="fidelity-metrics"><div><span>Cuvinte aliniate</span><b>${comparison.matched}/${comparison.expected}</b></div><div><span>Omise / deplasate</span><b>${comparison.missing}</b></div><div><span>În plus / deplasate</span><b>${comparison.extra}</b></div></div>
      ${comparison.score<100?`<p class="first-difference"><strong>Primul punct de abatere:</strong> textul de control continuă cu „${escapeHtml(comparison.firstExpected)}”, iar răspunsul tău are „${escapeHtml(comparison.firstWritten)}”.</p>`:`<p class="first-difference"><strong>Potrivire integrală la nivel de cuvinte.</strong></p>`}
      <div class="exact-law-text"><div><p class="eyebrow">TEXTUL DE CONTROL</p><h3>${escapeHtml(item.heading)}</h3></div><pre>${escapeHtml(item.text)}</pre><small>Sursă de verificare: ${escapeHtml(source.actTitle)} · ${escapeHtml(item.articleNumber)}${item.parts>1?` · fragment ${item.part}/${item.parts}`:""}. Numărul articolului este afișat numai după exercițiu, ca reper.</small></div>
    </section>`;
  }

  function openTarget(id){
    const item=targets.find(value=>value.id===id),host=document.getElementById("omj-synthesis-workspace");
    if(!item||!host)return;
    const draft=state.omjSynthesisDrafts[id]||"",result=state.omjSynthesisResults[id]||{};
    host.classList.remove("hidden");
    host.innerHTML=`<div class="exam-workspace-head"><div><p class="eyebrow">PARTEA II · OMJ 2188/C/2022</p><h2>${escapeHtml(item.heading)}</h2><p>${item.wordCount} cuvinte${item.parts>1?` · fragment ${item.part} din ${item.parts}`:""}</p></div><button id="close-omj-synthesis" class="secondary" type="button">Închide</button></div>
      <div class="synthesis-prompt"><strong>Cerință</strong><p>Redă din memorie, cât mai fidel și în ordinea normei, fragmentul aferent acestei teme.</p><small>Nu trebuie să cunoști numărul articolului. Evaluatorul ignoră majusculele, punctuația și diacriticele și urmărește cuvintele și ordinea lor.</small></div>
      <label class="draft-label">Răspunsul tău<textarea id="omj-synthesis-draft" rows="12" placeholder="Scrie din memorie textul normativ…">${escapeHtml(draft)}</textarea></label>
      <div class="exam-workspace-actions"><button id="check-omj-synthesis" class="primary" type="button">Verifică fidelitatea</button><button id="reveal-omj-synthesis" class="secondary" type="button">Arată textul de control</button></div>
      ${result.best?`<p class="previous-score">Cel mai bun rezultat: <strong>${result.best}%</strong> din ${result.attempts||1} încercări.</p>`:""}<div id="omj-synthesis-result"></div>`;
    document.getElementById("close-omj-synthesis").onclick=()=>host.classList.add("hidden");
    document.getElementById("omj-synthesis-draft").oninput=event=>{state.omjSynthesisDrafts[id]=event.target.value;persist()};
    document.getElementById("check-omj-synthesis").onclick=()=>{
      const written=document.getElementById("omj-synthesis-draft").value.trim();
      if(!written){toast("Scrie răspunsul înainte de verificare.");return}
      const comparison=compare(item.text,written),previous=state.omjSynthesisResults[id]||{};
      state.omjSynthesisResults[id]={attempts:(previous.attempts||0)+1,last:comparison.score,best:Math.max(previous.best||0,comparison.score),updated:new Date().toISOString()};
      updateStreak();persist();
      document.getElementById("omj-synthesis-result").innerHTML=resultMarkup(item,comparison);
      render();updateSummary();
      document.getElementById("omj-synthesis-result").scrollIntoView({behavior:"smooth",block:"start"});
    };
    document.getElementById("reveal-omj-synthesis").onclick=()=>{
      document.getElementById("omj-synthesis-result").innerHTML=`<section class="synthesis-result reveal-only"><div class="exact-law-text"><div><p class="eyebrow">TEXTUL DE CONTROL</p><h3>${escapeHtml(item.heading)}</h3></div><pre>${escapeHtml(item.text)}</pre><small>Sursă: ${escapeHtml(source.actTitle)} · ${escapeHtml(item.articleNumber)}${item.parts>1?` · fragment ${item.part}/${item.parts}`:""}. Numărul articolului este doar reper de verificare.</small></div></section>`;
      document.getElementById("omj-synthesis-result").scrollIntoView({behavior:"smooth",block:"start"});
    };
    host.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function render(){
    const panel=document.getElementById("omj-synthesis-panel"),host=document.getElementById("omj-synthesis-list");
    if(!panel||!host)return;
    const items=filteredTargets();
    const visible=items.slice(0,visibleLimit);
    panel.classList.toggle("hidden",filters().act!=="all"&&filters().act!==source.actId);
    if(panel.classList.contains("hidden")){updateSummary();return}
    host.innerHTML=visible.length?visible.map(item=>{
      const result=state.omjSynthesisResults[item.id]||{},stateBand=band(result.best||0);
      return `<article class="exam-drill-card omj-drill-card ${stateBand.key}"><div class="exam-drill-meta"><span>OMJ 2188/C/2022</span><b>${item.wordCount} cuvinte${item.parts>1?` · ${item.part}/${item.parts}`:""}</b></div><h2>${escapeHtml(item.heading)}</h2><p>Redă formularea normativă aferentă temei. Numărul articolului nu este cerut.</p><footer><span class="exam-status ${stateBand.key}">${stateBand.label}${result.best?` · ${result.best}%`:""}</span><button type="button" class="secondary" data-omj-synthesis-open="${item.id}">Exersează →</button></footer></article>`;
    }).join(""):'<div class="empty"><h2>Niciun fragment OMJ 2188 pentru filtrele selectate</h2><p>Modifică tema, lungimea sau starea de lucru.</p></div>';
    document.querySelectorAll("[data-omj-synthesis-open]").forEach(button=>button.onclick=()=>openTarget(button.dataset.omjSynthesisOpen));
    const more=document.getElementById("omj-synthesis-more");
    if(more){more.hidden=visible.length>=items.length;more.textContent=`Arată următoarele (${Math.min(36,items.length-visible.length)})`}
    const count=document.getElementById("omj-synthesis-filter-count");
    if(count)count.textContent=`${items.length} fragmente disponibile`;
    updateSummary();
  }

  function mount(){
    const actSelect=document.getElementById("synthesis-act");
    if(actSelect&&!actSelect.querySelector(`option[value="${source.actId}"]`))actSelect.insertAdjacentHTML("beforeend",`<option value="${source.actId}">OMJ 2188/C/2022 — integral</option>`);
    if(document.getElementById("omj-synthesis-panel"))return;
    const anchor=document.getElementById("synthesis-workspace")||synthesisView.querySelector(".official-synthesis-panel");
    const panel=document.createElement("section");
    panel.id="omj-synthesis-panel";panel.className="official-synthesis-panel omj-synthesis-panel";
    panel.innerHTML=`<header><p class="eyebrow">OMJ 2188/C/2022 · INTEGRAL</p><h2>Instrucțiunile de evidență — antrenament literal</h2><p>Corpul normativ a fost extras din forma consolidată verificată. Articolele foarte lungi sunt împărțite în fragmente de maximum aproximativ 220 de cuvinte, fără a transforma numărul articolului în informație de memorat.</p></header><div id="omj-synthesis-summary" class="exam-training-summary" aria-live="polite"></div><div class="omj-filter-note"><strong id="omj-synthesis-filter-count"></strong><span>Anexele 1–62 sunt formulare/documente și nu sunt incluse în evaluatorul literal.</span></div><div id="omj-synthesis-list" class="exam-training-list"></div><button id="omj-synthesis-more" class="secondary omj-more" type="button">Arată următoarele</button><section id="omj-synthesis-workspace" class="exam-workspace hidden" aria-live="polite"></section>`;
    synthesisView.insertBefore(panel,anchor);
    document.getElementById("omj-synthesis-more").onclick=()=>{visibleLimit+=36;render()};

    ["synthesis-search","synthesis-act","synthesis-length","synthesis-status"].forEach(id=>{
      const element=document.getElementById(id);if(!element)return;
      element.addEventListener(element.tagName==="INPUT"?"input":"change",()=>{visibleLimit=36;render()});
    });
    document.addEventListener("click",event=>{if(event.target?.id==="check-synthesis")setTimeout(updateSummary,0)});
    render();updateSummary();
  }

  mount();
})();
