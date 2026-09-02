(()=>{
  const asPlainObject=value=>value&&typeof value==="object"&&!Array.isArray(value)?value:{};
  state.synthesisResults=asPlainObject(state.synthesisResults);
  state.synthesisDrafts=asPlainObject(state.synthesisDrafts);
  state.calculationResults=asPlainObject(state.calculationResults);
  state.calculationDrafts=asPlainObject(state.calculationDrafts);

  const normalizeSpaces=value=>String(value??"").replace(/\r\n?/g,"\n").replace(/[ \t]+/g," ").replace(/ *\n */g,"\n").trim();
  const evaluationTokens=value=>normalizeSpaces(value)
    .toLowerCase()
    .replace(/[„”“”«»"'’`´.,;:!?()\[\]{}\/\\|–—−+=_*#<>]/g," ")
    .split(/\s+/)
    .filter(Boolean);

  const articleText=article=>{
    const blocks=[];
    if(article.intro?.trim())blocks.push(article.intro.trim());
    (article.items||[]).forEach(item=>{if(String(item).trim())blocks.push(String(item).trim())});
    (article.subsections||[]).forEach(section=>{
      if(section.intro?.trim())blocks.push(section.intro.trim());
      (section.items||[]).forEach(item=>{if(String(item).trim())blocks.push(String(item).trim())});
    });
    return blocks.join("\n");
  };

  const synthesisTargets=legislationActs.flatMap(act=>act.articles.map(article=>{
    const text=articleText(article);
    const wordCount=evaluationTokens(text).length;
    return {
      id:`synthesis-${article.id}`,
      actId:act.id,
      actTitle:act.title,
      articleId:article.id,
      articleNumber:article.number,
      heading:article.heading,
      text,
      wordCount,
      length:wordCount<=70?"short":wordCount<=180?"medium":"long"
    };
  })).filter(item=>item.wordCount>=4);

  const officialSynthesisTopics=officialWritten.filter(item=>item.type!=="Calcul");
  const calculationItems=officialWritten.filter(item=>item.type==="Calcul");

  function persistDrafts(){
    try{localStorage.setItem("evidenta-training",JSON.stringify(state))}catch{}
  }

  function synthesisBand(score){
    if(score>=95)return {key:"mastered",label:"Stăpânit"};
    if(score>=80)return {key:"close",label:"Aproape"};
    if(score>0)return {key:"review",label:"De repetat"};
    return {key:"new",label:"Nelucrat"};
  }

  function lcsLength(a,b){
    if(!a.length||!b.length)return 0;
    let previous=new Uint16Array(b.length+1);
    let current=new Uint16Array(b.length+1);
    for(let i=1;i<=a.length;i++){
      for(let j=1;j<=b.length;j++)current[j]=a[i-1]===b[j-1]?previous[j-1]+1:Math.max(previous[j],current[j-1]);
      [previous,current]=[current,previous];
      current.fill(0);
    }
    return previous[b.length];
  }

  function compareSynthesis(expected,written){
    const target=evaluationTokens(expected),answer=evaluationTokens(written),matched=lcsLength(target,answer);
    const score=target.length||answer.length?Math.round((2*matched/Math.max(1,target.length+answer.length))*100):100;
    let prefix=0;
    while(prefix<target.length&&prefix<answer.length&&target[prefix]===answer[prefix])prefix++;
    return {
      score,
      matched,
      expected:target.length,
      written:answer.length,
      missing:Math.max(0,target.length-matched),
      extra:Math.max(0,answer.length-matched),
      firstExpected:target[prefix]||"—",
      firstWritten:answer[prefix]||"—"
    };
  }

  function synthesisFilters(){
    return {
      query:($("#synthesis-search")?.value||"").trim().toLowerCase(),
      act:$("#synthesis-act")?.value||"all",
      length:$("#synthesis-length")?.value||"all",
      status:$("#synthesis-status")?.value||"all"
    };
  }

  function renderSynthesisSummary(){
    const mastered=synthesisTargets.filter(item=>(state.synthesisResults[item.id]?.best||0)>=95).length;
    const attempted=synthesisTargets.filter(item=>(state.synthesisResults[item.id]?.attempts||0)>0).length;
    const host=$("#synthesis-summary");
    if(host)host.innerHTML=`<div><strong>${synthesisTargets.length}</strong><span>texte integrate</span></div><div><strong>${attempted}</strong><span>exersate</span></div><div><strong>${mastered}</strong><span>≥95% fidelitate</span></div>`;
    const dashboard=$("#exam-synthesis-progress");
    if(dashboard)dashboard.textContent=`${mastered}/${synthesisTargets.length} stăpânite`;
  }

  function renderSynthesisList(){
    const host=$("#synthesis-list");
    if(!host)return;
    const {query,act,length,status}=synthesisFilters();
    const items=synthesisTargets.filter(item=>{
      const result=state.synthesisResults[item.id]||{};
      const band=synthesisBand(result.best||0);
      const searchable=`${item.actTitle} ${item.heading}`.toLowerCase();
      return (!query||searchable.includes(query))&&(act==="all"||item.actId===act)&&(length==="all"||item.length===length)&&(status==="all"||band.key===status);
    });
    host.innerHTML=items.length?items.map(item=>{
      const result=state.synthesisResults[item.id]||{};
      const band=synthesisBand(result.best||0);
      return `<article class="exam-drill-card ${band.key}">
        <div class="exam-drill-meta"><span>${escapeHtml(item.actTitle)}</span><b>${item.wordCount} cuvinte</b></div>
        <h2>${escapeHtml(item.heading)}</h2>
        <p>Redă integral formularea legală, în ordinea textului. Numărul articolului nu este obiect de memorare.</p>
        <footer><span class="exam-status ${band.key}">${band.label}${result.best?` · ${result.best}%`:""}</span><button type="button" class="secondary" data-synthesis-open="${item.id}">Exersează →</button></footer>
      </article>`;
    }).join(""):'<div class="empty"><h2>Niciun text pentru filtrele selectate</h2><p>Modifică actul, lungimea sau starea de lucru.</p></div>';
    $$('[data-synthesis-open]').forEach(button=>button.onclick=()=>openSynthesis(button.dataset.synthesisOpen));
    renderSynthesisSummary();
  }

  function renderOfficialSynthesisTopics(){
    const host=$("#synthesis-official-topics");
    if(!host)return;
    host.innerHTML=officialSynthesisTopics.map(item=>{
      const source=law(item.law)?.short||item.law;
      const result=state.writtenResults?.[item.id]||"";
      return `<article class="official-topic-card">
        <div><span>${escapeHtml(source)}</span><b>${result==="corect"?"✓ lucrat":result==="repetare"?"↻ de repetat":"temă oficială"}</b></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.prompt)}</p>
        <button type="button" class="text-btn" data-official-topic="${item.official}">Deschide setul ANP →</button>
      </article>`;
    }).join("");
    $$('[data-official-topic]').forEach(button=>button.onclick=()=>{
      showView("official");
      renderWrittenSet(button.dataset.officialTopic);
    });
  }

  function synthesisResultMarkup(item,comparison){
    const band=synthesisBand(comparison.score);
    const differenceMarkup=comparison.score<100
      ? `<p class="first-difference"><strong>Primul punct de abatere:</strong> textul legal continuă cu „${escapeHtml(comparison.firstExpected)}”, iar răspunsul tău are „${escapeHtml(comparison.firstWritten)}”.</p>`
      : `<p class="first-difference"><strong>Potrivire integrală la nivel de cuvinte.</strong></p>`;
    return `<section class="synthesis-result ${band.key}" aria-live="polite">
      <div class="fidelity-score"><span>Fidelitate lexicală</span><strong>${comparison.score}%</strong><small>${band.label}</small></div>
      <div class="fidelity-metrics">
        <div><span>Cuvinte potrivite</span><b>${comparison.matched}/${comparison.expected}</b></div>
        <div><span>Omise / nealiniate</span><b>${comparison.missing}</b></div>
        <div><span>În plus / nealiniate</span><b>${comparison.extra}</b></div>
      </div>
      ${differenceMarkup}
      <div class="exact-law-text"><div><p class="eyebrow">TEXTUL DE CONTROL</p><h3>${escapeHtml(item.heading)}</h3></div><pre>${escapeHtml(item.text)}</pre><small>Sursă de control: ${escapeHtml(item.actTitle)} · ${escapeHtml(item.articleNumber)}. Numărul articolului este afișat doar ca reper de verificare.</small></div>
    </section>`;
  }

  function openSynthesis(id){
    const item=synthesisTargets.find(value=>value.id===id),host=$("#synthesis-workspace");
    if(!item||!host)return;
    const draft=state.synthesisDrafts[id]||"";
    const result=state.synthesisResults[id]||{};
    host.classList.remove("hidden");
    host.innerHTML=`<div class="exam-workspace-head"><div><p class="eyebrow">PARTEA II · SINTEZĂ</p><h2>${escapeHtml(item.heading)}</h2><p>${escapeHtml(item.actTitle)} · ${item.wordCount} cuvinte în textul de control</p></div><button id="close-synthesis" class="secondary" type="button">Închide</button></div>
      <div class="synthesis-prompt"><strong>Cerință</strong><p>Redă integral, cât mai fidel, formularea legală aferentă acestei teme. Nu trebuie să indici numărul articolului.</p><small>Scorul compară cuvintele și ordinea lor; punctuația și majusculele nu influențează procentul.</small></div>
      <label class="draft-label">Răspunsul tău<textarea id="synthesis-draft" rows="12" placeholder="Scrie din memorie textul legal…">${escapeHtml(draft)}</textarea></label>
      <div class="exam-workspace-actions"><button id="check-synthesis" class="primary" type="button">Verifică fidelitatea</button><button id="reveal-synthesis" class="secondary" type="button">Arată textul legal direct</button></div>
      ${result.best?`<p class="previous-score">Cel mai bun rezultat salvat: <strong>${result.best}%</strong> din ${result.attempts||1} încercări.</p>`:""}
      <div id="synthesis-result"></div>`;
    $("#close-synthesis").onclick=()=>host.classList.add("hidden");
    $("#synthesis-draft").oninput=event=>{state.synthesisDrafts[id]=event.target.value;persistDrafts()};
    $("#check-synthesis").onclick=()=>{
      const written=$("#synthesis-draft").value.trim();
      if(!written){toast("Scrie un răspuns sau folosește «Arată textul legal direct».");return}
      const comparison=compareSynthesis(item.text,written);
      const previous=state.synthesisResults[id]||{};
      state.synthesisResults[id]={attempts:(previous.attempts||0)+1,last:comparison.score,best:Math.max(previous.best||0,comparison.score),updated:new Date().toISOString()};
      updateStreak();save();
      $("#synthesis-result").innerHTML=synthesisResultMarkup(item,comparison);
      renderSynthesisList();
      $("#synthesis-result").scrollIntoView({behavior:"smooth",block:"start"});
    };
    $("#reveal-synthesis").onclick=()=>{
      const exact={score:0,matched:0,expected:evaluationTokens(item.text).length,written:0,missing:evaluationTokens(item.text).length,extra:0,firstExpected:evaluationTokens(item.text)[0]||"—",firstWritten:"—"};
      $("#synthesis-result").innerHTML=`<section class="synthesis-result reveal-only"><div class="exact-law-text"><div><p class="eyebrow">TEXTUL DE CONTROL</p><h3>${escapeHtml(item.heading)}</h3></div><pre>${escapeHtml(item.text)}</pre><small>Sursă: ${escapeHtml(item.actTitle)} · ${escapeHtml(item.articleNumber)}. Numărul articolului este doar reper de verificare.</small></div></section>`;
      $("#synthesis-result").scrollIntoView({behavior:"smooth",block:"start"});
    };
    host.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function calculationBand(result){
    return result==="corect"?{key:"mastered",label:"Corect integral"}:result==="partial"?{key:"close",label:"Parțial"}:result==="repetare"?{key:"review",label:"De repetat"}:{key:"new",label:"Nelucrat"};
  }

  function calculationMethod(item){
    const text=(item.title+" "+item.prompt).toLowerCase();
    if(text.includes("regim")||text.includes("reanaliz"))return [
      "Separă problema de regim de problema calendaristică.",
      "Identifică toate datele de început și durata relevantă din speță.",
      "Efectuează transformarea și fracția cerută, cu operațiile scrise distinct.",
      "Determină data de reanalizare și verifică rezultatul cu baremul."
    ];
    return [
      "Extrage toate datele calendaristice și perioadele speciale din speță.",
      "Calculează separat totalul pedepsei și data expirării.",
      "Calculează fiecare fracție cerută ca operație distinctă.",
      "Transformă rezultatele în date calendaristice și verifică perioadele care influențează executarea.",
      "Compară fiecare rezultat intermediar cu baremul, nu doar data finală."
    ];
  }

  function renderCalculationSummary(){
    const correct=calculationItems.filter(item=>state.calculationResults[item.id]?.status==="corect").length;
    const attempted=calculationItems.filter(item=>state.calculationResults[item.id]?.status).length;
    const host=$("#calculation-summary");
    if(host)host.innerHTML=`<div><strong>${calculationItems.length}</strong><span>spețe oficiale</span></div><div><strong>${attempted}</strong><span>lucrate</span></div><div><strong>${correct}</strong><span>corecte integral</span></div>`;
    const dashboard=$("#exam-calculation-progress");
    if(dashboard)dashboard.textContent=`${correct}/${calculationItems.length} corecte`;
  }

  function renderCalculationList(){
    const host=$("#calculation-list");
    if(!host)return;
    host.innerHTML=calculationItems.map(item=>{
      const result=state.calculationResults[item.id]||{},band=calculationBand(result.status);
      const set=officialSets.find(value=>value.id===item.official);
      return `<article class="exam-drill-card calculation-card ${band.key}">
        <div class="exam-drill-meta"><span>${escapeHtml(set?.title||"Subiect oficial ANP")}</span><b>Speță de calcul</b></div>
        <h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.prompt)}</p>
        <footer><span class="exam-status ${band.key}">${band.label}</span><button type="button" class="secondary" data-calculation-open="${item.id}">Rezolvă →</button></footer>
      </article>`;
    }).join("");
    $$('[data-calculation-open]').forEach(button=>button.onclick=()=>openCalculation(Number(button.dataset.calculationOpen)));
    renderCalculationSummary();
  }

  function openCalculation(id){
    const item=calculationItems.find(value=>value.id===id),host=$("#calculation-workspace");
    if(!item||!host)return;
    const set=officialSets.find(value=>value.id===item.official),draft=state.calculationDrafts[id]||"",result=state.calculationResults[id]||{};
    host.classList.remove("hidden");
    host.innerHTML=`<div class="exam-workspace-head"><div><p class="eyebrow">PARTEA III · SPEȚĂ DE CALCUL</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(set?.title||"Subiect oficial ANP")}</p></div><button id="close-calculation" class="secondary" type="button">Închide</button></div>
      <div class="calculation-prompt"><strong>Cerința</strong><p>${escapeHtml(item.prompt)}</p>${set?.pdf?`<a class="official-link" href="${set.pdf}" target="_blank" rel="noopener">Deschide baremul/PDF-ul oficial ↗</a>`:""}</div>
      <section class="calculation-method"><p class="eyebrow">SCHEMĂ DE LUCRU</p><ol>${calculationMethod(item).map(step=>`<li>${escapeHtml(step)}</li>`).join("")}</ol></section>
      <label class="draft-label">Rezolvarea ta<textarea id="calculation-draft" rows="12" placeholder="Scrie operațiile, rezultatele intermediare și datele finale…">${escapeHtml(draft)}</textarea></label>
      <div class="exam-workspace-actions"><button id="reveal-calculation" class="primary" type="button">Compară cu baremul</button></div>
      <section id="calculation-solution" class="calculation-solution hidden"><p class="eyebrow">BAREM DE CONTROL</p><h3>Rezultatul oficial</h3><p>${escapeHtml(item.answer)}</p><ul>${item.checkpoints.map(value=>`<li>${escapeHtml(value)}</li>`).join("")}</ul><div class="calculation-note"><strong>Observație</strong><p>${escapeHtml(item.note)}</p></div><div class="calculation-self-score"><span>Autoevaluare:</span><button type="button" data-calculation-result="repetare">De repetat</button><button type="button" data-calculation-result="partial">Parțial</button><button type="button" data-calculation-result="corect">Corect integral</button></div></section>
      ${result.status?`<p class="previous-score">Ultima evaluare: <strong>${calculationBand(result.status).label}</strong>.</p>`:""}`;
    $("#close-calculation").onclick=()=>host.classList.add("hidden");
    $("#calculation-draft").oninput=event=>{state.calculationDrafts[id]=event.target.value;persistDrafts()};
    $("#reveal-calculation").onclick=()=>{$("#calculation-solution").classList.remove("hidden");$("#calculation-solution").scrollIntoView({behavior:"smooth",block:"start"})};
    $$('[data-calculation-result]').forEach(button=>button.onclick=()=>{
      state.calculationResults[id]={status:button.dataset.calculationResult,updated:new Date().toISOString()};
      updateStreak();save();renderCalculationList();
      $$('[data-calculation-result]').forEach(value=>value.classList.toggle("active",value.dataset.calculationResult===button.dataset.calculationResult));
      toast(`Speța a fost marcată: ${calculationBand(button.dataset.calculationResult).label}.`);
    });
    host.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function populateSynthesisFilters(){
    const select=$("#synthesis-act");
    if(!select||select.options.length>1)return;
    legislationActs.forEach(act=>select.insertAdjacentHTML("beforeend",`<option value="${act.id}">${escapeHtml(act.title)}</option>`));
  }

  function renderExamPath(){
    const quizProgress=$("#exam-quiz-progress");
    if(quizProgress){
      const relevant=questions.filter(q=>(q.kind||"content")!=="article");
      const mastered=relevant.filter(q=>state.correctIds.includes(q.id)).length;
      quizProgress.textContent=`${mastered}/${relevant.length} grile stăpânite`;
    }
    renderSynthesisSummary();
    renderCalculationSummary();
  }

  function init(){
    populateSynthesisFilters();
    ["#synthesis-search","#synthesis-act","#synthesis-length","#synthesis-status"].forEach(selector=>{
      const element=$(selector);if(!element)return;
      element.addEventListener(element.tagName==="INPUT"?"input":"change",renderSynthesisList);
    });
    renderSynthesisList();
    renderOfficialSynthesisTopics();
    renderCalculationList();
    renderExamPath();
  }

  init();
})();
