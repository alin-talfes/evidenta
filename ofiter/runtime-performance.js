(()=>{
  if(window.TRAINING_RUNTIME_PERF)return;
  window.TRAINING_RUNTIME_PERF="runtime-v3-idb";

  const raf=callback=>requestAnimationFrame(callback);
  const active=id=>document.getElementById(id)?.classList.contains("active-view");
  const debounce=(fn,wait=140)=>{let timer=0;return function(...args){clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),wait)}};

  let saveTimer=0,statsQueued=false;
  const persistNow=()=>{
    clearTimeout(saveTimer);saveTimer=0;
    try{if(typeof state!=="undefined"){if(window.TRAINING_PERSISTENCE)window.TRAINING_PERSISTENCE.queue(state,0);else localStorage.setItem("evidenta-training",JSON.stringify(state))}}catch{}
  };
  const queuePersist=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(persistNow,180)};
  const baseRenderStats=typeof renderStats==="function"?renderStats:null;
  const queueStats=()=>{if(statsQueued)return;statsQueued=true;raf(()=>{statsQueued=false;try{baseRenderStats?.()}catch{}})};
  if(baseRenderStats)renderStats=function(){queueStats()};
  if(typeof save==="function")save=function(){queuePersist();queueStats()};

  let modulesDirty=true,modulesQueued=false;
  const baseRenderModules=typeof renderModules==="function"?renderModules:null;
  if(baseRenderModules){renderModules=function(){modulesDirty=true;if(!active("dashboard")||modulesQueued)return;modulesQueued=true;raf(()=>{modulesQueued=false;if(!active("dashboard"))return;modulesDirty=false;try{baseRenderModules()}catch{}})}}

  let mistakesDirty=true,mistakesQueued=false;
  const baseRenderMistakes=typeof renderMistakes==="function"?renderMistakes:null;
  if(baseRenderMistakes){renderMistakes=function(){mistakesDirty=true;if(!active("mistakes")||mistakesQueued)return;mistakesQueued=true;raf(()=>{mistakesQueued=false;if(!active("mistakes"))return;mistakesDirty=false;try{baseRenderMistakes()}catch{}})}}

  const baseShowView=typeof showView==="function"?showView:null;
  if(baseShowView){showView=function(id){const result=baseShowView(id);if(id==="dashboard"){if(modulesDirty)renderModules?.();renderStats?.()}if(id==="mistakes"&&mistakesDirty)renderMistakes?.();return result}}

  const searchRenderers={"legislation-search":()=>{try{renderLegislation?.()}catch{}},"interview-search":()=>{try{renderInterview?.()}catch{}}};
  Object.entries(searchRenderers).forEach(([id,render])=>{const input=document.getElementById(id);if(!input)return;const run=debounce(render,160);input.addEventListener("input",event=>{event.stopImmediatePropagation();run()},{capture:true})});

  document.addEventListener("input",event=>{
    const element=event.target;if(!(element instanceof HTMLTextAreaElement))return;
    if(element.matches("[data-written-draft]")){event.stopImmediatePropagation();if(typeof state!=="undefined"){state.writtenDrafts[element.dataset.writtenDraft]=element.value;queuePersist()}return}
    if(element.id==="interview-draft"){event.stopImmediatePropagation();const id=typeof activeInterview!=="undefined"?activeInterview:null;if(!id)return;if(typeof interviewSimulation!=="undefined"&&interviewSimulation?.active)interviewSimulation.drafts[id]=element.value;else if(typeof state!=="undefined"){state.interviewDrafts[id]=element.value;queuePersist()}}
  },true);

  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")persistNow()});
  window.addEventListener("pagehide",persistNow,{capture:true});
})();
