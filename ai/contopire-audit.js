(function(root){
'use strict';

function clean(v){ return String(v||'').replace(/\u00ad/g,'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').trim(); }
function duration(v){ return root.AIDocumentCore?.durationFromString?.(String(v||'')) || null; }
function toDays(d){ return d?root.ContopiriCore?.toDays?.(Number(d.years||0),Number(d.months||0),Number(d.days||0)):null; }
function label(d){ return d&&root.ContopiriCore?.formatDuration?root.ContopiriCore.formatDuration(d):`${d?.years||0} ani, ${d?.months||0} luni, ${d?.days||0} zile`; }
function sameDays(a,b){ const x=toDays(a),y=toDays(b); return Number.isFinite(x)&&Number.isFinite(y)&&x===y; }
function addWarning(a,msg){ a.warnings=a.warnings||[]; if(msg&&!a.warnings.includes(msg)) a.warnings.push(msg); }
function addEvidence(a,labelText,value,source){
  a.evidence=a.evidence||[];
  if(a.evidence.some(x=>x.label===labelText&&x.value===value)) return;
  a.evidence.push({label:labelText,value,confidence:'ridicat',source:clean(source).slice(0,900)});
}

function parseDurations(value){
  const text=String(value||''),out=[];
  const rx=/(\d{1,2})\s*(?:ani|an)\b(?:\s*(?:și|si)?\s*(\d{1,2})\s*(?:luni|lună|luna)\b)?(?:\s*(?:și|si)?\s*(\d{1,3})\s*(?:de\s+)?(?:zile|zi)\b)?|(\d{1,2})\s*(?:luni|lună|luna)\b(?:\s*(?:și|si)?\s*(\d{1,3})\s*(?:de\s+)?(?:zile|zi)\b)?|(\d{1,3})\s*(?:de\s+)?(?:zile|zi)\b/gi;
  let m;
  while((m=rx.exec(text))){
    const d=m[1]
      ? {years:Number(m[1]),months:Number(m[2]||0),days:Number(m[3]||0)}
      : m[4]
        ? {years:0,months:Number(m[4]),days:Number(m[5]||0)}
        : {years:0,months:0,days:Number(m[6]||0)};
    if(toDays(d)>0) out.push({...d,index:m.index,raw:m[0]});
    if(m[0]==='') rx.lastIndex++;
  }
  return out;
}

function lastPatternDuration(text,patterns){
  let best=null;
  for(const rx0 of patterns){
    const flags=rx0.flags.includes('g')?rx0.flags:`${rx0.flags}g`;
    const rx=new RegExp(rx0.source,flags);
    let m;
    while((m=rx.exec(text))){
      const d=duration(m[1]);
      if(d&&(!best||m.index>best.index)) best={...d,index:m.index,raw:m[0]};
      if(m[0]==='') rx.lastIndex++;
    }
  }
  return best;
}

function fallbackConvictions(text,contestIndex){
  const before=String(text||'').slice(Math.max(0,contestIndex-3200),contestIndex);
  const out=[];
  const rx=/condamn(?:ă|a)[^.;\n]{0,190}?pedeaps(?:a|ă|ei)\s+(?:închisorii\s+)?(?:de\s+)?([^.;\n]{0,85})/gi;
  let m;
  while((m=rx.exec(before))){
    const d=duration(m[1]);
    if(d&&toDays(d)>0) out.push({...d,index:m.index,raw:m[0]});
    if(m[0]==='') rx.lastIndex++;
  }
  return out.slice(-4);
}

function declaredBonus(text){
  const patterns=[
    /spor(?:ul)?[^.;\n]{0,220}?respectiv\s+([^.;\n]{0,80})/i,
    /spor(?:ul)?[^.;\n]{0,220}?=\s*([^),.;\n]{0,80})/i,
    /spor(?:ul)?\s+(?:obligatoriu\s+)?(?:de|este)\s+((?:\d{1,2}\s*(?:ani|an|luni|lună|luna)|\d{1,3}\s*(?:de\s+)?(?:zile|zi))[^.;\n]{0,45})/i
  ];
  for(const rx of patterns){ const m=rx.exec(text); if(m){ const d=duration(m[1]); if(d) return d; } }
  return null;
}

function auditOne(text,contestIndex){
  const segment=String(text||'').slice(contestIndex,Math.min(String(text||'').length,contestIndex+2200));
  const maxMatch=/pedeapsa\s+cea\s+mai\s+grea\s+(?:de\s+)?([^.;\n]{0,85})/i.exec(segment);
  if(!maxMatch) return null;
  const declaredMax=duration(maxMatch[1]);
  if(!declaredMax) return null;

  const beforeMax=segment.slice(0,maxMatch.index);
  const penaltiesPos=Math.max(beforeMax.toLowerCase().lastIndexOf('pedepsele'),beforeMax.toLowerCase().lastIndexOf('pedepselor'));
  let components=penaltiesPos>=0?parseDurations(beforeMax.slice(penaltiesPos)):[];
  if(components.length<2) components=fallbackConvictions(text,contestIndex);
  if(components.length<2) return null;

  const groups={concurs:components.map(d=>({...d,totalDays:toDays(d)})),recidiva:[],revocare:[],litb:[]};
  let calc;
  try { calc=root.ContopiriCore.calculate(groups); } catch(_){ return null; }

  const addMatch=/la\s+care\s+se\s+adaug(?:ă|a)\s+pedeapsa\s+(?:de\s+)?([^.;\n]{0,85})/i.exec(segment);
  const preAdd=addMatch?segment.slice(0,addMatch.index):segment;
  const postAdd=addMatch?segment.slice(addMatch.index):'';
  const bonus=declaredBonus(preAdd);
  const contestResult=lastPatternDuration(preAdd,[
    /(?:urmând|urmand)[^.;\n]{0,180}?(?:execute|executa)[^.;\n]{0,60}?pedeapsa(?:\s+rezultantă|\s+rezultanta)?\s+(?:de\s+)?([^.;\n]{0,85})/gi,
    /pedeapsa\s+rezultant(?:ă|a)\s+(?:de\s+)?([^.;\n]{0,85})/gi
  ]);
  const addition=addMatch?duration(addMatch[1]):null;
  const finalAfterAddition=addMatch?lastPatternDuration(postAdd,[
    /(?:urmând|urmand)[^.;\n]{0,200}?(?:în\s+final|in\s+final)[^.;\n]{0,120}?(?:execute|executa)[^.;\n]{0,70}?pedeapsa(?:\s+rezultantă|\s+rezultanta)?\s+(?:de\s+)?([^.;\n]{0,85})/gi,
    /(?:în\s+final|in\s+final)[^.;\n]{0,140}?pedeapsa(?:\s+rezultantă|\s+rezultanta)?\s+(?:de\s+)?([^.;\n]{0,85})/gi
  ]):null;

  const mismatches=[];
  const expectedMax=calc.maxPenalty?root.ContopiriCore.fromDays(calc.maxPenalty.totalDays):null;
  if(expectedMax&&!sameDays(declaredMax,expectedMax)) mismatches.push(`pedeapsa cea mai grea este indicată ca ${label(declaredMax)}, dar din componente rezultă ${label(expectedMax)}`);
  if(bonus&&toDays(bonus)!==calc.bonusDays) mismatches.push(`sporul este indicat ca ${label(bonus)}, dar 1/3 din celelalte pedepse înseamnă ${label(root.ContopiriCore.fromDays(calc.bonusDays))}`);
  if(contestResult&&!sameDays(contestResult,calc.finalDuration)) mismatches.push(`rezultanta concursului este indicată ca ${label(contestResult)}, dar calculul componentelor dă ${label(calc.finalDuration)}`);

  let expectedFinal=calc.finalDuration;
  if(addition){
    const total=calc.finalDays+toDays(addition);
    expectedFinal=root.ContopiriCore.fromDays(total);
    if(finalAfterAddition&&!sameDays(finalAfterAddition,expectedFinal)) mismatches.push(`rezultanta finală după adăugarea de ${label(addition)} este indicată ca ${label(finalAfterAddition)}, dar calculul dă ${label(expectedFinal)}`);
  }

  return {components,declaredMax,bonus,contestResult,addition,finalAfterAddition,expectedContest:calc.finalDuration,expectedFinal,mismatches,source:segment};
}

function auditText(text){
  const value=String(text||''),audits=[];
  const rx=/contope(?:ște|ste)\b/gi;
  let m;
  while((m=rx.exec(value))){
    const audit=auditOne(value,m.index);
    if(audit) audits.push(audit);
    if(m[0]==='') rx.lastIndex++;
  }
  return audits;
}

function validateSelectedAgainstFinal(analysis){
  const final=analysis.finalSentence;
  if(!final||!toDays(final)) return;
  const selected=(analysis.penalties||[]).filter(p=>p.group&&p.group!=='ignore');
  if(!selected.length) return;
  const groups={concurs:[],recidiva:[],revocare:[],litb:[]};
  for(const p of selected){
    if(!groups[p.group]) return;
    const totalDays=toDays(p);
    if(!(totalDays>0)) return;
    groups[p.group].push({...p,totalDays});
  }
  let calc;
  try { calc=root.ContopiriCore.calculate(groups); } catch(_){ return; }
  if(sameDays(calc.finalDuration,final)) return;
  for(const p of selected){
    p.suggestedGroup=p.group;
    p.group='ignore';
    p.reviewRequired=true;
    p.confidence='scăzut';
  }
  analysis.arithmeticConflict=true;
  analysis.numericReviewRequired=true;
  addWarning(analysis,`CONFLICT ARITMETIC: componentele detectate automat ar produce ${label(calc.finalDuration)}, dar documentul indică ${label(final)}. Componentele au fost trecute pe „Ignoră” până la verificare.`);
}

function apply(analysis,text){
  const audits=auditText(text);
  if(audits.length){
    analysis.contopireAudits=audits.map(a=>({
      components:a.components.map(x=>({years:x.years,months:x.months,days:x.days})),
      expectedContest:a.expectedContest,
      expectedFinal:a.expectedFinal,
      mismatches:[...a.mismatches]
    }));
    const problems=audits.filter(a=>a.mismatches.length);
    if(problems.length){
      analysis.arithmeticConflict=true;
      analysis.numericReviewRequired=true;
      for(const p of analysis.penalties||[]){ if(p.group==='concurs'){ p.reviewRequired=true; if(p.confidence==='ridicat') p.confidence='mediu'; } }
      for(const audit of problems){
        addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ — CONFLICT ARITMETIC CONTOPIRE: ${audit.mismatches.join('; ')}. Verifică hotărârea/mandatul înainte de calcul; modulul nu corectează automat pedeapsa dispusă.`);
      }
    } else {
      for(const audit of audits){
        const components=audit.components.map(label).join(' + ');
        const value=audit.addition
          ? `${components} → concurs ${label(audit.expectedContest)}; + ${label(audit.addition)} → ${label(audit.expectedFinal)}`
          : `${components} → ${label(audit.expectedContest)}`;
        addEvidence(analysis,'Contopire verificată aritmetic',value,audit.source);
      }
    }
  } else {
    validateSelectedAgainstFinal(analysis);
  }
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__contopireAudit) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    return apply(analysis,String(rawText||''));
  };
  root.AIDocumentSafety.__contopireAudit=true;
}

install();
root.AIContopireAudit={parseDurations,auditText,validateSelectedAgainstFinal,apply};
})(typeof window!=='undefined'?window:globalThis);
