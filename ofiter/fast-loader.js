(()=>{
  const loadedScripts=new Map(),loadedStyles=new Map(),viewPromises=new Map(),prewarmPromises=new Map();
  const currentScript=src=>[...document.scripts].find(s=>s.getAttribute("src")===src);
  function style(href){
    if(loadedStyles.has(href))return loadedStyles.get(href);
    const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>link.getAttribute("href")===href);
    const promise=new Promise((resolve,reject)=>{
      const link=existing||document.createElement("link");
      let settled=false;
      const cleanup=()=>{link.removeEventListener("load",done);link.removeEventListener("error",fail)};
      const done=()=>{if(settled)return;settled=true;cleanup();link.dataset.trainingStyleReady="true";resolve(link)};
      const fail=()=>{if(settled)return;settled=true;cleanup();loadedStyles.delete(href);if(!existing)link.remove();reject(new Error(`Nu pot încărca ${href}`))};
      if(existing){
        if(existing.dataset.trainingStyleReady==="true"){done();return}
        try{if(existing.sheet){done();return}}catch{}
      }else{
        link.rel="stylesheet";link.href=href;
      }
      link.addEventListener("load",done,{once:true});link.addEventListener("error",fail,{once:true});
      if(!existing)document.head.appendChild(link);
    });
    loadedStyles.set(href,promise);return promise;
  }
  function script(src,attrs={}){if(loadedScripts.has(src))return loadedScripts.get(src);const existing=currentScript(src);if(existing&&existing!==document.currentScript)return Promise.resolve();const promise=new Promise((resolve,reject)=>{const node=document.createElement("script");node.src=src;node.async=false;Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));node.onload=resolve;node.onerror=()=>{loadedScripts.delete(src);reject(new Error(`Nu pot încărca ${src}`))};document.body.appendChild(node)});loadedScripts.set(src,promise);return promise}
  const nextTask=()=>new Promise(resolve=>setTimeout(resolve,0));
  const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const idle=(fn,timeout=1500)=>{if("requestIdleCallback" in window)requestIdleCallback(fn,{timeout});else setTimeout(fn,300)};

  async function heavy(parts){await script("heavy-data-loader.js");if(typeof window.loadTrainingHeavyData!=="function")throw new Error("Loaderul de date nu este disponibil.");return window.loadTrainingHeavyData(parts)}

  function pruneLegacyRecall(){
    if(typeof questions==="undefined")return;
    const retired=new Set([1,2,3,4,5,6,9,11,12,13,14,15,16,17,18,19,20,21,22,26,27]);
    const recall=q=>q?.kind==="article"||retired.has(Number(q?.id))||/\b(?:la|în|in)\s+ce\s+articol\b|\bcare\s+articol\b/i.test(String(q?.q||""));
    const next=questions.filter(q=>!recall(q));if(next.length===questions.length)return;
    questions.splice(0,questions.length,...next);
    if(typeof questionById!=="undefined"&&questionById?.clear){questionById.clear();questions.forEach(q=>questionById.set(String(q.id),q.id))}
    if(typeof state!=="undefined"){
      const valid=new Set(questions.map(q=>String(q.id)));state.correctIds=(state.correctIds||[]).filter(id=>valid.has(String(id)));state.mistakes=(state.mistakes||[]).filter(id=>valid.has(String(id)));state.questionStats=Object.fromEntries(Object.entries(state.questionStats||{}).filter(([id])=>valid.has(String(id))));state.answered=Object.values(state.questionStats).reduce((s,x)=>s+(Number(x?.attempts)||0),0);state.correct=Object.values(state.questionStats).reduce((s,x)=>s+(Number(x?.correct)||0),0);try{window.TRAINING_PERSISTENCE?.queue(state)}catch{}
    }
    try{renderModules?.();renderStats?.()}catch{}
  }

  let quizBasePromise=null,quizQualityPromise=null,examTrainingPromise=null,omjDataPromise=null,omjPromise=null,calcPromise=null,fullExamPromise=null;
  async function ensureQuizBase(){if(quizBasePromise)return quizBasePromise;quizBasePromise=(async()=>{await style("scenario-questions.css");await script("scenario-questions.js")})().catch(error=>{quizBasePromise=null;throw error});return quizBasePromise}
  async function ensureQuizQuality(){if(!window.TRAINING_HEAVY_DATA?.legislation)return;if(quizQualityPromise)return quizQualityPromise;quizQualityPromise=(async()=>{await style("quiz-quality.css");await script("quiz-quality.js");await script("quiz-quality-safety.js")})().catch(error=>{quizQualityPromise=null;throw error});return quizQualityPromise}
  async function ensureQuiz(){await ensureQuizBase();if(window.TRAINING_HEAVY_DATA?.legislation)ensureQuizQuality().catch(()=>{})}
  async function ensureFunctional(){await script("functional-fixes.js")}

  async function ensureExamTraining(){
    if(examTrainingPromise)return examTrainingPromise;
    examTrainingPromise=(async()=>{
      await style("exam-training.css");
      await Promise.all([heavy(["legislation","official"]),ensureFunctional()]);
      if(window.__EXAM_TRAINING_FAST_LOADED)return;
      await nextTask();
      const snapshots=typeof officialWritten!=="undefined"?officialWritten.map(item=>({item,type:item.type})):[];
      snapshots.forEach(({item,type})=>{item.type=type==="Speță de calcul"?"Calcul":"Răspuns deschis"});
      await script("exam-training.js");
      snapshots.forEach(({item,type})=>{item.type=type});
      window.__EXAM_TRAINING_FAST_LOADED=true;
    })().catch(error=>{examTrainingPromise=null;throw error});
    return examTrainingPromise;
  }

  async function ensureOmjData(){
    if(window.OMJ2188_SYNTHESIS?.articles?.length)return true;
    if(omjDataPromise)return omjDataPromise;
    omjDataPromise=(async()=>{await script("omj2188-data.js");if(window.OMJ2188_DATA_READY?.then)await window.OMJ2188_DATA_READY;if(!window.OMJ2188_SYNTHESIS?.articles?.length)throw new Error("Corpusul OMJ 2188 nu este disponibil.");return true})().catch(error=>{omjDataPromise=null;throw error});
    return omjDataPromise;
  }

  async function ensureOmj(){
    if(omjPromise)return omjPromise;
    omjPromise=(async()=>{await style("omj2188-training.css");await style("omj2188-session.css");await ensureOmjData();if(typeof window.loadOmj2188All==="function")await window.loadOmj2188All();await script("omj2188-training.js")})().catch(error=>{omjPromise=null;throw error});
    return omjPromise;
  }

  async function ensureCalculations(){
    if(calcPromise)return calcPromise;
    calcPromise=(async()=>{await style("calculation-engine.css");await heavy("official");await script("calculation-engine.js");await script("calculation-age-cases.js")})().catch(error=>{calcPromise=null;throw error});
    return calcPromise;
  }

  async function ensureExam(){
    if(fullExamPromise)return fullExamPromise;
    fullExamPromise=(async()=>{
      await style("written-exam-simulation.css");await style("written-exam-history.css");
      await ensureQuizBase();await nextPaint();
      await heavy(["legislation","official"]);await nextPaint();
      await ensureQuizQuality();await nextPaint();
      await script("written-exam-simulation.js",{"data-full-written-exam":"true"});await nextPaint();
      await script("written-exam-history.js");
      idle(()=>Promise.all([script("written-exam-diagnosis-actions.js").catch(()=>{}),script("written-exam-selftest.js").catch(()=>{}),script("scenario-exam-integration.js").catch(()=>{})]),1800);
    })().catch(error=>{fullExamPromise=null;throw error});
    return fullExamPromise;
  }

  function ensureExamShell(){
    const view=document.getElementById("exam"),quick=document.getElementById("exam-area");
    if(!view||document.getElementById("full-written-exam")||document.getElementById("full-exam-loader-card"))return;
    const card=document.createElement("section");card.id="full-exam-loader-card";card.className="panel full-exam-loader-card";
    card.innerHTML='<p class="eyebrow">SIMULARE COMPLETĂ</p><h2>Grile + sinteză + speță de calcul</h2><p>Partea completă se încarcă separat. OMJ și speța de calcul sunt pregătite abia când ajungi la etapele respective.</p><button id="full-exam-load" class="secondary" type="button">Încarcă simularea completă</button><small id="full-exam-load-status" aria-live="polite"></small>';
    if(quick)quick.insertAdjacentElement("afterend",card);else view.appendChild(card);
    const button=card.querySelector("#full-exam-load"),status=card.querySelector("#full-exam-load-status");
    button.addEventListener("click",async()=>{button.disabled=true;button.textContent="Încarc motorul…";status.textContent="Pregătesc doar Partea I și metadatele necesare.";await nextPaint();try{await ensureExam();card.remove()}catch(error){console.error("Simulare completă:",error);button.disabled=false;button.textContent="Reîncearcă simularea completă";status.textContent="Încărcarea nu a reușit. Simularea rapidă rămâne disponibilă."}});
  }

  async function ensureView(id){
    if(viewPromises.has(id))return viewPromises.get(id);
    const promise=(async()=>{
      if(id==="quiz"||id==="mistakes")return ensureQuiz();
      if(id==="synthesis"){await ensureExamTraining();idle(()=>ensureOmj().catch(()=>{}),1800);return}
      if(id==="calculations")return ensureCalculations();
      if(id==="exam"){await ensureQuizBase();ensureExamShell();return}
      if(id==="official"){await Promise.all([heavy("official"),script("generated/controllers/official.js")]);return}
      if(id==="interview"){await Promise.all([heavy("interview"),script("generated/controllers/interview.js")]);return}
      if(id==="legislation"){await Promise.all([heavy("legislation"),script("generated/controllers/legislation.js")]);await script("legislation-virtual.js");return}
      if(id==="learn")return;
    })();
    viewPromises.set(id,promise);try{return await promise}catch(error){viewPromises.delete(id);throw error}
  }

  function refreshLoadedView(id){
    try{
      if(id==="legislation")renderLegislation?.();
      else if(id==="interview"){populateInterviewFilters?.();renderInterview?.()}
      else if(id==="official")renderOfficial?.();
      else if(id==="mistakes")renderMistakes?.();
      else if(id==="quiz")renderStats?.();
      else if(id==="learn")renderCards?.();
      window.TRAINING_WINDOWING?.applyForView(id);
      document.dispatchEvent(new CustomEvent("training:view-ready",{detail:{id}}));
    }catch(error){console.error("Refresh modul:",error)}
  }

  const PREWARM={
    quiz:["scenario-questions.css","scenario-questions.js"],mistakes:["scenario-questions.css","scenario-questions.js"],
    official:["heavy-data-loader.js","generated/official-data.json","generated/controllers/official.js"],
    interview:["heavy-data-loader.js","generated/interview-data.json","generated/controllers/interview.js"],
    legislation:["heavy-data-loader.js","generated/legislation-data.json","generated/controllers/legislation.js","legislation-virtual.js"],
    calculations:["heavy-data-loader.js","generated/official-data.json","calculation-engine.css","calculation-engine.js","calculation-age-cases.js"],
    synthesis:["heavy-data-loader.js","generated/legislation-data.json","generated/official-data.json","functional-fixes.js","exam-training.css","exam-training.js","omj2188-training.css","omj2188-session.css","omj2188-data.js","omj2188-training.js","synthesis-session.js","generated/omj2188/index.json"],
    exam:["scenario-questions.css","scenario-questions.js"]
  };
  function prefetch(url){return fetch(url,{cache:"force-cache"}).then(()=>true).catch(()=>false)}
  function prewarmView(id){if(prewarmPromises.has(id))return prewarmPromises.get(id);const urls=PREWARM[id]||[];const promise=Promise.all(urls.map(prefetch));prewarmPromises.set(id,promise);return promise}
  function schedulePrewarm(){if("serviceWorker" in navigator)return;idle(()=>prewarmView("quiz"),1200)}

  const rawShowView=typeof showView==="function"?showView:null;
  const lazyViews=new Set(["quiz","mistakes","synthesis","calculations","exam","official","interview","legislation","learn"]);
  if(rawShowView){showView=function(id){rawShowView(id);if(!lazyViews.has(id))return;prewarmView(id).catch(()=>{});const host=document.getElementById(id);if(host&&!viewPromises.has(id))host.dataset.loading="true";ensureView(id).then(()=>{if(host){delete host.dataset.loading;delete host.dataset.loadError}refreshLoadedView(id)}).catch(error=>{console.error("Lazy module:",error);if(host){delete host.dataset.loading;host.dataset.loadError="true"}try{toast("Modulul nu s-a putut încărca. Apasă din nou pentru reîncercare.")}catch{}})}}

  document.addEventListener("pointerdown",event=>{const target=event.target.closest?.(".nav-item,[data-go]");const id=target?.dataset?.view||target?.dataset?.go;if(id)prewarmView(id).catch(()=>{})},{capture:true,passive:true});
  document.addEventListener("training:app-ready",schedulePrewarm,{once:true});

  const rawStartQuiz=typeof startQuiz==="function"?startQuiz:null;if(rawStartQuiz){const lazyStart=async function(...args){await ensureQuiz();const fn=startQuiz;if(fn!==lazyStart)return fn(...args);return rawStartQuiz(...args)};startQuiz=lazyStart}
  const rawAdaptive=typeof startAdaptiveQuiz==="function"?startAdaptiveQuiz:null;if(rawAdaptive){startAdaptiveQuiz=async function(...args){await ensureQuiz();return rawAdaptive(...args)}}

  pruneLegacyRecall();
  const initialHash=(()=>{try{return decodeURIComponent(location.hash.replace(/^#/,""))}catch{return ""}})();
  if(initialHash&&initialHash!=="dashboard"&&document.getElementById(initialHash)){rawShowView?.(initialHash);const host=document.getElementById(initialHash);if(host)host.dataset.loading="true";prewarmView(initialHash).catch(()=>{});ensureView(initialHash).then(()=>{if(host)delete host.dataset.loading;refreshLoadedView(initialHash)}).catch(error=>{console.error("Lazy deep-link:",error);if(host){delete host.dataset.loading;host.dataset.loadError="true"}})}
  window.TRAINING_LAZY_LOADER={ensureView,ensureQuiz,ensureQuizQuality,ensureOmj,ensureOmjData,ensureExam,heavy,prewarmView,version:"fast-v14-css-ready"};
})();
