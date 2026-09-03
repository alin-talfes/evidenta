(()=>{
  const dashboard=document.getElementById("dashboard");
  if(!dashboard||document.getElementById("dashboard-study-plan"))return;

  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const escape=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const targetForPart=part=>String(part||"").includes("II")?"synthesis":String(part||"").includes("III")?"calculations":String(part||"").includes("I")?"quiz":"exam";
  const labelForView=view=>view==="quiz"?"Lucrează grilele":view==="synthesis"?"Exersează sinteza":view==="calculations"?"Lucrează calculele":"Pornește simularea";

  function fallbackPriority(){
    let due=0;
    try{if(typeof dueQuestions==="function")due=dueQuestions().length}catch{}
    if(due>0)return {view:"quiz",part:"Partea I",title:`${due} grile sunt scadente`,detail:"Începe cu repetarea programată: greșelile și întrebările ajunse la termen au prioritate."};

    const synthesisRows=[...Object.values(state.synthesisResults||{}),...Object.values(state.omjSynthesisResults||{})].filter(row=>num(row.attempts)>0);
    const synthesisWeak=synthesisRows.filter(row=>num(row.last??row.best)<95);
    if(synthesisWeak.length){
      const score=Math.min(...synthesisWeak.map(row=>num(row.last??row.best)));
      return {view:"synthesis",part:"Partea II",title:"Sinteza are nevoie de consolidare",detail:`Există texte sub ținta internă de 95%; cel mai mic scor înregistrat este ${score}%.`};
    }

    const calcStats=state.calculationSkillStats||{};
    const calcRows=Object.entries(calcStats).filter(([,row])=>num(row.totalFields)>0).map(([kind,row])=>({kind,accuracy:Math.round(num(row.correctFields)/Math.max(1,num(row.totalFields))*100)}));
    if(calcRows.length){
      const weakest=calcRows.sort((a,b)=>a.accuracy-b.accuracy)[0];
      const label=weakest.kind==="regime"?"regim + 1/5":weakest.kind==="age60"?"fracția specială 60+":"pedeapsă + fracții";
      if(weakest.accuracy<90)return {view:"calculations",part:"Partea III",title:`Consolidează ${label}`,detail:`Acuratețea istorică pe acest tip de calcul este ${weakest.accuracy}%.`};
    }

    return {view:"exam",part:"Diagnostic",title:"Fă o simulare completă adaptivă",detail:"Nu există încă suficiente date pentru a stabili un punct slab dominant. O simulare completă va crea diagnosticul inițial."};
  }

  function currentPriority(){
    const latest=Array.isArray(state.fullWrittenExamHistory)&&state.fullWrittenExamHistory[0];
    if(!latest?.priorityTitle)return fallbackPriority();
    const view=targetForPart(latest.priorityPart),score=view==="quiz"?num(latest.quizPct):view==="synthesis"?num(latest.synthPct):view==="calculations"?num(latest.calcPct):num(latest.average);
    return {view,part:latest.priorityPart||"Prioritate",title:latest.priorityTitle,detail:`Ultima simulare completă indică ${score}% pe această componentă. Lucrează aici înainte de următoarea simulare.`};
  }

  const panel=document.createElement("section");
  panel.id="dashboard-study-plan";
  panel.className="dashboard-study-plan";
  const examPath=dashboard.querySelector(".exam-path");
  if(examPath)examPath.insertAdjacentElement("afterend",panel);else dashboard.querySelector(".dashboard-grid")?.insertAdjacentElement("beforebegin",panel);

  function render(){
    const priority=currentPriority();
    panel.innerHTML=`<div class="dashboard-study-plan-copy"><p class="eyebrow">CE LUCREZI ACUM</p><div class="dashboard-study-plan-title"><span>${escape(priority.part)}</span><h2>${escape(priority.title)}</h2></div><p>${escape(priority.detail)}</p></div><div class="dashboard-study-plan-actions"><button id="dashboard-priority-open" class="primary" type="button">${escape(labelForView(priority.view))} →</button>${priority.view!=="exam"?'<button id="dashboard-priority-sim" class="secondary" type="button">Simulare diagnostică</button>':""}</div>`;
    document.getElementById("dashboard-priority-open")?.addEventListener("click",()=>{if(typeof showView==="function")showView(priority.view);else document.querySelector(`.sidebar .nav-item[data-view="${priority.view}"]`)?.click()});
    document.getElementById("dashboard-priority-sim")?.addEventListener("click",()=>{if(typeof showView==="function")showView("exam");else document.querySelector('.sidebar .nav-item[data-view="exam"]')?.click()});
  }

  new MutationObserver(()=>{if(dashboard.classList.contains("active-view"))render()}).observe(dashboard,{attributes:true,attributeFilter:["class"]});
  const review=document.getElementById("review-value");if(review)new MutationObserver(render).observe(review,{childList:true,subtree:true});
  render();
  window.refreshDashboardStudyPlan=render;
})();
