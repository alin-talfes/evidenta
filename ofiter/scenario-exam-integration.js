(()=>{
  const VERSION="scenario-exam-v1";
  if(window.SCENARIO_EXAM_INTEGRATION===VERSION)return;
  window.SCENARIO_EXAM_INTEGRATION=VERSION;

  const norm=value=>String(value??"").toLowerCase();
  const shuffle=values=>{const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};
  const statsFor=q=>state?.questionStats?.[String(q.id)]||{};
  function weakness(q){
    const stats=statsFor(q),attempts=Number(stats.attempts||0),correct=Number(stats.correct||0),accuracy=attempts?correct/attempts:0,next=Date.parse(stats.nextReview||0)||0,last=Date.parse(stats.lastSeen||0)||0;
    const due=next&&next<=Date.now(),mistake=Array.isArray(state?.mistakes)&&state.mistakes.some(id=>String(id)===String(q.id)),age=last?Math.min(365,(Date.now()-last)/86400000):365;
    return (mistake?7000:0)+(due?6000:0)+(attempts===0?2800:0)+(1-accuracy)*2200+age*2+Math.random()*10;
  }
  function lawBalanced(pool,count,adaptive){
    const ranked=adaptive?[...pool].sort((a,b)=>weakness(b)-weakness(a)):shuffle(pool),chosen=[],laws=new Map();
    for(const q of ranked){
      if(chosen.length>=count)break;
      const law=String(q.law||"other"),n=laws.get(law)||0,max=Math.max(2,Math.ceil(count*.3));
      if(n>=max)continue;
      chosen.push(q);laws.set(law,n+1);
    }
    if(chosen.length<count)for(const q of ranked){if(chosen.length>=count)break;if(!chosen.includes(q))chosen.push(q)}
    return chosen.slice(0,count);
  }
  function scenarioBalanced(pool,count,adaptive){
    const ranked=adaptive?[...pool].sort((a,b)=>weakness(b)-weakness(a)):shuffle(pool),chosen=[],topics=new Map();
    for(const q of ranked){
      if(chosen.length>=count)break;
      const topic=q.scenarioTopic||"other",n=topics.get(topic)||0;
      if(n>=2)continue;
      chosen.push(q);topics.set(topic,n+1);
    }
    if(chosen.length<count)for(const q of ranked){if(chosen.length>=count)break;if(!chosen.includes(q))chosen.push(q)}
    return chosen.slice(0,count);
  }
  function buildExamPool(mode){
    const source=Array.isArray(questions)?questions:[],adaptive=mode!=="random",scenarios=source.filter(q=>q?.scenario===true&&Array.isArray(q.a)&&Number.isInteger(q.c)),other=source.filter(q=>q?.scenario!==true&&Array.isArray(q.a)&&Number.isInteger(q.c)&&(q.kind||"content")!=="article");
    const scenarioTarget=Math.min(adaptive?8:6,scenarios.length),scenarioPick=scenarioBalanced(scenarios,scenarioTarget,adaptive),restTarget=Math.max(0,20-scenarioPick.length),otherPick=lawBalanced(other,restTarget,adaptive),combined=[...scenarioPick,...otherPick];
    if(combined.length<20){const used=new Set(combined.map(q=>String(q.id)));const remaining=(adaptive?[...source].sort((a,b)=>weakness(b)-weakness(a)):shuffle(source)).filter(q=>!used.has(String(q.id))&&Array.isArray(q.a)&&Number.isInteger(q.c)&&(q.kind||"content")!=="article");combined.push(...remaining.slice(0,20-combined.length))}
    return {pool:shuffle(combined).slice(0,20),scenarioCount:scenarioPick.length,adaptive};
  }
  function refreshPlan(){
    const host=document.getElementById("full-written-exam");if(!host)return;
    const first=host.querySelector(".full-exam-plan>div:first-child span");if(first)first.textContent="minimum 8 spețe în modul adaptiv";
    const note=host.querySelector(".full-exam-note");if(note&&!note.dataset.scenarioNote){note.dataset.scenarioNote="true";note.textContent+=` Partea I include deliberat spețe operaționale: minimum 8/20 în modul adaptiv și 6/20 în modul aleatoriu.`}
  }
  function wrapStart(){
    refreshPlan();
    const button=document.getElementById("full-exam-start");if(!button||button.dataset.scenarioWrapped==="true"||typeof button.onclick!=="function")return;
    const original=button.onclick;button.dataset.scenarioWrapped="true";
    button.onclick=async function(event){
      try{if(window.OMJ2188_DATA_READY&&typeof window.OMJ2188_DATA_READY.then==="function")await window.OMJ2188_DATA_READY}catch{}
      await new Promise(resolve=>setTimeout(resolve,90));
      const mode=document.getElementById("full-exam-mode")?.value||"adaptive",snapshot=[...questions],selection=buildExamPool(mode);
      if(selection.pool.length<20){return original.call(this,event)}
      questions.splice(0,questions.length,...selection.pool);
      window.OPERATIONAL_SCENARIO_EXAM_AUDIT={version:VERSION,mode,scenarioCount:selection.scenarioCount,total:selection.pool.length,ids:selection.pool.map(q=>q.id)};
      try{return await original.call(this,event)}finally{questions.splice(0,questions.length,...snapshot)}
    };
  }

  const observer=new MutationObserver(()=>wrapStart());
  const exam=document.getElementById("exam");if(exam)observer.observe(exam,{childList:true,subtree:true});
  [0,250,900,2200].forEach(delay=>setTimeout(wrapStart,delay));
})();
