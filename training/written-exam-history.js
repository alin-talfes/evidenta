(()=>{
  const host=document.getElementById("full-written-exam");
  if(!host)return;
  let rendering=false;
  const num=value=>Number.isFinite(Number(value))?Number(value):0;
  const esc=value=>typeof escapeHtml==="function"?escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  function inject(){
    if(rendering||!host.querySelector(".full-exam-launch")||host.querySelector(".full-exam-history"))return;
    const history=Array.isArray(state?.fullWrittenExamHistory)?state.fullWrittenExamHistory.slice(0,5):[];
    if(!history.length)return;
    rendering=true;
    const all=Array.isArray(state.fullWrittenExamHistory)?state.fullWrittenExamHistory:history;
    const average=Math.round(all.reduce((sum,item)=>sum+num(item.average),0)/Math.max(1,all.length));
    const best=Math.max(...all.map(item=>num(item.average)));
    const adaptive=all.filter(item=>item.mode==="adaptive").length;
    const section=document.createElement("section");section.className="full-exam-history";
    section.innerHTML=`<div class="full-exam-history-head"><div><p class="eyebrow">ISTORIC</p><h3>Ultimele simulări complete</h3></div><div class="full-exam-history-kpis"><span><b>${all.length}</b> sesiuni</span><span><b>${average}%</b> medie</span><span><b>${best}%</b> maxim</span><span><b>${adaptive}</b> adaptive</span></div></div><div class="full-exam-history-list">${history.map((item,index)=>`<article><div><strong>${new Date(item.finishedAt).toLocaleDateString("ro-RO")}</strong><span>${item.mode==="adaptive"?"adaptivă":"aleatorie"} · ${item.timedOut?"timp expirat":"predată"}</span></div><dl><div><dt>I · Grile</dt><dd>${num(item.quizPct)}%</dd></div><div><dt>II · Sinteză</dt><dd>${num(item.synthPct)}%</dd></div><div><dt>III · Calcul</dt><dd>${num(item.calcPct)}%</dd></div><div class="overall"><dt>Medie</dt><dd>${num(item.average)}%</dd></div></dl>${item.priorityTitle?`<p class="full-exam-history-priority"><b>${esc(item.priorityPart||"Prioritate")}:</b> ${esc(item.priorityTitle)}</p>`:index===0?'<small>Cea mai recentă</small>':""}</article>`).join("")}</div><p class="full-exam-history-note">Indicatorii și prioritățile sunt pentru antrenament și nu reprezintă baremul ori nota oficială ANP.</p>`;
    const note=host.querySelector(".full-exam-note");(note||host.querySelector(".full-exam-launch"))?.insertAdjacentElement("afterend",section);
    rendering=false;
  }
  new MutationObserver(()=>inject()).observe(host,{childList:true,subtree:true});
  inject();

  const loadHelper=src=>{
    if(document.querySelector(`script[src="${src}"]`))return;
    const script=document.createElement("script");
    script.src=src;
    script.defer=true;
    document.body.appendChild(script);
  };
  loadHelper("written-exam-diagnosis-actions.js");
  loadHelper("written-exam-selftest.js");
})();
