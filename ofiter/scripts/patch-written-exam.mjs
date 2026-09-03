import fs from 'node:fs';
import * as acorn from 'acorn';

const file='written-exam-simulation.js';
let source=fs.readFileSync(file,'utf8');
const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'});
const replacements=[];
const functions=new Map(ast.body.filter(n=>n.type==='ExpressionStatement').flatMap(()=>[]));
function walk(node){if(!node||typeof node!=='object')return;if(node.type==='FunctionDeclaration'&&node.id?.name)functions.set(node.id.name,node);for(const [key,value] of Object.entries(node)){if(['start','end'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value)}}
walk(ast);
function replaceFunction(name,code){const node=functions.get(name);if(!node)throw new Error(`Missing function ${name}`);replacements.push({start:node.start,end:node.end,code})}
replaceFunction('ensureOmj',`async function ensureOmj(){
    try{
      if(window.TRAINING_LAZY_LOADER?.ensureOmjData)await window.TRAINING_LAZY_LOADER.ensureOmjData();
      else if(window.OMJ2188_DATA_READY)await window.OMJ2188_DATA_READY;
    }catch{}
    return !!window.OMJ2188_SYNTHESIS?.articles?.length;
  }`);
replaceFunction('adaptiveSnapshot',`function adaptiveSnapshot(){
    const perf=state.performanceIndex||window.TRAINING_ADAPTIVE_INDEX?.snapshot?.()||{};
    const weak=perf.weak||null;
    const calcKinds=["fraction","regime","age60"].map(kind=>({kind,accuracy:calculationAccuracy(kind)})).sort((a,b)=>(a.accuracy??-1)-(b.accuracy??-1));
    return {due:Number(perf.due||0),quizFocus:weak?lawLabel(weak.id):"materie neexersată",synthesisFocus:"se selectează la intrarea în Partea II",calcFocus:calcKindLabel(calcKinds[0]?.kind||"fraction")};
  }`);
replaceFunction('makeSession',`function makeSession(minutes,mode){
    const adaptive=mode!=="random",quiz=quizPool(adaptive),startedAt=new Date().toISOString();
    if(quiz.length<20)return null;
    return {active:true,id:\`written-\${Date.now()}\`,mode:adaptive?"adaptive":"random",phase:"quiz",quizIds:quiz.map(q=>q.id),quizAnswers:{},quizIndex:0,synthesis:null,calculation:null,calcAnswers:{},startedAt,deadline:minutes?new Date(Date.now()+minutes*60000).toISOString():null,timedOut:false};
  }`);
for(const item of replacements.sort((a,b)=>b.start-a.start))source=source.slice(0,item.start)+item.code+source.slice(item.end);
source=source.replace('button.disabled=true;button.textContent="Pregătesc simularea…";await ensureOmj();const next=makeSession(minutes,mode);','button.disabled=true;button.textContent="Pregătesc Partea I…";const next=makeSession(minutes,mode);');
source=source.replace('document.querySelectorAll("[data-full-answer]").forEach(button=>button.onclick=()=>{session.quizAnswers[String(id)]=Number(button.dataset.fullAnswer);persist();renderQuiz()});','document.querySelectorAll("[data-full-answer]").forEach(button=>button.onclick=()=>{session.quizAnswers[String(id)]=Number(button.dataset.fullAnswer);persist();document.querySelectorAll("[data-full-answer]").forEach(node=>node.classList.toggle("selected",node===button));const count=host.querySelector(".full-exam-stage-head > span");if(count)count.textContent=`${Object.keys(session.quizAnswers).length}/${session.quizIds.length} răspunsuri`});');
source=source.replace('document.getElementById("full-quiz-next").onclick=()=>{if(session.quizIndex<session.quizIds.length-1)session.quizIndex++;else session.phase="synthesis";persist();render()};',`document.getElementById("full-quiz-next").onclick=async()=>{
      if(session.quizIndex<session.quizIds.length-1){session.quizIndex++;persist();render();return}
      const button=document.getElementById("full-quiz-next");button.disabled=true;button.textContent="Pregătesc sinteza…";await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      await ensureOmj();const synthesis=chooseSynthesis(session.mode!=="random");
      if(!synthesis){button.disabled=false;button.textContent="Treci la sinteză →";toast?.("Nu există text disponibil pentru sinteză.");return}
      session.synthesis={id:synthesis.id,type:synthesis.type,actId:synthesis.actId,act:synthesis.act,heading:synthesis.heading,articleNumber:synthesis.articleNumber,text:synthesis.text,count:synthesis.count,draft:""};session.phase="synthesis";persist();render();
    };`);
source=source.replace('document.getElementById("full-to-calc").onclick=()=>{session.synthesis.draft=draft.value;session.phase="calculation";persist();render()};','document.getElementById("full-to-calc").onclick=()=>{session.synthesis.draft=draft.value;if(!session.calculation)session.calculation=makeCalculationCase(session.mode!=="random");session.phase="calculation";persist();render()};');
fs.writeFileSync(file,source);
console.log('Applied staged full-exam patches.');
