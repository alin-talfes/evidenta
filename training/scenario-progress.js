(()=>{
  const VERSION="scenario-progress-v1";
  if(window.SCENARIO_PROGRESS_VERSION===VERSION)return;
  window.SCENARIO_PROGRESS_VERSION=VERSION;

  const LABELS={primire:"Primire",situatie:"Situație juridică",transfer:"Transfer",liberare:"Punere în libertate",procedura:"Acte și termene judiciare",preventiv:"Măsuri preventive",dosar:"Dosar individual",integritate:"Integritate"};
  const scenarios=()=>Array.isArray(window.OPERATIONAL_SCENARIOS)?window.OPERATIONAL_SCENARIOS:[];
  const stat=q=>state?.questionStats?.[String(q.id)]||{};
  const weakness=q=>{const s=stat(q),a=Number(s.attempts||0),c=Number(s.correct||0),acc=a?c/a:0,next=Date.parse(s.nextReview||0)||0,last=Date.parse(s.lastSeen||0)||0,due=next&&next<=Date.now(),wrong=Array.isArray(state?.mistakes)&&state.mistakes.some(id=>String(id)===String(q.id)),age=last?Math.min(365,(Date.now()-last)/86400000):365;return (wrong?8000:0)+(due?6500:0)+(a===0?3000:0)+(1-acc)*2500+age*2+Math.random()*8};
  const shuffle=values=>{const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out};

  function topicStats(){
    const rows={};for(const q of scenarios()){const key=q.scenarioTopic||"other",row=rows[key]||(rows[key]={attempts:0,correct:0,questions:0,seen:0});const s=stat(q),a=Number(s.attempts||0),c=Number(s.correct||0);row.questions++;row.attempts+=a;row.correct+=c;if(a)row.seen++}
    return rows;
  }
  function weakestTopic(){
    const rows=topicStats(),entries=Object.entries(rows);if(!entries.length)return null;
    return entries.map(([key,row])=>({key,row,score:row.attempts?100-row.correct/row.attempts*100:70+(row.questions-row.seen)*3})).sort((a,b)=>b.score-a.score)[0];
  }
  function pickAdaptive(){
    const all=scenarios(),topic=document.getElementById("scenario-topic")?.value||"all",size=Math.max(1,Number(document.getElementById("quiz-size")?.value)||10),pool=all.filter(q=>topic==="all"||q.scenarioTopic===topic),ranked=[...pool].sort((a,b)=>weakness(b)-weakness(a)),chosen=[],topicCount=new Map();
    for(const q of ranked){if(chosen.length>=size)break;const key=q.scenarioTopic||"other",count=topicCount.get(key)||0,max=topic==="all"?Math.max(2,Math.ceil(size*.3)):size;if(count>=max)continue;chosen.push(q);topicCount.set(key,count+1)}
    if(chosen.length<size)for(const q of ranked){if(chosen.length>=size)break;if(!chosen.includes(q))chosen.push(q)}
    return shuffle(chosen).slice(0,Math.min(size,pool.length));
  }
  function startAdaptive(){const pool=pickAdaptive();if(!pool.length){try{toast("Nu există spețe pentru filtrul selectat.")}catch{}return}if(typeof startQuiz==="function")startQuiz(pool,false)}

  function render(){
    const panel=document.getElementById("scenario-training-panel");if(!panel)return;
    let box=document.getElementById("scenario-progress");if(!box){box=document.createElement("div");box.id="scenario-progress";box.className="scenario-progress";panel.appendChild(box)}
    const all=scenarios(),attempted=all.filter(q=>Number(stat(q).attempts||0)>0),attempts=attempted.reduce((sum,q)=>sum+Number(stat(q).attempts||0),0),correct=attempted.reduce((sum,q)=>sum+Number(stat(q).correct||0),0),accuracy=attempts?Math.round(correct/attempts*100):null,weak=weakestTopic();
    box.innerHTML=`<div><span>Spețe lucrate</span><strong>${attempted.length}/${all.length}</strong></div><div><span>Acuratețe</span><strong>${accuracy==null?"—":`${accuracy}%`}</strong></div><div><span>Focus adaptiv</span><strong>${weak?LABELS[weak.key]||weak.key:"—"}</strong></div><button id="scenario-adaptive-start" type="button" class="secondary">Spețe adaptive</button>`;
    box.querySelector("#scenario-adaptive-start")?.addEventListener("click",startAdaptive);
  }

  function install(){if(!scenarios().length)return;render();
    if(typeof recordQuestionResult==="function"&&!recordQuestionResult.__scenarioProgress){const base=recordQuestionResult;const wrapped=function(q,ok){const result=base.apply(this,arguments);if(q?.scenario)setTimeout(render,0);return result};wrapped.__scenarioProgress=true;recordQuestionResult=wrapped}
    document.getElementById("scenario-topic")?.addEventListener("change",render);
  }
  const observer=new MutationObserver(()=>{if(document.getElementById("scenario-training-panel"))install()});
  const quiz=document.getElementById("quiz");if(quiz)observer.observe(quiz,{childList:true,subtree:true});
  [150,600,1600,3200].forEach(delay=>setTimeout(install,delay));
})();
