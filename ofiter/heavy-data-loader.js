(()=>{
  if(window.loadTrainingHeavyData)return;
  const DATA_REVISION="15";
  const loaded={legislation:false,official:false,interview:false};
  const FILES={legislation:"legislation-data.json",official:"official-data.json",interview:"interview-data.json"};
  const inflight=new Map();
  const errors={};

  function urlsFor(part){
    const file=FILES[part];
    if(!file)throw new Error(`Dataset necunoscut: ${part}`);
    const base=`./generated/${file}`;
    return{fresh:`${base}?v=${DATA_REVISION}`,fallback:base};
  }

  function validate(part,payload){
    if(part==="legislation"){
      if(!Array.isArray(payload)||payload.length<6)throw new Error("Datasetul Legislație este gol sau incomplet.");
      for(const act of payload)if(!act||typeof act.id!=="string"||!Array.isArray(act.articles))throw new Error("Structură invalidă în datasetul Legislație.");
      return payload;
    }
    if(part==="official"){
      if(!payload||typeof payload!=="object"||!Array.isArray(payload.written)||!Array.isArray(payload.sets)||!Array.isArray(payload.questions))throw new Error("Structură invalidă în datasetul Subiecte ANP.");
      return payload;
    }
    if(part==="interview"){
      if(!Array.isArray(payload)||!payload.length)throw new Error("Datasetul Interviu este gol sau invalid.");
      return payload;
    }
    throw new Error(`Dataset necunoscut: ${part}`);
  }

  async function fetchJson(url,cache){
    const response=await fetch(url,{cache});
    if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadPart(part){
    if(inflight.has(part))return inflight.get(part);
    const {fresh,fallback}=urlsFor(part);
    const promise=(async()=>{
      try{
        return validate(part,await fetchJson(fresh,"no-store"));
      }catch(primaryError){
        console.warn(`Dataset ${part}: rețeaua nu a răspuns, încerc cache-ul local.`,primaryError);
        try{
          return validate(part,await fetchJson(fallback,"force-cache"));
        }catch(fallbackError){
          const error=new Error(`Nu s-a putut încărca datasetul ${part}.`);
          error.cause=fallbackError;
          throw error;
        }
      }
    })().finally(()=>inflight.delete(part));
    inflight.set(part,promise);
    return promise;
  }

  function syncQuestionIndex(){
    if(typeof questionById!=="undefined"&&questionById?.clear){
      questionById.clear();
      questions.forEach(q=>questionById.set(String(q.id),q.id));
    }
  }
  function refreshLegislationFilter(){
    const select=document.getElementById("legislation-act");if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="all">Toate actele</option>';
    laws.forEach(act=>select.insertAdjacentHTML("beforeend",`<option value="${act.id}">${act.title}</option>`));
    select.value=[...select.options].some(option=>option.value===current)?current:"all";
    if(typeof renderLegislation==="function")select.onchange=renderLegislation;
  }
  function refreshInterviewFilter(){
    const select=document.getElementById("interview-category");if(!select)return;
    const current=select.value;
    select.innerHTML='<option value="all">Toate categoriile</option>';
    [...new Set(interviewScenarios.map(item=>item.category).filter(Boolean))].forEach(category=>select.insertAdjacentHTML("beforeend",`<option value="${category}">${category}</option>`));
    select.value=[...select.options].some(option=>option.value===current)?current:"all";
  }
  function applyPayload(payload){
    if(payload.legislation&&!loaded.legislation){
      legislationActs.splice(0,legislationActs.length,...payload.legislation);
      loaded.legislation=true;
      refreshLegislationFilter();
    }
    if(payload.official&&!loaded.official){
      const {written=[],sets=[],questions:extra=[]}=payload.official;
      officialWritten.splice(0,officialWritten.length,...written);
      officialSets.splice(0,officialSets.length,...sets);
      const ids=new Set(extra.map(q=>String(q.id)));
      const retained=questions.filter(q=>!ids.has(String(q.id)));
      questions.splice(0,questions.length,...retained,...extra);
      const set=officialSets.find(item=>item.id==="anp2024");
      if(set)set.legalNote=String(set.legalNote||"").replace(/pragul legal actual este 65 de ani/i,"pragul legal actual pentru această fracție este 60 de ani");
      syncQuestionIndex();
      loaded.official=true;
    }
    if(payload.interview&&!loaded.interview){
      interviewScenarios.splice(0,interviewScenarios.length,...payload.interview);
      loaded.interview=true;
      refreshInterviewFilter();
    }
  }

  async function loadTrainingHeavyData(parts){
    const requested=[...new Set((Array.isArray(parts)?parts:[parts]).filter(Boolean))].filter(part=>!loaded[part]);
    if(!requested.length)return{...loaded};
    const settled=await Promise.allSettled(requested.map(async part=>[part,await loadPart(part)]));
    const payload={},failed=[];
    settled.forEach((result,index)=>{
      const part=requested[index];
      if(result.status==="fulfilled"){payload[part]=result.value[1];delete errors[part]}
      else{errors[part]=String(result.reason?.message||result.reason||"Eroare necunoscută");failed.push(part)}
    });
    applyPayload(payload);
    window.TRAINING_HEAVY_DATA={...loaded};
    window.TRAINING_DATA_ERRORS={...errors};
    window.TRAINING_DATA_PARTIAL=!(loaded.legislation&&loaded.official&&loaded.interview);
    window.TRAINING_DATA_REVISION=DATA_REVISION;
    document.dispatchEvent(new CustomEvent("training:heavy-data-ready",{detail:{parts:Object.keys(payload),failed,loaded:{...loaded}}}));
    if(failed.length){
      const error=new Error(`Dataseturi indisponibile: ${failed.join(", ")}`);
      error.failedParts=failed;
      throw error;
    }
    return{...loaded};
  }

  window.loadTrainingHeavyData=loadTrainingHeavyData;
  window.TRAINING_HEAVY_DATA={...loaded};
  window.TRAINING_DATA_ERRORS={};
  window.TRAINING_DATA_REVISION=DATA_REVISION;
})();
