(()=>{
  if(window.TRAINING_DATA_HEALTH)return;
  const REQUIRED=["legislation","official","interview"];
  let interviewPromise=null,interviewRouteInstalled=false;

  function loadScriptOnce(src){
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(script=>script.getAttribute('src')===src);
      if(existing){
        if(existing.dataset.trainingLoaded==='true'||existing.readyState==='complete'){resolve();return}
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error(`Nu pot încărca ${src}`)),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;script.async=false;
      script.onload=()=>{script.dataset.trainingLoaded='true';resolve()};
      script.onerror=()=>reject(new Error(`Nu pot încărca ${src}`));
      document.body.appendChild(script);
    });
  }

  function fallbackInterview(error){
    const list=document.getElementById('interview-list');
    const summary=document.getElementById('interview-summary');
    if(summary)summary.innerHTML='';
    if(!list)return;
    const message=String(error?.message||error||'Eroare necunoscută').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    list.innerHTML=`<div class="notice warning"><strong>Spețele pentru interviu nu s-au putut încărca.</strong><p>Datele nu au fost pierdute. Reîncearcă încărcarea modulului.</p><small>${message}</small><div><button id="retry-interview-direct" class="secondary" type="button">Reîncearcă</button></div></div>`;
    document.getElementById('retry-interview-direct')?.addEventListener('click',()=>ensureInterviewDirect().catch(()=>{}));
  }

  function bindInterviewDirect(){
    const render=window.renderInterview;
    if(typeof render!=="function")throw new Error('Rendererul Interviu nu este disponibil.');
    if(typeof window.populateInterviewFilters==='function')window.populateInterviewFilters();
    const category=document.getElementById('interview-category');
    const difficulty=document.getElementById('interview-difficulty');
    const search=document.getElementById('interview-search');
    const simulation=document.getElementById('interview-simulation-start');
    if(category)category.onchange=render;
    if(difficulty)difficulty.onchange=render;
    if(search)search.oninput=render;
    if(simulation)simulation.onclick=()=>{
      if(typeof window.startInterviewSimulation==='function')window.startInterviewSimulation();
      else fallbackInterview(new Error('Simularea de interviu nu este disponibilă.'));
    };
    render();
  }

  async function ensureInterviewDirect(){
    if(interviewPromise)return interviewPromise;
    interviewPromise=(async()=>{
      const host=document.getElementById('interview');
      if(host){host.dataset.loading='true';delete host.dataset.loadError}
      try{
        if(typeof window.loadTrainingHeavyData==='function'&&!window.TRAINING_HEAVY_DATA?.interview)await window.loadTrainingHeavyData('interview');
        const count=typeof interviewScenarios!=='undefined'&&Array.isArray(interviewScenarios)?interviewScenarios.length:0;
        if(!window.TRAINING_HEAVY_DATA?.interview||!count)throw new Error('Datasetul Interviu este indisponibil sau gol.');
        await loadScriptOnce('generated/controllers/interview.js?v=2');
        bindInterviewDirect();
        if(host){delete host.dataset.loading;delete host.dataset.loadError;host.dataset.directRoute='true'}
        document.dispatchEvent(new CustomEvent('training:view-ready',{detail:{id:'interview',direct:true}}));
        return true;
      }catch(error){
        console.error('Interview direct route:',error);
        if(host){delete host.dataset.loading;host.dataset.loadError='true'}
        fallbackInterview(error);
        return false;
      }finally{
        interviewPromise=null;
      }
    })();
    return interviewPromise;
  }

  function installInterviewDirectRoute(){
    if(interviewRouteInstalled)return;
    interviewRouteInstalled=true;
    const previousShowView=typeof window.showView==='function'?window.showView:null;
    if(previousShowView){
      window.showView=function(id){
        if(id==='interview'){
          window.TRAINING_BOOT?.visualView?.('interview');
          ensureInterviewDirect().catch(()=>{});
          return;
        }
        return previousShowView(id);
      };
    }
    const lazy=window.TRAINING_LAZY_LOADER;
    if(lazy&&typeof lazy.ensureView==='function'){
      const originalEnsureView=lazy.ensureView.bind(lazy);
      lazy.ensureView=id=>id==='interview'?ensureInterviewDirect():originalEnsureView(id);
    }
    const hash=(()=>{try{return decodeURIComponent(location.hash.replace(/^#/,''))}catch{return ''}})();
    if(hash==='interview'||document.getElementById('interview')?.classList.contains('active-view'))ensureInterviewDirect().catch(()=>{});
  }

  function repairScenarioStubs(){
    const bank=window.OPERATIONAL_SCENARIOS;
    if(!Array.isArray(bank)||typeof questions==="undefined")return 0;
    const index=new Map(questions.map((question,i)=>[String(question.id),i]));
    let repaired=0;
    for(const source of bank){
      const key=String(source.id),position=index.get(key);
      if(position===undefined){
        questions.push(source);index.set(key,questions.length-1);repaired++;continue;
      }
      const current=questions[position];
      if(current?.stub||!current?.q||!Array.isArray(current?.a)||current.a.length<2){
        questions[position]=source;repaired++;
      }
    }
    if(repaired&&typeof questionById!=="undefined"&&questionById?.clear){
      questionById.clear();
      questions.forEach(question=>questionById.set(String(question.id),question.id));
    }
    if(repaired){
      try{renderStats?.();renderMistakes?.()}catch{}
      document.dispatchEvent(new CustomEvent("training:data-repaired",{detail:{scenarioQuestions:repaired}}));
    }
    return repaired;
  }

  function snapshot(){
    const heavy={...window.TRAINING_HEAVY_DATA};
    const safeLength=value=>Array.isArray(value)?value.length:0;
    const result={
      heavy,
      legislationActs:typeof legislationActs!=="undefined"?safeLength(legislationActs):0,
      officialSets:typeof officialSets!=="undefined"?safeLength(officialSets):0,
      officialWritten:typeof officialWritten!=="undefined"?safeLength(officialWritten):0,
      interviewScenarios:typeof interviewScenarios!=="undefined"?safeLength(interviewScenarios):0,
      questions:typeof questions!=="undefined"?safeLength(questions):0,
      stubs:typeof questions!=="undefined"?questions.filter(question=>question?.stub).length:0,
      errors:{...(window.TRAINING_DATA_ERRORS||{})}
    };
    result.ready=REQUIRED.every(part=>heavy[part]===true)&&result.legislationActs>0&&result.officialSets>0&&result.interviewScenarios>0;
    return result;
  }

  function audit(){
    repairScenarioStubs();
    const result=snapshot();
    document.documentElement.dataset.dataHealthy=String(result.ready);
    window.TRAINING_DATA_HEALTH.last=result;
    return result;
  }

  function scheduleScenarioRepair(){
    [0,100,250,500,900,1500].forEach(delay=>setTimeout(audit,delay));
  }

  document.addEventListener("training:heavy-data-ready",audit);
  document.addEventListener("training:app-ready",()=>{installInterviewDirectRoute();audit()});
  document.addEventListener("training:view-ready",event=>{
    if(["quiz","mistakes","exam"].includes(event.detail?.id))scheduleScenarioRepair();
    else audit();
  });
  document.addEventListener("pointerdown",event=>{
    const target=event.target.closest?.('.nav-item,[data-go],[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start');
    const view=target?.dataset?.view||target?.dataset?.go;
    if(["quiz","mistakes","exam"].includes(view)||target?.matches?.('[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start'))scheduleScenarioRepair();
  },{capture:true,passive:true});

  window.TRAINING_DATA_HEALTH={audit,snapshot,repairScenarioStubs,scheduleScenarioRepair,ensureInterviewDirect,installInterviewDirectRoute,last:null,version:"health-v2"};
  installInterviewDirectRoute();
  setTimeout(audit,0);
})();
