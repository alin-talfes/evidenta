(()=>{
  if(window.loadTrainingHeavyData)return;
  const loaded={legislation:false,official:false,interview:false};
  const URLS={legislation:"./generated/legislation-data.json",official:"./generated/official-data.json",interview:"./generated/interview-data.json"};
  const inflight=new Map();

  async function loadPart(part){
    if(inflight.has(part))return inflight.get(part);
    const url=URLS[part];
    if(!url)throw new Error(`Dataset necunoscut: ${part}`);
    const promise=fetch(url,{cache:"force-cache"})
      .then(async response=>{if(!response.ok)throw new Error(`${url}: ${response.status}`);return response.json()})
      .finally(()=>inflight.delete(part));
    inflight.set(part,promise);
    return promise;
  }

  function syncQuestionIndex(){if(typeof questionById!=="undefined"&&questionById?.clear){questionById.clear();questions.forEach(q=>questionById.set(String(q.id),q.id))}}
  function refreshLegislationFilter(){const select=document.getElementById("legislation-act");if(!select)return;const current=select.value;select.innerHTML='<option value="all">Toate actele</option>';legislationActs.forEach(act=>select.insertAdjacentHTML("beforeend",`<option value="${act.id}">${act.title}</option>`));select.value=[...select.options].some(option=>option.value===current)?current:"all";if(typeof renderLegislation==="function")select.onchange=renderLegislation}
  function refreshInterviewFilter(){const select=document.getElementById("interview-category");if(!select)return;const current=select.value;select.innerHTML='<option value="all">Toate categoriile</option>';[...new Set(interviewScenarios.map(item=>item.category).filter(Boolean))].forEach(category=>select.insertAdjacentHTML("beforeend",`<option value="${category}">${category}</option>`));select.value=[...select.options].some(option=>option.value===current)?current:"all"}
  function applyPayload(payload){
    if(payload.legislation&&!loaded.legislation){legislationActs.splice(0,legislationActs.length,...payload.legislation);loaded.legislation=true;refreshLegislationFilter()}
    if(payload.official&&!loaded.official){const {written=[],sets=[],questions:extra=[]}=payload.official;officialWritten.splice(0,officialWritten.length,...written);officialSets.splice(0,officialSets.length,...sets);if(extra.length){const ids=new Set(extra.map(q=>String(q.id))),retained=questions.filter(q=>!ids.has(String(q.id)));questions.splice(0,questions.length,...retained,...extra)}const set=officialSets.find(item=>item.id==="anp2024");if(set)set.legalNote=String(set.legalNote||"").replace(/pragul legal actual este 65 de ani/i,"pragul legal actual pentru această fracție este 60 de ani");syncQuestionIndex();loaded.official=true}
    if(payload.interview&&!loaded.interview){interviewScenarios.splice(0,interviewScenarios.length,...payload.interview);loaded.interview=true;refreshInterviewFilter()}
  }

  async function loadTrainingHeavyData(parts){
    const requested=[...new Set((Array.isArray(parts)?parts:[parts]).filter(Boolean))].filter(part=>!loaded[part]);
    if(!requested.length)return loaded;
    const entries=await Promise.all(requested.map(async part=>[part,await loadPart(part)]));
    applyPayload(Object.fromEntries(entries));
    window.TRAINING_HEAVY_DATA={...loaded};
    window.TRAINING_DATA_PARTIAL=!(loaded.legislation&&loaded.official&&loaded.interview);
    document.dispatchEvent(new CustomEvent("training:heavy-data-ready",{detail:{parts:requested}}));
    return loaded;
  }

  window.loadTrainingHeavyData=loadTrainingHeavyData;
  window.TRAINING_HEAVY_DATA={...loaded};
})();
