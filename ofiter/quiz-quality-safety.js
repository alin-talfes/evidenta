(()=>{
  if(typeof questions==="undefined")return;
  const VERSION="quiz-safety-v2";
  if(window.QUIZ_QUALITY_SAFETY_VERSION===VERSION)return;
  window.QUIZ_QUALITY_SAFETY_VERSION=VERSION;
  const CROSS_REF=/(?:\bart\.?\s*\d+|\barticol(?:ul|ele)?\s+\d+|\balin\.?\s*\(?\d+\)?|\banexa\s*(?:nr\.?)?\s*\d+|\bnr\.?\s*\d+\s*\/)/i;
  const RECALL_STEM=/(?:\b(?:la|în|in)\s+ce\s+articol\b|\bcare\s+articol\b|\barticolul\s+\d+\s+(?:reglementează|reglementeaza|prevede|privește|priveste|se\s+referă|se\s+refera))/i;
  let totalRemoved=0,passes=0;
  function sync(){
    if(typeof questionById!=="undefined"&&questionById?.clear){questionById.clear();questions.forEach(question=>questionById.set(String(question.id),question.id))}
    if(typeof state!=="undefined"){
      const valid=new Set(questions.map(question=>String(question.id)));
      state.correctIds=(state.correctIds||[]).filter(id=>valid.has(String(id)));
      state.mistakes=(state.mistakes||[]).filter(id=>valid.has(String(id)));
      state.questionStats=Object.fromEntries(Object.entries(state.questionStats||{}).filter(([id])=>valid.has(String(id))));
      state.answered=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.attempts)||0),0);
      state.correct=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.correct)||0),0);
    }
    try{renderModules?.();renderStats?.();save?.()}catch{}
  }
  function sanitize(){
    passes++;
    const before=questions.length;
    const next=questions.filter(question=>{
      if(RECALL_STEM.test(String(question?.q||"")))return false;
      if(question?.qualityType==="condition"&&(question.a||[]).some(option=>CROSS_REF.test(String(option))))return false;
      return true;
    });
    const removed=before-next.length;
    if(removed){totalRemoved+=removed;questions.splice(0,questions.length,...next);sync()}
    if(window.QUIZ_QUALITY_AUDIT){window.QUIZ_QUALITY_AUDIT.safetyRetired=totalRemoved;window.QUIZ_QUALITY_AUDIT.safetyPasses=passes;window.QUIZ_QUALITY_AUDIT.total=questions.length}
  }
  sanitize();
  const ready=window.OMJ2188_DATA_READY;
  if(ready&&typeof ready.then==="function")ready.then(()=>setTimeout(sanitize,0)).catch(()=>{});
  document.addEventListener("training:omj-unlocked",()=>{if(window.OMJ2188_SYNTHESIS)setTimeout(sanitize,0)},{once:true});
})();
