(()=>{
  if(window.TRAINING_DATA_HEALTH)return;
  const REQUIRED=["legislation","official","interview"];

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
  document.addEventListener("training:app-ready",audit);
  document.addEventListener("training:view-ready",event=>{
    if(["quiz","mistakes","exam"].includes(event.detail?.id))scheduleScenarioRepair();
    else audit();
  });
  document.addEventListener("pointerdown",event=>{
    const target=event.target.closest?.('.nav-item,[data-go],[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start');
    const view=target?.dataset?.view||target?.dataset?.go;
    if(["quiz","mistakes","exam"].includes(view)||target?.matches?.('[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start'))scheduleScenarioRepair();
  },{capture:true,passive:true});

  window.TRAINING_DATA_HEALTH={audit,snapshot,repairScenarioStubs,scheduleScenarioRepair,last:null,version:"health-v1"};
  setTimeout(audit,0);
})();
