(()=>{
  if(window.TRAINING_ADAPTIVE_INDEX)return;
  const byLaw={};
  const now=()=>Date.now();
  const statsFor=id=>state?.questionStats?.[String(id)]||{};
  function rebuildLaw(lawId){
    const rows=(typeof questions!=="undefined"?questions:[]).filter(q=>q?.law===lawId);
    let attempts=0,correct=0,unseen=0,due=0;
    for(const q of rows){const s=statsFor(q.id),a=Number(s.attempts||0),c=Number(s.correct||0);attempts+=a;correct+=c;if(!a)unseen++;const t=Date.parse(s.nextReview||"");if((Array.isArray(state?.mistakes)&&state.mistakes.includes(q.id))||(Number.isFinite(t)&&t<=now()))due++}
    byLaw[lawId]={attempts,correct,unseen,due,accuracy:attempts?Math.round(correct/attempts*100):null,total:rows.length};
  }
  function rebuild(){const ids=[...new Set((typeof questions!=="undefined"?questions:[]).map(q=>q?.law).filter(Boolean))];ids.forEach(rebuildLaw);return snapshot()}
  function snapshot(){
    const entries=Object.entries(byLaw);
    const weak=entries.map(([id,row])=>({id,...row,score:(row.accuracy==null?60:100-row.accuracy)+row.due*8+row.unseen*2})).sort((a,b)=>b.score-a.score)[0]||null;
    const due=entries.reduce((sum,[,row])=>sum+row.due,0);
    return {byLaw:{...byLaw},weak,due,updatedAt:new Date().toISOString()};
  }
  const base=typeof recordQuestionResult==="function"?recordQuestionResult:null;
  if(base)recordQuestionResult=function(q,ok){const result=base(q,ok);if(q?.law)rebuildLaw(q.law);state.performanceIndex=snapshot();return result};
  rebuild();if(typeof state!=="undefined")state.performanceIndex=snapshot();
  window.TRAINING_ADAPTIVE_INDEX={rebuild,rebuildLaw,snapshot,version:"adaptive-v1"};
})();
