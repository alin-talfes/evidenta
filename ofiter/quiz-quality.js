(()=>{
  if(typeof questions==="undefined"||typeof legislationActs==="undefined")return;
  const VERSION="quality-v1";
  if(window.QUIZ_QUALITY_VERSION===VERSION)return;
  window.QUIZ_QUALITY_VERSION=VERSION;

  const RETIRE_MANUAL_IDS=new Set([23,25,28,30]);
  const OLD_AUTO=/^(?:cq-|aq-|article-)/i;
  const CONDITION_RE=/(?:cel\s+puțin|cel\s+mult|până\s+la|în\s+termen(?:ul)?\s+de?|dacă|numai|cu\s+excepția|înainte\s+de|după|minimum|minim|maximum|maxim|mai\s+mare\s+de|mai\s+mic\s+de|nu\s+poate|poate\s+fi|trebuie|obligatoriu)/i;
  const PRACTICAL_RE=/(?:obliga|interdic|drept|primir|transfer|liber|regim|execut|arest|contesta|comunica|eviden|calcul|verific|puner|soluț|procedur)/i;
  const STOP=new Set("si sau de la in în cu din pentru prin este sunt un o unei unui ale al ai a ca se sa să pe privind potrivit conform dintre care aceasta aceste acest aceea acele".split(/\s+/));
  const TYPE_LABELS={application:"Aplicare",condition:"Condiții / limite",exception:"Excepții / diferențiere",foundation:"Fundamente"};

  const norm=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const clean=value=>String(value??"").replace(/\s+/g," ").replace(/^\s*(?:\(\d+\)|[a-zăâîșț]\)|\d+\.)\s*/iu,"").trim();
  const words=value=>norm(value).split(/\s+/).filter(token=>token&&!STOP.has(token)&&token.length>2);
  const uniq=values=>[...new Map(values.filter(Boolean).map(value=>[norm(value),value])).values()];
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const rotate=(values,seed)=>{const out=[...values];if(!out.length)return out;const n=hash(seed)%out.length;return [...out.slice(n),...out.slice(0,n)]};
  const similarity=(a,b)=>{const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;let overlap=0;A.forEach(value=>{if(B.has(value))overlap++});return overlap/Math.max(A.size,B.size)};

  function rawSegments(article){
    const result=[];
    if(article?.intro)result.push(article.intro);
    (article?.items||[]).forEach(value=>result.push(value));
    (article?.subsections||[]).forEach(section=>{if(section?.intro)result.push(section.intro);(section?.items||[]).forEach(value=>result.push(value))});
    return uniq(result.map(clean).filter(value=>value.length>=28&&value.length<=270));
  }
  function itemSegments(article){
    const result=[];
    (article?.items||[]).forEach(value=>result.push(value));
    (article?.subsections||[]).forEach(section=>(section?.items||[]).forEach(value=>result.push(value)));
    return uniq(result.map(clean).filter(value=>value.length>=25&&value.length<=240));
  }
  function buildArticleSources(){
    return legislationActs.flatMap(act=>(act.articles||[]).map(article=>({actId:act.id,actTitle:act.title,articleId:article.id,articleNumber:article.number,heading:article.heading||"Regulă legală",segments:rawSegments(article),items:itemSegments(article)}))).filter(source=>source.segments.length);
  }

  function relatedSegments(source,sources,exclude=[]){
    const blocked=new Set(exclude.map(norm));
    const correct=exclude[0]||"";
    const candidates=sources.flatMap(other=>other.articleId===source.articleId?[]:other.segments.map(text=>({text,sameAct:other.actId===source.actId,sim:similarity(correct,text),articleId:other.articleId})));
    candidates.sort((a,b)=>(Number(b.sameAct)-Number(a.sameAct))+(b.sim-a.sim)*.6);
    return uniq(candidates.map(item=>item.text).filter(text=>!blocked.has(norm(text))));
  }
  function arrange(correct,distractors,seed){
    const choices=uniq([correct,...distractors]).slice(0,4);
    if(choices.length<4)return null;
    const order=rotate(choices,seed);
    return {answers:order,correct:order.findIndex(value=>norm(value)===norm(correct))};
  }
  function refFor(source){return `${source.actTitle}${source.articleNumber?`, ${source.articleNumber}`:""}`}

  function makeDistinction(source,sources,index){
    const representative=source.items[index%Math.max(1,source.items.length)]||source.segments[index%source.segments.length];
    const distractors=relatedSegments(source,sources,[representative]).slice(0,3);
    const arranged=arrange(representative,distractors,`d-${source.articleId}`);if(!arranged)return null;
    const practical=PRACTICAL_RE.test(`${source.heading} ${representative}`);
    return {id:`qv1-d-${source.articleId}`,law:source.actId,kind:"content",qualityType:practical?"application":"foundation",difficulty:practical?"mediu":"bază",ref:refFor(source),q:practical?`Într-o situație practică privind „${source.heading}”, care variantă este compatibilă cu regula legală integrată?`:`În materia „${source.heading}”, care afirmație corespunde textului legal integrat?`,a:arranged.answers,c:arranged.correct,e:`Varianta corectă reproduce regula relevantă din ${refFor(source)}. Numărul articolului este doar reper de verificare.`};
  }
  function makeException(source,sources){
    if(source.items.length<3)return null;
    const inside=rotate(source.items,source.articleId).slice(0,3);
    const outsider=relatedSegments(source,sources,inside).find(text=>!source.segments.some(value=>norm(value)===norm(text)));
    if(!outsider)return null;
    const arranged=arrange(outsider,inside,`x-${source.articleId}`);if(!arranged)return null;
    return {id:`qv1-x-${source.articleId}`,law:source.actId,kind:"content",qualityType:"exception",difficulty:"mediu",ref:refFor(source),q:`Care variantă NU aparține regulilor integrate pentru tema „${source.heading}”?`,a:arranged.answers,c:arranged.correct,e:`Celelalte trei variante provin din textul aferent temei „${source.heading}”; varianta marcată este dintr-o altă regulă. Verificare: ${refFor(source)}.`};
  }

  function phraseMutations(text){
    const pairs=[
      [/cel puțin/i,"cel mult"],[/cel mult/i,"cel puțin"],[/cu excepția/i,"inclusiv"],[/până la/i,"după"],[/înainte de/i,"după"],[/după/i,"înainte de"],[/numai/i,"indiferent de"],[/nu poate/i,"poate"],[/poate fi/i,"trebuie să fie"],[/trebuie/i,"poate"],[/dacă/i,"chiar dacă nu"],[/mai mare de/i,"cel mult"],[/mai mic de/i,"cel puțin"]
    ];
    const output=[];
    for(const [pattern,replacement] of pairs)if(pattern.test(text))output.push(text.replace(pattern,replacement));
    const match=text.match(/\b([1-9]\d{0,2})\b/);
    if(match){const n=Number(match[1]),variants=uniq([String(Math.max(1,n-1)),String(n+1),String(n+2)]);for(const value of variants)if(value!==String(n))output.push(text.replace(match[0],value))}
    return uniq(output.map(clean).filter(value=>norm(value)!==norm(text)));
  }
  function makeCondition(source,segment,slot){
    const mutations=phraseMutations(segment).slice(0,3);if(mutations.length<3)return null;
    const arranged=arrange(segment,mutations,`c-${source.articleId}-${slot}`);if(!arranged)return null;
    return {id:`qv1-c-${source.articleId}-${slot}`,law:source.actId,kind:"content",qualityType:"condition",difficulty:"ridicat",ref:refFor(source),q:`În privința „${source.heading}”, care variantă păstrează corect condiția, limita sau excepția prevăzută de textul legal?`,a:arranged.answers,c:arranged.correct,e:`Condiția corectă este cea din textul legal integrat. Verificare: ${refFor(source)}.`};
  }
  function generateFromSources(sources,prefix="base"){
    const result=[];
    sources.forEach((source,index)=>{
      const distinction=makeDistinction(source,sources,index);if(distinction){distinction.id=distinction.id.replace("qv1-",`qv1-${prefix}-`);result.push(distinction)}
      const exception=makeException(source,sources);if(exception){exception.id=exception.id.replace("qv1-",`qv1-${prefix}-`);result.push(exception)}
      const conditionSegments=source.segments.filter(segment=>CONDITION_RE.test(segment)).slice(0,1);
      conditionSegments.forEach((segment,slot)=>{const condition=makeCondition(source,segment,slot+1);if(condition){condition.id=condition.id.replace("qv1-",`qv1-${prefix}-`);result.push(condition)}});
    });
    return result;
  }

  function omjSources(data){
    if(!data?.articles?.length)return [];
    return data.articles.map(article=>{
      const text=String(article.text||"");
      const lines=text.split(/\n+/).flatMap(line=>line.length>280?line.split(/(?<=[.;:])\s+(?=[A-ZĂÂÎȘȚŞŢ(])/u):[line]);
      const segments=uniq(lines.map(clean).filter(value=>value.length>=32&&value.length<=270));
      return {actId:data.actId||"omj2188",actTitle:data.actTitle||"OMJ nr. 2188/C/2022",articleId:`omj-${article.id}`,articleNumber:article.number||"",heading:article.heading||"Evidență și executare",segments,items:segments.filter(value=>value.length<=240)};
    }).filter(source=>source.segments.length);
  }

  function legacyKeep(question){
    const id=String(question?.id??"");
    if(OLD_AUTO.test(id)||RETIRE_MANUAL_IDS.has(Number(question?.id)))return false;
    const stem=norm(question?.q||"");
    if(/\b(ce|care|la ce|la care|in ce|in care) articol\b/.test(stem))return false;
    if(/\barticolul? \d+\b/.test(stem)&&/(se refera|reglementeaza|priveste|indicat|central|apartine)/.test(stem))return false;
    if(stem.includes("bibliografia")&&/(include|indica|studiaza|interval)/.test(stem))return false;
    return Array.isArray(question?.a)&&question.a.length>=2&&Number.isInteger(question.c)&&question.c>=0&&question.c<question.a.length;
  }
  function tagLegacy(question){
    if(question.qualityType)return question;
    const stem=norm(question.q||"");
    const application=/(daca|situatie|abordarea|conduita|poate|trebuie)/.test(stem);
    return {...question,qualityType:application?"application":"foundation",difficulty:application?"mediu":"bază"};
  }
  function validQuestion(question){
    if(!question||!Array.isArray(question.a)||question.a.length!==4||!Number.isInteger(question.c)||question.c<0||question.c>3)return false;
    if(uniq(question.a).length!==4)return false;
    if(!question.q||!question.ref)return false;
    return true;
  }
  function dedupeQuestions(pool){
    const stems=new Set(),answerSets=new Set(),ids=new Set(),result=[];
    for(const question of pool){
      if(!validQuestion(question))continue;
      const id=String(question.id),stem=norm(question.q),answerSet=[...question.a.map(norm)].sort().join("|");
      if(ids.has(id)||stems.has(stem)||answerSets.has(answerSet))continue;
      ids.add(id);stems.add(stem);answerSets.add(answerSet);result.push(question);
    }
    return result;
  }

  const initialCount=questions.length;
  const legacy=questions.filter(legacyKeep).map(tagLegacy);
  const baseGenerated=generateFromSources(buildArticleSources(),"base");
  let omjGenerated=[];

  function rebuild(){
    const next=dedupeQuestions([...legacy,...baseGenerated,...omjGenerated]);
    questions.splice(0,questions.length,...next);
    if(typeof questionById!=="undefined"&&questionById?.clear){questionById.clear();questions.forEach(question=>questionById.set(String(question.id),question.id))}
    if(typeof state!=="undefined"){
      const validIds=new Set(questions.map(question=>String(question.id)));
      state.correctIds=(state.correctIds||[]).filter(id=>validIds.has(String(id)));
      state.mistakes=(state.mistakes||[]).filter(id=>validIds.has(String(id)));
      state.questionStats=Object.fromEntries(Object.entries(state.questionStats||{}).filter(([id])=>validIds.has(String(id))));
      state.answered=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.attempts)||0),0);
      state.correct=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.correct)||0),0);
    }
    if(typeof officialSets!=="undefined")officialSets.forEach(set=>set.questions=(set.questions||[]).filter(id=>questions.some(question=>String(question.id)===String(id))));
    refreshAudit();
    try{renderModules?.();renderStats?.();renderMistakes?.();save?.()}catch{}
  }

  function focusValue(){return document.getElementById("quiz-quality-focus")?.value||"mix"}
  function filteredPool(module="all",focus=focusValue()){
    return questions.filter(question=>(module==="all"||question.law===module)&&(focus==="mix"||question.qualityType===focus));
  }
  function shuffleLocal(values){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
  function balancedPick(pool,size){
    const groups={condition:[],application:[],exception:[],foundation:[]};
    pool.forEach(question=>(groups[question.qualityType]||groups.foundation).push(question));Object.values(groups).forEach(group=>group.splice(0,group.length,...shuffleLocal(group)));
    const target={condition:.30,application:.30,exception:.25,foundation:.15},chosen=[],used=new Set();
    for(const type of ["condition","application","exception","foundation"]){const count=Math.floor(size*target[type]);for(const question of groups[type].slice(0,count)){chosen.push(question);used.add(String(question.id))}}
    const rest=shuffleLocal(pool.filter(question=>!used.has(String(question.id))));for(const question of rest){if(chosen.length>=size)break;chosen.push(question)}
    return shuffleLocal(chosen).slice(0,Math.min(size,pool.length));
  }
  function weakness(question){
    const stats=state?.questionStats?.[String(question.id)]||{},attempts=Number(stats.attempts||0),correct=Number(stats.correct||0),accuracy=attempts?correct/attempts:0,lastSeen=Date.parse(stats.lastSeen||"")||0,age=lastSeen?Math.min(365,(Date.now()-lastSeen)/864e5):365;
    const due=Date.parse(stats.nextReview||"");
    const typeWeight={condition:500,application:420,exception:360,foundation:120}[question.qualityType]||100;
    return (Number.isFinite(due)&&due<=Date.now()?10000:0)+((state?.mistakes||[]).some(id=>String(id)===String(question.id))?8000:0)+(attempts===0?2500:0)+(1-accuracy)*1800+age+typeWeight+Math.random()*20;
  }
  function adaptiveBalanced(pool,size){
    const ranked=[...pool].sort((a,b)=>weakness(b)-weakness(a)),chosen=[],lawCounts=new Map(),typeCounts=new Map();
    for(const question of ranked){
      if(chosen.length>=size)break;
      const law=String(question.law||"other"),type=question.qualityType||"foundation",lawCount=lawCounts.get(law)||0,typeCount=typeCounts.get(type)||0;
      const maxLaw=Math.max(3,Math.ceil(size*.35)),maxType=Math.max(3,Math.ceil(size*.55));
      if(lawCount>=maxLaw||typeCount>=maxType)continue;
      chosen.push(question);lawCounts.set(law,lawCount+1);typeCounts.set(type,typeCount+1);
    }
    if(chosen.length<size)for(const question of ranked){if(chosen.length>=size)break;if(!chosen.includes(question))chosen.push(question)}
    return chosen;
  }

  function installSelectionHooks(){
    if(typeof adaptiveQuestions==="function")adaptiveQuestions=function(){const module=document.getElementById("quiz-module")?.value||"all",size=Number(document.getElementById("quiz-size")?.value)||10,pool=filteredPool(module);return adaptiveBalanced(pool,Math.min(size,pool.length))};
    if(typeof startQuiz==="function"&&!startQuiz.__qualityWrapped){const baseStart=startQuiz;const wrapped=function(custom=null,isExam=false){
      if(Array.isArray(custom))return baseStart(custom,isExam);
      const module=isExam?"all":document.getElementById("quiz-module")?.value||"all",focus=isExam?"mix":focusValue(),size=isExam?20:(Number(document.getElementById("quiz-size")?.value)||10),pool=filteredPool(module,focus);
      if(!pool.length){try{toast("Nu există grile pentru filtrul selectat.")}catch{}return}
      return baseStart(balancedPick(pool,Math.min(size,pool.length)),isExam);
    };wrapped.__qualityWrapped=true;startQuiz=wrapped}
  }

  function injectControls(){
    const setup=document.getElementById("quiz-setup"),options=setup?.querySelector(".setup-options");if(!setup||!options)return;
    if(!document.getElementById("quiz-quality-focus"))options.insertAdjacentHTML("beforeend",`<label>Tip de antrenament<select id="quiz-quality-focus" aria-label="Filtrează grilele după tip"><option value="mix">Mix examen</option><option value="condition">Condiții / limite</option><option value="application">Aplicare</option><option value="exception">Excepții / diferențiere</option><option value="foundation">Fundamente</option></select></label>`);
    if(!document.getElementById("quiz-quality-audit")){const node=document.createElement("div");node.id="quiz-quality-audit";node.className="quiz-quality-audit";setup.querySelector(".setup-actions")?.insertAdjacentElement("beforebegin",node)}
    document.getElementById("quiz-quality-focus")?.addEventListener("change",renderAuditSummary);
    document.getElementById("quiz-module")?.addEventListener("change",renderAuditSummary);
    renderAuditSummary();
  }
  function renderAuditSummary(){
    const host=document.getElementById("quiz-quality-audit");if(!host)return;const module=document.getElementById("quiz-module")?.value||"all",pool=filteredPool(module,"mix"),counts=Object.fromEntries(Object.keys(TYPE_LABELS).map(type=>[type,pool.filter(question=>question.qualityType===type).length]));
    host.innerHTML=`<strong>${pool.length} grile utile în pool</strong><span>${counts.condition} condiții/limite · ${counts.application} aplicare · ${counts.exception} excepții/diferențiere · ${counts.foundation} fundamente</span><small>Grilele de memorare a numerelor de articole și vechiul generator repetitiv sunt excluse.</small>`;
  }
  function refreshAudit(){
    const stems=new Set(),issues=[];
    for(const question of questions){const stem=norm(question.q);if(stems.has(stem))issues.push(`stem duplicat: ${question.id}`);stems.add(stem);if(/\b(la ce|in ce|care) articol\b/.test(stem))issues.push(`articol testat: ${question.id}`);if(!validQuestion(question))issues.push(`structură invalidă: ${question.id}`)}
    const counts=Object.fromEntries(Object.keys(TYPE_LABELS).map(type=>[type,questions.filter(question=>question.qualityType===type).length]));
    window.QUIZ_QUALITY_AUDIT={version:VERSION,initialCount,total:questions.length,retired:Math.max(0,initialCount-legacy.length),generatedBase:baseGenerated.length,generatedOmj:omjGenerated.length,counts,issues};
    renderAuditSummary();
  }

  rebuild();installSelectionHooks();injectControls();
  let omjAttached=false,omjPolls=0;
  function attachOmjPool(){
    if(omjAttached)return;
    if(window.OMJ2188_SYNTHESIS){omjAttached=true;omjGenerated=generateFromSources(omjSources(window.OMJ2188_SYNTHESIS),"omj");rebuild();installSelectionHooks();injectControls();return}
    const ready=window.OMJ2188_DATA_READY;
    if(ready&&typeof ready.then==="function"){omjAttached=true;ready.then(data=>{omjGenerated=generateFromSources(omjSources(window.OMJ2188_SYNTHESIS||data),"omj");rebuild();installSelectionHooks();injectControls()}).catch(error=>{omjAttached=false;console.warn("[training] quiz quality: OMJ pool unavailable",error)});return}
    if(omjPolls++<100)setTimeout(attachOmjPool,120);
  }
  attachOmjPool();
})();
