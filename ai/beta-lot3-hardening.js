(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
const TIME_SRC='([01]?\\d|2[0-3])[:.]([0-5]\\d)';

function clean(v){ return String(v||'').replace(/\u00ad/g,'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').trim(); }
function fold(v){ return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function duration(v){ return root.AIDocumentCore?.durationFromString?.(v) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || clean(fragment); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function addWarning(a,msg){ if(msg && !(a.warnings||[]).includes(msg)){ a.warnings=a.warnings||[]; a.warnings.push(msg); } }
function addEvidence(a,label,value,confidence,source){
  a.evidence=a.evidence||[];
  if(!value || a.evidence.some(x=>x.label===label&&x.value===value)) return;
  const item={label,value,confidence,source};
  const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  a.evidence.push(item);
}
function sameDuration(a,b){ return !!a&&!!b&&Number(a.years||0)===Number(b.years||0)&&Number(a.months||0)===Number(b.months||0)&&Number(a.days||0)===Number(b.days||0); }
function durationLabel(d){ return `${d?.years||0} ani, ${d?.months||0} luni, ${d?.days||0} zile`; }

function isAdditionalAuxiliary(body){
  const f=fold(body);
  return /cazier(?:ul|ului)?\s+judiciar|situatie\s+generala\s+a\s+cazierului\s+judiciar|sistemul\s+informatic\s+al\s+cazierului\s+judiciar|\brocris\b/.test(f);
}

function scopePrimary(rawText){
  const seg=root.AIBetaLot2Hardening?.segmentPrimaryDocuments?.(rawText);
  if(!seg || seg.primaryDocuments?.length!==1) return {text:String(rawText||''),extraAux:[],multiple:Boolean(seg&&seg.primaryDocuments?.length>1)};
  const doc=seg.primaryDocuments[0], keep=[], extraAux=[];
  for(const page of doc.pages||[]){
    if(page.pageNum!==doc.firstPage && isAdditionalAuxiliary(page.body)) extraAux.push(page);
    else keep.push(page);
  }
  return {text:keep.map(p=>p.raw).join('\n\n'),extraAux,multiple:false};
}

function dayNumber(iso){
  const p=parseDate(iso); if(!p) return null;
  return Math.floor(Date.UTC(p.y,p.m-1,p.d)/86400000);
}
function isNextDay(a,b){ const x=dayNumber(a),y=dayNumber(b); return x!==null&&y!==null&&y-x===1; }
function row(text,index,start,end,type,raw,reason,extra={}){
  const label=type==='retention24h'?'Reținere 24 h':type==='preventive'?'Arest preventiv':type==='home_arrest'?'Arest la domiciliu':'Perioadă dedusă';
  const source=`${label} — ${sourceAt(text,index,raw)}${reason?` · ${reason}`:''}`;
  const value={start,end,type,confidence:'mediu',source,reviewRequired:true,...extra};
  const c=ocrConfidence(source); if(Number.isFinite(c)) value.ocrConfidence=c;
  return value;
}
function uniqueRows(rows){
  const map=new Map();
  for(const r of rows||[]){ if(!r?.start) continue; const key=`${r.start}|${r.end}|${r.type||'generic'}`; if(!map.has(key)) map.set(key,r); }
  return [...map.values()];
}

function retentionClockRows(text){
  const out=[];
  const rx=new RegExp(`(?:durata\\s+)?(?:reținerii|retinerii)[^;\\n]{0,150}?(?:începând\\s+cu\\s+data\\s+de|incepand\\s+cu\\s+data\\s+de|din\\s+data\\s+de)?\\s*(${DATE_SRC})\\s*,?\\s*(?:ora\\s*)?${TIME_SRC}\\s*,?\\s*(?:până\\s+la|pana\\s+la)\\s*(?:data\\s+de\\s*)?(${DATE_SRC})\\s*,?\\s*(?:ora\\s*)?${TIME_SRC}`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]), b=parseDate(m[4]); if(!a||!b) continue;
    const h1=Number(m[2]),min1=Number(m[3]),h2=Number(m[5]),min2=Number(m[6]);
    if(h1!==h2||min1!==min2||!isNextDay(a.iso,b.iso)) continue;
    out.push(row(text,m.index,a.iso,a.iso,'retention24h',m[0],'interval de exact 24 de ore; se deduce 1 zi',{observedEnd:b.iso}));
  }
  return out;
}

function combinedMeasureRows(text,documentDate){
  const out=[];
  const head='(?:reținerii|retinerii)\\s*(?:,|și|si)\\s*(?:arestării|arestarii)\\s+preventive(?:\\s*(?:,|și|si)\\s*arestului\\s+la\\s+domiciliu)?';
  const rx=new RegExp(`(?:durata\\s+)?${head}[^;\\n]{0,120}?(?:începând\\s+cu\\s+data\\s+de|incepand\\s+cu\\s+data\\s+de|din\\s+data\\s+de|de\\s+la\\s+(?:data\\s+de\\s+)?)\\s*(${DATE_SRC})\\s*(?:(?:până\\s+la|pana\\s+la)\\s*(?:data\\s+de\\s*)?(${DATE_SRC})|la\\s+zi)`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]); if(!a) continue;
    const explicit=m[2]?parseDate(m[2]):null;
    const isToDate=/la\s+zi/i.test(m[0]);
    const end=explicit?.iso||(isToDate?documentDate:'');
    if(!end) continue;
    out.push(row(text,m.index,a.iso,end,'generic',m[0],isToDate?`măsuri succesive; „la zi” ancorat la data mandatului ${end}`:'măsuri succesive indicate global; interval inclusiv'));
  }
  return out;
}

function executedRows(text,documentDate){
  const out=[];
  const rx=new RegExp(`perioad(?:a|ei)\\s+(?:deja\\s+)?executat(?:ă|a)[^;\\n]{0,180}?(?:începând\\s+cu\\s+data\\s+de|incepand\\s+cu\\s+data\\s+de|de\\s+la\\s+data(?:\\s+de)?|din\\s+data\\s+de)\\s*(${DATE_SRC})\\s*(?:(?:până\\s+la|pana\\s+la)\\s*(?:data\\s+de\\s*)?(${DATE_SRC})|la\\s+zi)`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]); if(!a) continue;
    const explicit=m[2]?parseDate(m[2]):null;
    const isToDate=/la\s+zi/i.test(m[0]);
    const end=explicit?.iso||(isToDate?documentDate:'');
    if(!end) continue;
    out.push(row(text,m.index,a.iso,end,'generic',m[0],isToDate?`perioadă executată; „la zi” ancorat la data mandatului ${end}`:'perioadă executată indicată expres'));
  }
  return out;
}

function executionFinalCandidate(text){
  const patterns=[
    /urm(?:â|a)nd\s+să\s+execute[^.;\n]{0,100}?pedeapsa(?:\s+rezultantă|\s+rezultanta)?(?:\s+principală|\s+principala)?\s+(?:de\s+)?([^.;\n]{0,60})/gi,
    /execut(?:ă|a)\s*:\s*([^.;\n]{0,60})/gi,
    /în\s+final[^.;\n]{0,100}?pedeapsa\s+rezultant(?:ă|a)\s+(?:de\s+)?([^.;\n]{0,60})/gi
  ];
  const hits=[];
  for(const rx of patterns){ let m; while((m=rx.exec(text))){ const d=duration(m[1]); if(d) hits.push({...d,index:m.index,source:sourceAt(text,m.index,m[0])}); } }
  if(!hits.length) return null;
  hits.sort((a,b)=>a.index-b.index);
  return hits[hits.length-1];
}

function validateOperativeComponents(analysis){
  const final=analysis.finalSentence;
  if(!final || !(final.years||final.months||final.days) || !root.ContopiriCore) return;
  const selected=(analysis.penalties||[]).filter(p=>p.group&&p.group!=='ignore');
  if(selected.length<2) return;
  const groups={concurs:[],recidiva:[],revocare:[],litb:[]};
  for(const p of selected){
    if(!groups[p.group]) return;
    const totalDays=root.ContopiriCore.toDays(Number(p.years||0),Number(p.months||0),Number(p.days||0));
    if(!(totalDays>0)) return;
    groups[p.group].push({...p,totalDays});
  }
  try{
    const calc=root.ContopiriCore.calculate(groups).finalDuration;
    if(sameDuration(calc,final)) return;
    for(const p of selected){ p.suggestedGroup=p.group; p.group='ignore'; p.reviewRequired=true; p.confidence='scăzut'; }
    analysis.numericReviewRequired=true;
    addWarning(analysis,`CONFLICT ARITMETIC: componentele detectate nu reproduc pedeapsa finală de ${durationLabel(final)}. Componentele nu sunt folosite automat.`);
  }catch(_){
    for(const p of selected){ p.suggestedGroup=p.group; p.group='ignore'; p.reviewRequired=true; }
    analysis.numericReviewRequired=true;
    addWarning(analysis,'CONFLICT ARITMETIC: formula componentelor nu a putut fi validată. Componentele nu sunt folosite automat.');
  }
}

function mergeDeductions(analysis,text){
  const clock=retentionClockRows(text);
  let current=[...(analysis.deductions||[])];
  for(const r of clock){
    current=current.filter(x=>!(x.start===r.start&&x.end===r.observedEnd&&/retin/i.test(fold(x.source||''))));
  }
  const extra=[...clock,...combinedMeasureRows(text,analysis.documentDate||''),...executedRows(text,analysis.documentDate||'')];
  if(extra.length){
    current=uniqueRows([...current,...extra]);
    analysis.deductions=current;
    analysis.numericReviewRequired=true;
    if(!(analysis.warnings||[]).some(w=>String(w).startsWith('DEDUCERI:'))) addWarning(analysis,'DEDUCERI: perioadele interpretate automat trebuie confirmate înainte de calcul.');
  }
}

function harden(rawText){
  const base=root.AIDocumentSafety?.__lot3BaseAnalyze || root.AIDocumentSafety?.analyze;
  if(typeof base!=='function') throw new Error('Motorul AI de bază nu este disponibil.');
  const scoped=scopePrimary(rawText);
  if(scoped.multiple) return base(rawText);
  const analysis=base(scoped.text);
  if(scoped.extraAux.length){
    analysis.ignoredAuxiliaryPages=[...(analysis.ignoredAuxiliaryPages||[]),...scoped.extraAux.map(p=>({file:p.file,page:p.pageNum}))];
    addWarning(analysis,`PAGINI AUXILIARE: ${scoped.extraAux.length} pagină(i) de cazier/ROCRIS au fost excluse din extragerea juridică principală.`);
  }
  const final=executionFinalCandidate(scoped.text);
  if(final){
    analysis.finalSentence={years:final.years,months:final.months,days:final.days};
    if(analysis.conflicts) analysis.conflicts.finalSentence=false;
    addEvidence(analysis,'Pedeapsă de executat',durationLabel(final),'ridicat',final.source);
  }
  mergeDeductions(analysis,scoped.text);
  validateOperativeComponents(analysis);
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot3Hardening) return;
  root.AIDocumentSafety.__lot3BaseAnalyze=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=harden;
  root.AIDocumentSafety.__betaLot3Hardening=true;
}
install();
root.AIBetaLot3Hardening={scopePrimary,retentionClockRows,combinedMeasureRows,executedRows,executionFinalCandidate,harden};
})(typeof window!=='undefined'?window:globalThis);
