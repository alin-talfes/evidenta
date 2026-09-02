(()=>{
  let examDeadline=0,interviewDeadline=0,simulationDeadline=0;
  const ARTICLE_RECALL_IDS=new Set([1,2,3,4,5,6,9,11,12,13,14,15,16,17,18,19,20,21,22,26,27]);
  const remainingSeconds=deadline=>Math.max(0,Math.ceil((deadline-Date.now())/1000));
  const formatClock=value=>`${String(Math.floor(Math.max(0,value)/60)).padStart(2,"0")}:${String(Math.max(0,value)%60).padStart(2,"0")}`;
  const normalizeSearch=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const isArticleRecallQuestion=q=>{
    if((q?.kind||"content")==="article"||ARTICLE_RECALL_IDS.has(Number(q?.id)))return true;
    const text=normalizeSearch(`${q?.q||""} ${q?.e||""}`);
    return /\b(ce|care|la ce|la care|in ce|in care)\s+articol\b/.test(text)||/\barticolul\s+(prevede|reglementeaza|stabileste|se refera)\b/.test(text);
  };
  const relevantQuestions=pool=>(Array.isArray(pool)?pool:[]).filter(q=>!isArticleRecallQuestion(q));

  function statementForArticle(article){
    const items=(article.items||[]).filter(value=>String(value).trim().length>=18);
    return String(items[0]||article.intro||"").trim();
  }

  function generatedContentQuestions(){
    const source=legislationActs.flatMap(act=>act.articles.map(article=>({act,article,text:statementForArticle(article)}))).filter(item=>item.text);
    return legislationActs.flatMap(act=>act.articles.map((article,index)=>{
      const correct=statementForArticle(article);if(!correct)return null;
      const candidates=[...source.filter(item=>item.article.id!==article.id&&item.act.id===act.id),...source.filter(item=>item.article.id!==article.id&&item.act.id!==act.id)];
      const distractors=[];
      for(const candidate of candidates){
        if(distractors.length>=3)break;
        if(normalizeSearch(candidate.text)===normalizeSearch(correct)||distractors.some(value=>normalizeSearch(value)===normalizeSearch(candidate.text)))continue;
        distractors.push(candidate.text);
      }
      if(distractors.length<2)return null;
      const correctPosition=index%(distractors.length+1),answers=[...distractors];answers.splice(correctPosition,0,correct);
      return {id:`cq-${article.id}`,law:act.id,kind:"content",ref:`${act.title}, ${article.number}`,q:`În materia „${article.heading}”, care afirmație redă corect regula legală?`,a:answers,c:correctPosition,e:`Afirmația corectă este preluată din textul legal aplicabil. Sursa de verificare: ${article.number}.`};
    }).filter(Boolean));
  }

  function rebuildQuestionPool(){
    const merged=[...new Map([...relevantQuestions(questions),...generatedContentQuestions()].map(question=>[String(question.id),question])).values()];
    questions.splice(0,questions.length,...merged);questionById.clear();questions.forEach(question=>questionById.set(String(question.id),question.id));
    state.correctIds=(state.correctIds||[]).filter(id=>questionById.has(String(id)));state.mistakes=(state.mistakes||[]).filter(id=>questionById.has(String(id)));
    state.questionStats=Object.fromEntries(Object.entries(state.questionStats||{}).filter(([id])=>questionById.has(String(id))));
    state.answered=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.attempts)||0),0);state.correct=Object.values(state.questionStats).reduce((sum,stats)=>sum+(Number(stats?.correct)||0),0);
    officialSets.forEach(set=>{const original=[...(set.questions||[])],available=original.filter(id=>questionById.has(String(id)));set.unavailableQuizCount=Math.max(0,original.length-available.length);set.questions=available});
  }

  const segmentText=segment=>[segment?.intro,...(segment?.items||[])].filter(Boolean).join("\n").trim();
  function literalTextForWritten(item){
    const act=legislationActs.find(value=>value.id===item.law);if(!act)return "";
    const articleMatch=String(item.ref||"").match(/art\.\s*(\d+)/i);if(!articleMatch)return "";
    const article=act.articles.find(value=>String(value.number).match(/\d+/)?.[0]===articleMatch[1]);if(!article)return "";
    const paragraphMatch=String(item.ref||"").match(/alin\.\s*\((\d+)\)/i),segments=[{intro:article.intro,items:article.items},...(article.subsections||[])];
    if(paragraphMatch){const wanted=paragraphMatch[1],segment=segments.find((value,index)=>normalizeSearch(value.intro).startsWith(`(${wanted})`)||(wanted==="1"&&index===0));return segmentText(segment)}
    return segments.map(segmentText).filter(Boolean).join("\n");
  }

  function prepareWrittenExam(){
    officialWritten.forEach(item=>{
      if(item.type==="Calcul"||item.type==="Speță de calcul"){item.type="Speță de calcul";return}
      item.type="Sinteză";
      if(!String(item.prompt).startsWith("Redă cât mai fidel"))item.prompt=`Redă cât mai fidel textul legal cerut, apoi răspunde cerinței: ${item.prompt}`;
      const literal=literalTextForWritten(item);item.literalText=literal;
      if(literal){item.answer=escapeHtml(literal).replace(/\n/g,"<br>");item.note="Text de control extras din forma legală integrată în aplicație. Compară formularea, ordinea ideilor și enumerările."}
      else item.note=`${item.note} Textul literal complet pentru această cerință nu este încă integrat local; pentru verificarea cuvânt cu cuvânt folosește forma consolidată oficială.`;
    });
  }

  const literalTokens=value=>normalizeSearch(value).replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(Boolean);
  function lexicalSimilarity(draft,target){
    const a=literalTokens(draft),b=literalTokens(target);if(!b.length)return 0;let previous=Array.from({length:b.length+1},(_,index)=>index);
    for(let i=1;i<=a.length;i++){const current=[i];for(let j=1;j<=b.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));previous=current}
    return Math.max(0,Math.round((1-previous[b.length]/Math.max(a.length,b.length,1))*100));
  }

  function enhanceWrittenWorkspace(setId){
    const set=officialSets.find(value=>value.id===setId);if(!set)return;
    const head=$("#official-written .written-head");if(head){const eyebrow=head.querySelector(".eyebrow"),paragraph=head.querySelector("p:not(.eyebrow)");if(eyebrow)eyebrow.textContent="PARTEA II — SINTEZĂ · PARTEA III — SPEȚE DE CALCUL";if(paragraph)paragraph.textContent="La sinteză urmărește redarea fidelă a textului legal. La calcule, scrie toate operațiunile și verifică separat rezultatul final."}
    $$("[data-reveal]").forEach(button=>{const baseHandler=button.onclick;button.onclick=()=>{baseHandler?.();const id=button.dataset.reveal,item=officialWritten.find(value=>String(value.id)===String(id)),solution=$(`#solution-${id}`);if(!item?.literalText||!solution||solution.classList.contains("hidden"))return;const draft=$(`[data-written-draft="${id}"]`)?.value||"",score=lexicalSimilarity(draft,item.literalText);let box=solution.querySelector(".literal-score");if(!box){box=document.createElement("div");box.className="notice literal-score";solution.prepend(box)}const band=score>=95?"foarte fidel":score>=85?"bun":score>=70?"acceptabil, dar necesită corecturi":"de repetat";box.innerHTML=`<strong>Fidelitate lexicală: ${score}% — ${band}</strong><br><small>Scor orientativ: ignoră majusculele, punctuația și diacriticele. Verificarea finală rămâne comparația vizuală cu textul legal.</small>`}});
  }

  function enhanceOfficialCards(){
    $$("#official-sets .official-set").forEach((card,index)=>{const set=officialSets[index];if(!set)return;const items=(set.written||[]).map(id=>officialWritten.find(value=>value.id===id)).filter(Boolean),synthesis=items.filter(item=>item.type==="Sinteză").length,calculations=items.filter(item=>item.type==="Speță de calcul").length,meta=card.querySelector(".official-meta");if(meta)meta.innerHTML=`<span>${set.questions.length?`${set.questions.length} grile de conținut`:`grile oficiale netranscrise local`}</span><span>${synthesis} sinteze</span><span>${calculations} spețe de calcul</span>`});
  }

  function relabelExamUI(){
    const quiz=$("#quiz");if(quiz){const h=quiz.querySelector(".page-heading h1"),p=quiz.querySelector(".page-heading p:not(.eyebrow)"),help=quiz.querySelector(".setup-help");if(h)h.textContent="Grile de conținut";if(p)p.textContent="Testează reguli, condiții, proceduri și efecte juridice. Numărul articolului rămâne doar sursă de verificare, nu obiect de memorare.";if(help)help.textContent="Sesiunea adaptivă prioritizează greșelile, întrebările neparcurse și zonele cu acuratețe scăzută. Întrebările de tip «în ce articol se află X» sunt excluse."}
    const official=$("#official");if(official){const h=official.querySelector(".page-heading h1"),p=official.querySelector(".page-heading p:not(.eyebrow)");if(h)h.textContent="Subiecte oficiale ANP";if(p)p.textContent="Bareme și teme oficiale folosite ca repere pentru grile, sinteză și spețele de calcul.";official.querySelector(".exam-structure-notice")?.remove()}
    const exam=$("#exam");if(exam){const e=exam.querySelector(".page-heading .eyebrow"),h=exam.querySelector(".page-heading h1"),p=exam.querySelector(".page-heading p:not(.eyebrow)");if(e)e.textContent="PARTEA I — SIMULARE GRILE";if(h)h.textContent="Simulare grile";if(p)p.textContent="20 de grile exclusiv de conținut, fără întrebări despre numărul articolului și fără explicații intermediare."}
    const sidebarOfficial=document.querySelector('.sidebar .nav-item[data-view="official"] span'),sidebarQuiz=document.querySelector('.sidebar .nav-item[data-view="quiz"] span'),sidebarExam=document.querySelector('.sidebar .nav-item[data-view="exam"] span');if(sidebarOfficial)sidebarOfficial.textContent="Subiecte ANP";if(sidebarQuiz)sidebarQuiz.textContent="Partea I · Grile";if(sidebarExam)sidebarExam.textContent="Simulare grile";
  }

  function resetExamArea(){const area=$("#exam-area");if(!area)return;area.className="panel exam-intro";area.innerHTML='<div class="exam-icon">◷</div><h2>Simulare cronometrată — Partea I</h2><p>Ai 30 de minute pentru 20 de grile de conținut. Numărul articolului nu este testat ca informație distinctă.</p><button id="exam-start" class="primary">Pornește simularea</button>';$("#exam-start").onclick=()=>startQuiz(null,true)}
  function cancelExamSession(notify=false){if(!examMode)return false;clearInterval(timer);timer=null;examDeadline=0;examMode=false;resetExamArea();if(notify)toast("Simularea grilelor anterioară a fost închisă.");return true}

  const baseStopInterviewTimer=stopInterviewTimer;stopInterviewTimer=function(){interviewDeadline=0;return baseStopInterviewTimer()};
  const baseStopInterviewSimulationTimer=stopInterviewSimulationTimer;stopInterviewSimulationTimer=function(){simulationDeadline=0;return baseStopInterviewSimulationTimer()};
  const baseFinishExam=finishExam;finishExam=function(){examDeadline=0;return baseFinishExam()};
  const baseFinishInterviewSimulation=finishInterviewSimulation;finishInterviewSimulation=function(timedOut=false){simulationDeadline=0;return baseFinishInterviewSimulation(timedOut)};
  const baseExitInterviewSimulation=exitInterviewSimulation;exitInterviewSimulation=function(){simulationDeadline=0;return baseExitInterviewSimulation()};

  startTimer=function(){clearInterval(timer);examDeadline=Date.now()+Math.max(0,seconds)*1000;const tick=()=>{seconds=remainingSeconds(examDeadline);const display=$("#exam-timer");if(display)display.textContent=formatClock(seconds);if(seconds<=0){clearInterval(timer);timer=null;finishExam()}};timer=setInterval(tick,500);tick()};
  startInterviewTimer=function(){cancelExamSession(true);baseStopInterviewTimer();interviewSeconds=180;interviewDeadline=Date.now()+interviewSeconds*1000;const display=$("#interview-timer");if(display)display.textContent=formatClock(interviewSeconds);const tick=()=>{interviewSeconds=remainingSeconds(interviewDeadline);const current=$("#interview-timer");if(current)current.textContent=formatClock(interviewSeconds);if(interviewSeconds<=0){stopInterviewTimer();toast("Timpul de 3 minute a expirat. Încheie răspunsul în maximum 20 de secunde.")}};interviewTimer=setInterval(tick,500);tick()};
  startInterviewSimulation=function(){cancelExamSession(true);stopInterviewSimulationTimer();stopInterviewTimer();const ids=chooseInterviewSimulation();if(ids.length<3){toast("Nu există suficiente spețe pentru simularea completă.");return}interviewSimulation={active:true,finished:false,ids,index:0,seconds:900,scores:{},drafts:{},saved:false,timedOut:false};setInterviewSimulationLayout(true);renderInterviewSimulationPanel();openInterview(ids[0]);simulationDeadline=Date.now()+interviewSimulation.seconds*1000;const tick=()=>{if(!interviewSimulation?.active){stopInterviewSimulationTimer();return}interviewSimulation.seconds=remainingSeconds(simulationDeadline);const display=$("#simulation-timer");if(display)display.textContent=interviewSimulationClock();if(interviewSimulation.seconds<=0)finishInterviewSimulation(true)};interviewSimulationTimer=setInterval(tick,500);tick()};

  adaptiveQuestions=function(){const module=$("#quiz-module").value,size=Number($("#quiz-size").value)||10,now=Date.now(),dueIds=new Set(dueQuestions().filter(q=>!isArticleRecallQuestion(q)).map(q=>q.id)),pool=relevantQuestions(questions).filter(q=>module==="all"||q.law===module);return pool.map(q=>{const stats=state.questionStats[String(q.id)]||{},legacyCorrect=state.correctIds.includes(q.id),attempts=stats.attempts??(legacyCorrect?1:0),correct=stats.correct??(legacyCorrect?1:0),accuracy=attempts?correct/attempts:0,lastSeen=Date.parse(stats.lastSeen||"")||0,ageDays=lastSeen?Math.min(365,(now-lastSeen)/864e5):365;return {q,score:(dueIds.has(q.id)?10000:0)+(attempts===0?5000:0)+(1-accuracy)*1000+ageDays+Math.random()}}).sort((a,b)=>b.score-a.score).slice(0,Math.min(size,pool.length)).map(item=>item.q)};

  startQuiz=function(custom=null,isExam=false){clearInterval(timer);timer=null;examDeadline=0;stopInterviewTimer();if(interviewSimulation?.active)finishInterviewSimulation(false);const module=isExam?"all":$("#quiz-module").value,customPool=Array.isArray(custom);let pool=customPool?custom:questions.filter(q=>module==="all"||q.law===module);pool=relevantQuestions(pool);pool=[...new Map(pool.filter(q=>q&&questionById.has(String(q.id))).map(q=>[String(q.id),q])).values()];const selectedSize=isExam?Math.min(20,pool.length):customPool?pool.length:Math.min(Number($("#quiz-size").value)||10,pool.length);session=shuffle(pool).slice(0,selectedSize);position=0;sessionCorrect=0;examAnswers={};if(!session.length){examMode=false;toast("Nu există grile de conținut pentru această sesiune.");return}examMode=isExam;showView(isExam?"exam":"quiz");if(isExam){seconds=1800;startTimer();renderExam()}else{$("#quiz-setup").classList.add("hidden");$("#quiz-run").classList.remove("hidden");renderQuestion()}};

  renderLegislation=function(){const query=normalizeSearch($("#legislation-search")?.value||""),actFilter=$("#legislation-act")?.value||"all",acts=legislationActs.filter(act=>actFilter==="all"||act.id===actFilter),host=$("#legislation-content");if(!host)return;host.innerHTML=acts.map(act=>{const articles=act.articles.filter(article=>{const subsections=(article.subsections||[]).flatMap(section=>[section.intro,...(section.items||[])]),haystack=normalizeSearch([article.number,article.heading,article.intro,...(article.items||[]),...subsections].join(" "));return !query||haystack.includes(query)});return `<section class="legal-act"><header><div><p class="eyebrow">${act.scope}</p><h2>${act.title}</h2></div><div class="legal-act-actions"><span class="integration-status ${act.status==="integrat"?"done":"pending"}">${act.status==="integrat"?"✓ Integrat":"În curs de integrare"}</span><a class="official-link" href="${act.url}" target="_blank" rel="noopener">Forma consolidată ↗</a></div></header>${act.articles.length?(articles.length?articles.map(renderLegalArticle).join(""):'<div class="empty">Niciun articol nu corespunde căutării.</div>'):`<div class="legal-placeholder">Textul selectat este în curs de verificare și integrare. Până atunci, folosește forma consolidată oficială.</div>`}</section>`}).join("")};

  rebuildQuestionPool();prepareWrittenExam();
  const baseRenderWrittenSet=renderWrittenSet;renderWrittenSet=function(setId){baseRenderWrittenSet(setId);enhanceWrittenWorkspace(setId)};
  const baseRenderOfficial=renderOfficial;renderOfficial=function(){baseRenderOfficial();enhanceOfficialCards()};
  const legislationSelect=$("#legislation-act"),legislationSearch=$("#legislation-search");if(legislationSelect)legislationSelect.onchange=renderLegislation;if(legislationSearch)legislationSearch.oninput=renderLegislation;
  const simulationStart=$("#interview-simulation-start");if(simulationStart)simulationStart.onclick=startInterviewSimulation;
  relabelExamUI();renderOfficial();renderModules();renderStats();renderMistakes();save();

  window.addEventListener("load",()=>{const mobileOfficial=document.querySelector('[data-mobile-more-view="official"] span:last-child'),mobileExam=document.querySelector('[data-mobile-more-view="exam"] span:last-child');if(mobileOfficial)mobileOfficial.textContent="Subiecte ANP";if(mobileExam)mobileExam.textContent="Simulare grile"},{once:true});

  /* exam-training.js is loaded immediately after this file and still identifies the
     original data labels. Expose those labels only for that synchronous initialization,
     then restore the user-facing labels on the next task. */
  const examTrainingTypeSnapshots=officialWritten.map(item=>({item,type:item.type}));
  examTrainingTypeSnapshots.forEach(({item,type})=>{item.type=type==="Speță de calcul"?"Calcul":"Răspuns deschis"});
  setTimeout(()=>examTrainingTypeSnapshots.forEach(({item,type})=>{item.type=type}),0);
})();
