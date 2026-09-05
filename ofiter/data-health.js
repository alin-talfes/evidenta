(()=>{
  if(window.TRAINING_DATA_HEALTH)return;
  const REQUIRED=["legislation","official","interview"];
  const DIRECT_VIEWS=new Set(["interview","official","synthesis","calculations"]);
  const routePromises=new Map();
  let routesInstalled=false;

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const pathOf=value=>{try{return new URL(value,location.href).pathname}catch{return String(value||"").split("?")[0]}};
  const sameAsset=(value,file)=>pathOf(value).endsWith(`/${file}`)||pathOf(value).endsWith(file);

  function scriptMarker(file){
    if(file==="generated/controllers/interview.js")return window.TRAINING_CONTROLLER_INTERVIEW===true;
    if(file==="generated/controllers/official.js")return window.TRAINING_CONTROLLER_OFFICIAL===true;
    if(file==="generated/controllers/legislation.js")return window.TRAINING_CONTROLLER_LEGISLATION===true;
    if(file==="exam-training.js")return window.__EXAM_TRAINING_FAST_LOADED===true||window.__EXAM_TRAINING_DIRECT_LOADED===true;
    if(file==="calculation-engine.js")return !!document.getElementById("generated-calculation-lab");
    if(file==="calculation-age-cases.js")return window.__CALCULATION_AGE_CASES_LOADED===true;
    if(file==="functional-fixes.js")return window.__FUNCTIONAL_FIXES_LOADED===true;
    return false;
  }

  function waitForMarker(file,timeout=1200){
    if(scriptMarker(file))return Promise.resolve(true);
    return new Promise(resolve=>{
      const started=Date.now();
      const tick=()=>{
        if(scriptMarker(file)){resolve(true);return}
        if(Date.now()-started>=timeout){resolve(false);return}
        setTimeout(tick,25);
      };
      tick();
    });
  }

  async function loadScriptOnce(src,file=src.split("?")[0]){
    if(scriptMarker(file))return true;
    const existing=[...document.scripts].find(script=>sameAsset(script.getAttribute("src"),file));
    if(existing){
      const ready=await waitForMarker(file,450);
      if(ready)return true;
    }
    return new Promise((resolve,reject)=>{
      const script=document.createElement("script");
      script.src=src;script.async=false;
      script.onload=()=>resolve(true);
      script.onerror=()=>reject(new Error(`Nu pot încărca ${src}`));
      document.body.appendChild(script);
    });
  }

  function loadStyleOnce(href,file=href.split("?")[0]){
    const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>sameAsset(link.getAttribute("href"),file));
    if(existing){try{if(existing.sheet)return Promise.resolve(true)}catch{} return new Promise((resolve,reject)=>{existing.addEventListener("load",()=>resolve(true),{once:true});existing.addEventListener("error",()=>reject(new Error(`Nu pot încărca ${href}`)),{once:true});setTimeout(()=>resolve(true),500)})}
    return new Promise((resolve,reject)=>{
      const link=document.createElement("link");link.rel="stylesheet";link.href=href;
      link.onload=()=>resolve(true);link.onerror=()=>reject(new Error(`Nu pot încărca ${href}`));document.head.appendChild(link);
    });
  }

  async function ensureHeavy(part){
    if(window.TRAINING_HEAVY_DATA?.[part])return true;
    if(typeof window.loadTrainingHeavyData!=="function")throw new Error("Loaderul dataseturilor nu este disponibil.");
    await window.loadTrainingHeavyData(part);
    if(!window.TRAINING_HEAVY_DATA?.[part])throw new Error(`Datasetul ${part} nu este disponibil.`);
    return true;
  }

  function fallbackView(id,title,error){
    const target=id==="interview"?document.getElementById("interview-list"):id==="official"?document.getElementById("official-sets"):id==="synthesis"?document.getElementById("synthesis-list"):document.getElementById("calculation-list");
    if(!target)return;
    const message=esc(error?.message||error||"Eroare necunoscută");
    target.innerHTML=`<div class="notice warning"><strong>${esc(title)} nu s-a putut încărca.</strong><p>Datele locale nu au fost șterse. Reîncearcă modulul.</p><small>${message}</small><div><button class="secondary" type="button" data-retry-direct="${id}">Reîncearcă</button></div></div>`;
    target.querySelector(`[data-retry-direct="${id}"]`)?.addEventListener("click",()=>openDirectView(id,{force:true}).catch(()=>{}));
  }

  function bindInterviewDirect(){
    if(typeof window.renderInterview!=="function")throw new Error("Rendererul Interviu nu este disponibil.");
    window.populateInterviewFilters?.();
    const category=document.getElementById("interview-category"),difficulty=document.getElementById("interview-difficulty"),search=document.getElementById("interview-search"),simulation=document.getElementById("interview-simulation-start");
    if(category)category.onchange=window.renderInterview;
    if(difficulty)difficulty.onchange=window.renderInterview;
    if(search)search.oninput=window.renderInterview;
    if(simulation)simulation.onclick=()=>window.startInterviewSimulation?.();
    window.renderInterview();
    if(!document.getElementById("interview-list")?.children.length)throw new Error("Lista spețelor de interviu este goală după randare.");
  }

  async function ensureInterviewDirect(){
    await ensureHeavy("interview");
    const count=typeof interviewScenarios!=="undefined"&&Array.isArray(interviewScenarios)?interviewScenarios.length:0;
    if(!count)throw new Error("Datasetul Interviu este gol.");
    await loadScriptOnce("generated/controllers/interview.js?v=2","generated/controllers/interview.js");
    bindInterviewDirect();
  }

  async function ensureOfficialDirect(){
    await ensureHeavy("official");
    const count=typeof officialSets!=="undefined"&&Array.isArray(officialSets)?officialSets.length:0;
    if(!count)throw new Error("Datasetul Subiecte ANP este gol.");
    await loadScriptOnce("generated/controllers/official.js?v=2","generated/controllers/official.js");
    if(typeof window.renderOfficial!=="function")throw new Error("Rendererul Subiecte ANP nu este disponibil.");
    window.renderOfficial();
    if(!document.getElementById("official-sets")?.children.length)throw new Error("Lista Subiectelor ANP este goală după randare.");
  }

  async function ensureExamTrainingDirect(){
    await Promise.all([ensureHeavy("legislation"),ensureHeavy("official")]);
    if(window.__EXAM_TRAINING_FAST_LOADED||window.__EXAM_TRAINING_DIRECT_LOADED){
      if(document.getElementById("synthesis-list")?.children.length&&document.getElementById("calculation-list")?.children.length)return true;
    }
    await loadStyleOnce("exam-training.css?v=2","exam-training.css");
    if(!window.__FUNCTIONAL_FIXES_LOADED){
      const existing=[...document.scripts].some(script=>sameAsset(script.getAttribute("src"),"functional-fixes.js"));
      if(!existing)await loadScriptOnce("functional-fixes.js?v=2","functional-fixes.js");
      window.__FUNCTIONAL_FIXES_LOADED=true
    }
    const existingExam=[...document.scripts].some(script=>sameAsset(script.getAttribute("src"),"exam-training.js"));
    if(existingExam&&!window.__EXAM_TRAINING_FAST_LOADED&&!window.__EXAM_TRAINING_DIRECT_LOADED){
      await new Promise(resolve=>setTimeout(resolve,80));
      if(document.getElementById("synthesis-list")?.children.length&&document.getElementById("calculation-list")?.children.length){window.__EXAM_TRAINING_FAST_LOADED=true}
    }
    if(!window.__EXAM_TRAINING_FAST_LOADED&&!window.__EXAM_TRAINING_DIRECT_LOADED){
      await loadScriptOnce("exam-training.js?v=2","exam-training.js");
      window.__EXAM_TRAINING_DIRECT_LOADED=true;
      window.__EXAM_TRAINING_FAST_LOADED=true;
    }
    const synthesis=document.getElementById("synthesis-list"),calculations=document.getElementById("calculation-list");
    if(!synthesis?.children.length)throw new Error("Lista de Sinteză nu a fost inițializată.");
    if(!calculations?.children.length)throw new Error("Lista spețelor oficiale de calcul nu a fost inițializată.");
    return true;
  }

  async function ensureSynthesisDirect(){await ensureExamTrainingDirect()}

  async function ensureCalculationsDirect(){
    await ensureExamTrainingDirect();
    await loadStyleOnce("calculation-engine.css?v=2","calculation-engine.css");
    await loadScriptOnce("calculation-engine.js?v=2","calculation-engine.js");
    await loadScriptOnce("calculation-age-cases.js?v=2","calculation-age-cases.js");
    window.__CALCULATION_AGE_CASES_LOADED=!!document.getElementById("age-calculation-lab");
    if(!document.getElementById("generated-calculation-lab"))throw new Error("Laboratorul de calcul nu a fost inițializat.");
    if(!document.getElementById("calculation-list")?.children.length)throw new Error("Spețele oficiale de calcul lipsesc.");
  }

  const directLoaders={interview:ensureInterviewDirect,official:ensureOfficialDirect,synthesis:ensureSynthesisDirect,calculations:ensureCalculationsDirect};

  async function openDirectView(id,{force=false}={}){
    if(!DIRECT_VIEWS.has(id))return false;
    if(routePromises.has(id)&&!force)return routePromises.get(id);
    const promise=(async()=>{
      const host=document.getElementById(id);
      window.TRAINING_BOOT?.visualView?.(id);
      if(host){host.dataset.loading="true";delete host.dataset.loadError}
      try{
        await directLoaders[id]();
        if(host){delete host.dataset.loading;delete host.dataset.loadError;host.dataset.directRoute="true"}
        document.dispatchEvent(new CustomEvent("training:view-ready",{detail:{id,direct:true}}));
        audit();
        return true;
      }catch(error){
        console.error(`Direct route ${id}:`,error);
        if(host){delete host.dataset.loading;host.dataset.loadError="true"}
        const titles={interview:"Interviul",official:"Subiectele ANP",synthesis:"Sinteza",calculations:"Calculele"};
        fallbackView(id,titles[id],error);
        return false;
      }finally{routePromises.delete(id)}
    })();
    routePromises.set(id,promise);return promise;
  }

  function installDirectRoutes(){
    if(routesInstalled)return;routesInstalled=true;
    const previousShowView=typeof window.showView==="function"?window.showView:null;
    if(previousShowView){
      window.showView=function(id){
        if(DIRECT_VIEWS.has(id)){openDirectView(id).catch(()=>{});return}
        return previousShowView(id);
      };
    }
    const lazy=window.TRAINING_LAZY_LOADER;
    if(lazy&&typeof lazy.ensureView==="function"){
      const originalEnsureView=lazy.ensureView.bind(lazy);
      lazy.ensureView=id=>DIRECT_VIEWS.has(id)?openDirectView(id):originalEnsureView(id);
    }
    document.addEventListener("click",event=>{
      const target=event.target.closest?.(".nav-item,[data-go]");
      const id=target?.dataset?.view||target?.dataset?.go;
      if(!DIRECT_VIEWS.has(id))return;
      event.preventDefault();event.stopImmediatePropagation();openDirectView(id).catch(()=>{});
    },true);
    const hash=(()=>{try{return decodeURIComponent(location.hash.replace(/^#/,""))}catch{return ""}})();
    if(DIRECT_VIEWS.has(hash)||[...DIRECT_VIEWS].some(id=>document.getElementById(id)?.classList.contains("active-view")))openDirectView(DIRECT_VIEWS.has(hash)?hash:[...DIRECT_VIEWS].find(id=>document.getElementById(id)?.classList.contains("active-view"))).catch(()=>{});
  }

  function repairScenarioStubs(){
    const bank=window.OPERATIONAL_SCENARIOS;
    if(!Array.isArray(bank)||typeof questions==="undefined")return 0;
    const index=new Map(questions.map((question,i)=>[String(question.id),i]));let repaired=0;
    for(const source of bank){
      const key=String(source.id),position=index.get(key);
      if(position===undefined){questions.push(source);index.set(key,questions.length-1);repaired++;continue}
      const current=questions[position];
      if(current?.stub||!current?.q||!Array.isArray(current?.a)||current.a.length<2){questions[position]=source;repaired++}
    }
    if(repaired&&typeof questionById!=="undefined"&&questionById?.clear){questionById.clear();questions.forEach(question=>questionById.set(String(question.id),question.id))}
    if(repaired){try{renderStats?.();renderMistakes?.()}catch{} document.dispatchEvent(new CustomEvent("training:data-repaired",{detail:{scenarioQuestions:repaired}}))}
    return repaired;
  }

  function snapshot(){
    const heavy={...window.TRAINING_HEAVY_DATA},safeLength=value=>Array.isArray(value)?value.length:0;
    const result={heavy,legislationActs:typeof legislationActs!=="undefined"?safeLength(legislationActs):0,officialSets:typeof officialSets!=="undefined"?safeLength(officialSets):0,officialWritten:typeof officialWritten!=="undefined"?safeLength(officialWritten):0,interviewScenarios:typeof interviewScenarios!=="undefined"?safeLength(interviewScenarios):0,questions:typeof questions!=="undefined"?safeLength(questions):0,stubs:typeof questions!=="undefined"?questions.filter(question=>question?.stub).length:0,errors:{...(window.TRAINING_DATA_ERRORS||{})}};
    result.ready=REQUIRED.every(part=>heavy[part]===true)&&result.legislationActs>0&&result.officialSets>0&&result.interviewScenarios>0;return result;
  }

  function audit(){repairScenarioStubs();const result=snapshot();document.documentElement.dataset.dataHealthy=String(result.ready);window.TRAINING_DATA_HEALTH.last=result;return result}
  function scheduleScenarioRepair(){[0,100,250,500,900,1500].forEach(delay=>setTimeout(audit,delay))}

  document.addEventListener("training:heavy-data-ready",audit);
  document.addEventListener("training:app-ready",()=>{installDirectRoutes();audit()});
  document.addEventListener("training:view-ready",event=>{if(["quiz","mistakes","exam"].includes(event.detail?.id))scheduleScenarioRepair();else audit()});
  document.addEventListener("pointerdown",event=>{const target=event.target.closest?.('.nav-item,[data-go],[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start');const view=target?.dataset?.view||target?.dataset?.go;if(["quiz","mistakes","exam"].includes(view)||target?.matches?.('[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start'))scheduleScenarioRepair()},{capture:true,passive:true});

  window.TRAINING_DATA_HEALTH={audit,snapshot,repairScenarioStubs,scheduleScenarioRepair,ensureInterviewDirect,ensureOfficialDirect,ensureSynthesisDirect,ensureCalculationsDirect,openDirectView,installDirectRoutes,last:null,version:"health-v4"};
  installDirectRoutes();setTimeout(audit,0);
})();
