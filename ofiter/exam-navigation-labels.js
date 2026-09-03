(()=>{
  function applyLabels(){
    const desktop=document.querySelector('.sidebar .nav-item[data-view="exam"] span');
    const mobile=document.querySelector('[data-mobile-more-view="exam"] span:last-child');
    if(desktop)desktop.textContent="Simulări";
    if(mobile)mobile.textContent="Simulări";
    const desktopButton=document.querySelector('.sidebar .nav-item[data-view="exam"]');
    if(desktopButton)desktopButton.setAttribute("aria-label","Simulări");
    const mobileButton=document.querySelector('[data-mobile-more-view="exam"]');
    if(mobileButton)mobileButton.setAttribute("aria-label","Simulări");
    const calculationScope=document.querySelector('#generated-calculation-lab .generated-calc-scope small');
    if(calculationScope)calculationScope.textContent="Cazurile 60+ sunt disponibile în modul separat de mai jos. Evadarea rămâne în speța oficială Arad și nu este generată automat până la calibrarea completă a zilelor-limită.";
  }
  function loadScript(src,ready=false){
    if(ready)return Promise.resolve();
    const existing=document.querySelector(`script[src="${src}"]`);
    if(existing)return new Promise(resolve=>{if(existing.dataset.loaded==="true")resolve();else{existing.addEventListener("load",resolve,{once:true});existing.addEventListener("error",resolve,{once:true})}});
    return new Promise(resolve=>{const script=document.createElement("script");script.src=src;script.defer=true;script.onload=()=>{script.dataset.loaded="true";resolve()};script.onerror=resolve;document.body.appendChild(script)});
  }
  function ensureStyle(href){if(document.querySelector(`link[href="${href}"]`))return;const link=document.createElement("link");link.rel="stylesheet";link.href=href;document.head.appendChild(link)}

  let quizEnhancementsPromise=null;
  function loadQuizEnhancements(){
    if(quizEnhancementsPromise)return quizEnhancementsPromise;
    quizEnhancementsPromise=new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0))).then(()=>{
      ensureStyle("quiz-quality.css");ensureStyle("scenario-questions.css");
      return loadScript("quiz-quality.js",!!window.QUIZ_QUALITY_VERSION)
        .then(()=>loadScript("quiz-quality-safety.js",!!window.QUIZ_QUALITY_SAFETY_VERSION))
        .then(()=>loadScript("scenario-questions.js",!!window.OPERATIONAL_SCENARIO_VERSION));
    });
    return quizEnhancementsPromise;
  }
  window.TRAINING_ENSURE_QUIZ_READY=loadQuizEnhancements;
  const loadScenarioExamIntegration=()=>loadQuizEnhancements().then(()=>loadScript("scenario-exam-integration.js",!!window.SCENARIO_EXAM_INTEGRATION));
  const rendered=new Set(["dashboard"]);
  const deferred=id=>document.getElementById(id)?.dataset.fastBootDeferred==="true";
  const clearDeferred=id=>{const node=document.getElementById(id);if(node)delete node.dataset.fastBootDeferred};
  function ensureCoreView(id){
    if(id==="bibliography"&&!rendered.has(id)){renderBibliography?.();rendered.add(id);clearDeferred("bibliography-list")}
    if(id==="official"&&!rendered.has(id)){renderOfficial?.();rendered.add(id);clearDeferred("official-sets")}
    if(id==="legislation"&&deferred("legislation-content")){renderLegislation?.();clearDeferred("legislation-content")}
    if(id==="interview"&&(deferred("interview-list")||deferred("interview-summary"))){renderInterview?.();clearDeferred("interview-list");clearDeferred("interview-summary");clearDeferred("interview-profile")}
    if(id==="mistakes"&&deferred("mistakes-list")){renderMistakes?.();clearDeferred("mistakes-list")}
    if(id==="synthesis"&&deferred("synthesis-list")){
      const input=document.getElementById("synthesis-search");
      if(input)input.dispatchEvent(new Event("input",{bubbles:true}));
      clearDeferred("synthesis-list");
    }
  }

  async function ensureView(id){
    ensureCoreView(id);
    if(id==="quiz"){await loadQuizEnhancements();return}
    if(id==="synthesis"){window.TRAINING_UNLOCK_OMJ?.();return}
    if(id==="exam"){window.TRAINING_UNLOCK_OMJ?.();await loadScenarioExamIntegration();return}
  }
  window.TRAINING_ENSURE_VIEW=ensureView;

  if(typeof showView==="function"&&!showView.__performanceWrapped){
    const baseShowView=showView;
    const wrapped=function(id){const result=baseShowView.apply(this,arguments);ensureView(id).catch(error=>console.warn("[training] lazy view",error));return result};
    wrapped.__performanceWrapped=true;showView=wrapped;
  }

  document.querySelectorAll("[data-start-adaptive]").forEach(button=>button.onclick=async()=>{showView("quiz");await loadQuizEnhancements();startAdaptiveQuiz?.()});
  const quizStart=document.getElementById("quiz-start");if(quizStart)quizStart.onclick=async()=>{await loadQuizEnhancements();startQuiz?.()};
  const adaptiveStart=document.getElementById("adaptive-start");if(adaptiveStart)adaptiveStart.onclick=async()=>{await loadQuizEnhancements();startAdaptiveQuiz?.()};
  const examStart=document.getElementById("exam-start");if(examStart)examStart.onclick=async()=>{await loadQuizEnhancements();startQuiz?.(null,true)};

  applyLabels();requestAnimationFrame(applyLabels);
  setTimeout(()=>{const active=document.querySelector('.sidebar .nav-item.active')?.dataset.view||document.querySelector('.view.active-view')?.id||"dashboard";ensureView(active).catch(()=>{})},0);
})();
