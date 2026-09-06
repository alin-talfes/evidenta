(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
const DATE_RX=new RegExp(DATE_SRC,'g');
const MONTHS={ianuarie:1,februarie:2,martie:3,aprilie:4,mai:5,iunie:6,iulie:7,august:8,septembrie:9,octombrie:10,noiembrie:11,decembrie:12};

function clean(v){ return String(v||'').replace(/\u00ad/g,'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').trim(); }
function fold(v){ return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function duration(v){ return root.AIDocumentCore?.durationFromString?.(v) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || clean(fragment); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function addWarning(a,msg){ if (msg && !a.warnings.includes(msg)) a.warnings.push(msg); }
function removeWarnings(a,prefix){ a.warnings=(a.warnings||[]).filter(w=>!String(w).startsWith(prefix)); }
function addEvidence(a,label,value,confidence,source){
  if (!value || (a.evidence||[]).some(x=>x.label===label&&x.value===value)) return;
  const item={label,value,confidence,source};
  const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  a.evidence.push(item);
}
function sameDuration(a,b){ return !!a&&!!b&&a.years===b.years&&a.months===b.months&&a.days===b.days; }
function durationLabel(d){ return `${d.years||0} ani, ${d.months||0} luni, ${d.days||0} zile`; }
function dayNumber(v){ const p=parseDate(v); if(!p) return null; return Math.floor(Date.UTC(p.y,p.m-1,p.d)/86400000); }

function parseWrittenDate(token){
  const numeric=parseDate(token); if(numeric) return numeric.iso;
  const m=fold(token).match(/\b([0-3]?\d)\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+((?:19|20)\d{2})\b/);
  if(!m) return '';
  const d=Number(m[1]),mo=MONTHS[m[2]],y=Number(m[3]);
  const dt=new Date(y,mo-1,d); if(dt.getFullYear()!==y||dt.getMonth()!==mo-1||dt.getDate()!==d) return '';
  return `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}`;
}

function extractDocumentDate(text){
  const patterns=[
    /mandat\s+de\s+executare[\s\S]{0,180}?\bnr\.?[^\n]{0,60}?\bdin\s+([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i,
    /mandat\s+de\s+executare[\s\S]{0,180}?\bnr\.?[^\n]{0,60}?\bdin\s+([0-3]?\d\s+(?:ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(?:19|20)\d{2})/i,
    /\bemis\s+la\s+([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ];
  for(const rx of patterns){ const m=rx.exec(text); if(m){ const value=parseWrittenDate(m[1]); if(value) return {value,index:m.index,source:sourceAt(text,m.index,m[0])}; } }
  return null;
}

function strongFinalCandidates(text){
  const patterns=[
    /execut(?:ă|a)\s+pedeapsa\s+(?:principală|principala)?\s*(?:rezultantă|rezultanta)?\s*(?:de\s+)?([^.;\n]{0,90})/gi,
    /(?:în|in)\s+final[^.;\n]{0,100}?pedeapsa(?:\s+principală|\s+principala)?(?:\s+rezultantă|\s+rezultanta)?(?:\s+de\s+executat)?\s*(?:este|fiind|rămâne|ramane)?\s*(?:de|:)?\s*([^.;\n]{0,90})/gi,
    /executând\s+pedeapsa\s+principală\s+rezultantă\s+de\s+([^.;\n]{0,90})/gi,
    /executand\s+pedeapsa\s+principala\s+rezultanta\s+de\s+([^.;\n]{0,90})/gi,
    /urmând\s+să\s+execute\s+pedeapsa(?:\s+principală)?\s+(?:de\s+)?([^.;\n]{0,90})/gi,
    /urmand\s+sa\s+execute\s+pedeapsa(?:\s+principala)?\s+(?:de\s+)?([^.;\n]{0,90})/gi
  ];
  const out=[];
  for(const rx of patterns){ let m; while((m=rx.exec(text))){ const d=duration(m[1]); if(!d) continue; const source=sourceAt(text,m.index,m[0]); out.push({...d,index:m.index,source,ocrConfidence:ocrConfidence(source)}); } }
  const map=new Map(); for(const x of out) if(!map.has(`${x.years}-${x.months}-${x.days}`)) map.set(`${x.years}-${x.months}-${x.days}`,x);
  return [...map.values()];
}

function extractAlternativeBirth(text){
  const m=/(?:născut|nascut)(?:ă|a)?\s+(?:în|in)\s+data\s+de\s+([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i.exec(text);
  if(!m) return null; const p=parseDate(m[1]); return p?{value:p.iso,index:m.index,source:sourceAt(text,m.index,m[0])}:null;
}

function makeDed(text,index,start,end,type,fragment,{reviewRequired=false,reason=''}={}){
  const sourcePrefix=type==='retention24h'?'Reținere 24 h — ':type==='preventive'?'Arest preventiv — ':type==='home_arrest'?'Arest la domiciliu — ':'Perioadă dedusă — ';
  const source=`${sourcePrefix}${sourceAt(text,index,fragment)}${reason?` · ${reason}`:''}`;
  const row={start,end,type,confidence:reviewRequired?'mediu':'ridicat',source,reviewRequired};
  const c=ocrConfidence(source); if(Number.isFinite(c)) row.ocrConfidence=c;
  return row;
}
function dedupeDeds(rows){
  const map=new Map();
  for(const r of rows){ const key=`${r.start}|${r.end}|${r.type}`; if(!map.has(key)||(!map.get(key).reviewRequired&&r.reviewRequired)) map.set(key,r); }
  return [...map.values()];
}

function extractClockRetention(text){
  const rows=[];
  const rx=new RegExp(`(?:durata\\s+)?reținerii[^.;\\n]{0,120}?(${DATE_SRC})\\s+ora\\s+\\d{1,2}:\\d{2}\\s*[—–-]\\s*(${DATE_SRC})\\s+ora\\s+\\d{1,2}:\\d{2}(?:\\s*\\((?:o|1|0)\\s+zi\\))?`,'gi');
  let m; while((m=rx.exec(text))){ const a=parseDate(m[1]),b=parseDate(m[2]); if(!a||!b) continue; rows.push(makeDed(text,m.index,a.iso,b.iso,'retention24h',m[0],{reviewRequired:true,reason:'interval identificat textual ca reținere; confirmă înainte de calcul'})); }
  return rows;
}

function intervalItems(segment){
  const out=[];
  const rx=new RegExp(`(${DATE_SRC})\\s*(?:[—–-]|(?:la|până\\s+la|pana\\s+la))\\s*(?:data\\s+de\\s+)?(${DATE_SRC}|zi\\b)|(${DATE_SRC})`,'gi');
  let m; while((m=rx.exec(segment))){
    if(m[1]) out.push({start:m[1],end:m[2].toLowerCase()==='zi'?'la zi':m[2],raw:m[0],index:m.index});
    else out.push({start:m[3],end:'',raw:m[0],index:m.index});
  }
  return out;
}

function extractMixedRetainedArrested(text,documentDate){
  const rows=[];
  const rx=/(?:a\s+fost\s+)?reținut(?:ă|a)?\s+(?:și|si)\s+arestat(?:ă|a)?\s+preventiv(?:ă|a)?[^.;]{0,460}/gi;
  let m; while((m=rx.exec(text))){
    const items=intervalItems(m[0]).filter(x=>x.end);
    items.forEach((item,i)=>{
      const a=parseDate(item.start); if(!a) return;
      if(i===0&&item.end!=='la zi'){
        const b=parseDate(item.end); if(!b) return;
        const span=dayNumber(b.iso)-dayNumber(a.iso);
        if(span<=1){ rows.push(makeDed(text,m.index+item.index,a.iso,a.iso,'retention24h',item.raw,{reviewRequired:true,reason:'prima perioadă din formula „reținut și arestat preventiv”; tratată ca reținere de 24 h'})); return; }
      }
      if(item.end==='la zi'){
        rows.push(makeDed(text,m.index+item.index,a.iso,documentDate||'','preventive',item.raw,{reviewRequired:true,reason:documentDate?`„la zi” propus până la data mandatului ${documentDate}`:'„la zi” necesită completarea manuală a datei de sfârșit'}));
      } else {
        const b=parseDate(item.end); if(b) rows.push(makeDed(text,m.index+item.index,a.iso,b.iso,'preventive',item.raw,{reviewRequired:true,reason:'tipul perioadei a fost dedus din formularea mixtă; confirmă'}));
      }
    });
  }
  return rows;
}

function extractRespectivList(text,documentDate){
  const rows=[];
  const rx=/durata\s+reținerii\s*,\s*arestării\s+preventive[\s\S]{0,320}?respectiv\s+([^.;\n]{0,260})/gi;
  let m; while((m=rx.exec(text))){
    const items=intervalItems(m[1]);
    items.forEach((item,i)=>{
      const a=parseDate(item.start); if(!a) return;
      if(!item.end){
        rows.push(makeDed(text,m.index,a.iso,a.iso,i===0?'retention24h':'generic',item.raw,{reviewRequired:true,reason:i===0?'prima dată singulară din lista „reținerii, arestării preventive...” este tratată ca reținere de 1 zi':'dată singulară din listă; verifică'}));
      } else if(item.end==='la zi'){
        rows.push(makeDed(text,m.index+item.index,a.iso,documentDate||'','generic',item.raw,{reviewRequired:true,reason:documentDate?`„la zi” propus până la data mandatului ${documentDate}`:'„la zi” necesită completarea manuală a datei de sfârșit'}));
      } else {
        const b=parseDate(item.end); if(b) rows.push(makeDed(text,m.index+item.index,a.iso,b.iso,'generic',item.raw,{reviewRequired:true,reason:'lista combină arest preventiv/arest la domiciliu/perioadă executată; calculul rămâne inclusiv'}));
      }
    });
  }
  return rows;
}

function advancedDeductions(text,documentDate){ return dedupeDeds([...extractClockRetention(text),...extractMixedRetainedArrested(text,documentDate),...extractRespectivList(text,documentDate)]); }

function parseDurationList(value){
  const f=fold(value),out=[];
  const rx=/(\d{1,2})\s*(?:ani|an)(?:\s*(?:si\s*)?(\d{1,2})\s*(?:luni|luna))?|(\d{1,2})\s*(?:luni|luna)/g;
  let m; while((m=rx.exec(f))){ if(m[1]) out.push({years:Number(m[1]),months:Number(m[2]||0),days:0}); else out.push({years:0,months:Number(m[3]),days:0}); }
  return out;
}
function sameAsFinal(durationValue,finalSentence){ return sameDuration(durationValue,finalSentence); }
function calcPenalties(penalties){
  if(!root.ContopiriCore||!penalties.length) return null;
  const groups={concurs:[],recidiva:[],revocare:[],litb:[]};
  for(const p of penalties){ if(!groups[p.group]) continue; groups[p.group].push({...p,totalDays:root.ContopiriCore.toDays(p.years,p.months,p.days)}); }
  try { return root.ContopiriCore.calculate(groups).finalDuration; } catch(_){ return null; }
}

function extractContestFormula(text,finalSentence){
  const main=/pedeapsa\s+principală\s+cea\s+mai\s+grea\s*,?\s*de\s+([^,.;\n]{0,55})/i.exec(text);
  const others=/o\s+treime\s+din\s+totalul\s+celorlalte\s+pedepse\s+principale\s*\(([\s\S]{10,1100}?)\)\s*,?\s*respectiv/i.exec(text);
  if(!main||!others) return null;
  const base=duration(main[1]),list=parseDurationList(others[1]); if(!base||!list.length) return null;
  const src=sourceAt(text,main.index,text.slice(main.index,Math.min(text.length,others.index+others[0].length)));
  const penalties=[{...base,group:'concurs',confidence:'ridicat',source:src},...list.map(d=>({...d,group:'concurs',confidence:'ridicat',source:src}))];
  const calc=calcPenalties(penalties); if(!calc||!sameAsFinal(calc,finalSentence)) return {penalties:null,warning:`Formula de contopire a fost identificată, dar recalcularea nu coincide cu pedeapsa finală (${calc?durationLabel(calc):'nerecalculabil'} vs ${durationLabel(finalSentence)}). Rândurile nu au fost aplicate automat.`};
  return {penalties,source:src};
}

function extractRevocationAlongside(text,finalSentence){
  const current=/a\s+fost\s+condamnat[^.;\n]{0,140}?pedeapsa\s+(?:închisorii\s+)?de\s+([^.;\n]{0,55})/i.exec(text);
  const revoked=/revocat(?:ă|a)?[\s\S]{0,180}?suspendarea[\s\S]{0,140}?pedepsei\s+de\s+([^.;\n]{0,55})/i.exec(text);
  if(!current||!revoked||!/alături|alaturi/i.test(text)) return null;
  const a=duration(current[1]),b=duration(revoked[1]); if(!a||!b) return null;
  const currentGroup=/recidivă\s+postcondamnatorie|recidiva\s+postcondamnatorie/i.test(text)?'recidiva':'revocare';
  const p1={...a,group:currentGroup,confidence:'mediu',source:sourceAt(text,current.index,current[0])};
  const p2={...b,group:'revocare',confidence:'ridicat',source:sourceAt(text,revoked.index,revoked[0])};
  const calc=calcPenalties([p1,p2]); if(!calc||!sameAsFinal(calc,finalSentence)) return null;
  return {penalties:[p1,p2],source:`${p1.source} | ${p2.source}`};
}

function harden(rawText){
  const original=root.AIDocumentSafety?.__baseAnalyze || root.AIDocumentSafety?.analyze;
  if(typeof original!=='function') throw new Error('Motorul AI de bază nu este disponibil.');
  const analysis=original(rawText),text=analysis.text||String(rawText||'');
  analysis.evidence=analysis.evidence||[]; analysis.warnings=analysis.warnings||[];

  const docDate=extractDocumentDate(text); if(docDate){ analysis.documentDate=docDate.value; addEvidence(analysis,'Data mandatului',docDate.value,'ridicat',docDate.source); }

  if(!analysis.birthDate){ const alt=extractAlternativeBirth(text); if(alt){ analysis.birthDate=alt.value; addEvidence(analysis,'Data nașterii',alt.value,'ridicat',alt.source); removeWarnings(analysis,'Data nașterii nu a fost identificată'); } }

  const finals=strongFinalCandidates(text);
  if(finals.length===1){
    const f=finals[0]; analysis.finalSentence={years:f.years,months:f.months,days:f.days};
    analysis.finalSentenceCandidates=finals; if(analysis.conflicts) analysis.conflicts.finalSentence=false;
    removeWarnings(analysis,'CONFLICT: apar mai multe pedepse prezentate ca rezultante/finale');
    removeWarnings(analysis,'Pedeapsa rezultantă nu a fost identificată');
    addEvidence(analysis,'Pedeapsă de executat',durationLabel(f),'ridicat',f.source);
  } else if(finals.length>1){
    analysis.finalSentence={years:0,months:0,days:0};
    if(analysis.conflicts) analysis.conflicts.finalSentence=true;
    addWarning(analysis,`CONFLICT: formulele finale explicite indică mai multe cuantumuri (${finals.map(durationLabel).join(' / ')}). Completează manual.`);
  }

  const final=analysis.finalSentence;
  if((final?.years||final?.months||final?.days)){
    const formula=extractContestFormula(text,final);
    if(formula?.penalties){ analysis.penalties=formula.penalties; addEvidence(analysis,'Contopire verificată',`${analysis.penalties.length} pedepse componente → ${durationLabel(final)}`,'ridicat',formula.source); }
    else if(formula?.warning) addWarning(analysis,formula.warning);
    else {
      const revocation=extractRevocationAlongside(text,final);
      if(revocation){ analysis.penalties=revocation.penalties; addEvidence(analysis,'Alăturare/revocare verificată',`${durationLabel(revocation.penalties[0])} + ${durationLabel(revocation.penalties[1])} → ${durationLabel(final)}`,'mediu',revocation.source); }
    }
  }

  const deds=advancedDeductions(text,analysis.documentDate||'');
  if(deds.length){
    analysis.deductions=deds;
    if(deds.some(x=>x.reviewRequired)) addWarning(analysis,'DEDUCERI: unele perioade au fost interpretate din formule mixte sau din expresia „la zi”. Confirmă rândurile marcate înainte de calcul.');
  }

  analysis.numericReviewRequired=(analysis.penalties||[]).some(x=>x.reviewRequired)||(analysis.deductions||[]).some(x=>x.reviewRequired)||(analysis.warnings||[]).some(w=>String(w).includes('NECESITĂ VERIFICARE NUMERICĂ'));
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__realDocHardening) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.__baseAnalyze=base;
  root.AIDocumentSafety.analyze=harden;
  root.AIDocumentSafety.__realDocHardening=true;
}
install();

root.AIRealDocumentHardening={harden,extractDocumentDate,strongFinalCandidates,advancedDeductions,extractContestFormula,extractRevocationAlongside,parseDurationList};
})(typeof window!=='undefined'?window:globalThis);
