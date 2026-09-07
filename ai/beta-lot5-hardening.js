(function(root){
'use strict';

const OCR_REVIEW_THRESHOLD=80;
const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';

function clean(v){ return String(v||'').replace(/\u00ad/g,'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').trim(); }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || clean(fragment); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function duration(v){ return root.AIDocumentCore?.durationFromString?.(String(v||'')) || null; }
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function durationLabel(d){ return `${Number(d?.years||0)} ani, ${Number(d?.months||0)} luni, ${Number(d?.days||0)} zile`; }
function sameDuration(a,b){ return !!a&&!!b&&Number(a.years||0)===Number(b.years||0)&&Number(a.months||0)===Number(b.months||0)&&Number(a.days||0)===Number(b.days||0); }
function addWarning(a,msg){ a.warnings=a.warnings||[]; if(msg&&!a.warnings.includes(msg)) a.warnings.push(msg); }
function addEvidence(a,label,value,confidence,source){
  a.evidence=a.evidence||[];
  if(!value||a.evidence.some(x=>x.label===label&&x.value===value)) return;
  const item={label,value,confidence,source}; const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  a.evidence.push(item);
}

function explicitMainSentenceHits(text){
  const value=String(text||''),out=[];
  const patterns=[
    /\bexecut(?:ă|a)\s+pedeapsa\s+principal(?:ă|a)\s+(?:de\s+)?([^.;\n]{0,100})/gi,
    /\bexecut(?:ă|a)\s+pedeapsa\s+(?:de\s+)?([^.;\n]{0,100})/gi
  ];
  for(const rx of patterns){ let m; while((m=rx.exec(value))){
    const d=duration(m[1]); if(!d) continue;
    const source=sourceAt(value,m.index,m[0]);
    out.push({...d,index:m.index,source,ocrConfidence:ocrConfidence(source)});
    if(m[0]==='') rx.lastIndex++;
  }}
  const unique=new Map(); for(const x of out){ const key=`${x.years}-${x.months}-${x.days}`; if(!unique.has(key)) unique.set(key,x); }
  return [...unique.values()];
}

function applyExplicitMainSentence(analysis,text){
  const hits=explicitMainSentenceHits(text); if(!hits.length) return;
  if(hits.length>1){
    analysis.finalSentence={years:0,months:0,days:0}; analysis.numericReviewRequired=true;
    addWarning(analysis,`CONFLICT: formula explicită „EXECUTĂ pedeapsa principală” indică mai multe cuantumuri (${hits.map(durationLabel).join(' / ')}). Completează manual.`);
    return;
  }
  const hit=hits[0],current=analysis.finalSentence;
  const hasCurrent=Boolean(current&&(current.years||current.months||current.days));
  if(hasCurrent&&!sameDuration(current,hit)){
    analysis.finalSentence={years:0,months:0,days:0}; analysis.numericReviewRequired=true;
    addWarning(analysis,`CONFLICT: pedeapsa finală identificată (${durationLabel(current)}) diferă de formula explicită „EXECUTĂ pedeapsa principală” (${durationLabel(hit)}). Completează manual.`);
    return;
  }
  if(Number.isFinite(hit.ocrConfidence)&&hit.ocrConfidence<OCR_REVIEW_THRESHOLD){
    analysis.suggestedFinalSentence={years:hit.years,months:hit.months,days:hit.days};
    analysis.finalSentence={years:0,months:0,days:0}; analysis.numericReviewRequired=true;
    addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: pedeapsa din formula „EXECUTĂ pedeapsa principală” provine din OCR cu încredere ${Math.round(hit.ocrConfidence)}%. Valoarea nu a fost folosită automat.`);
    return;
  }
  analysis.finalSentence={years:hit.years,months:hit.months,days:hit.days};
  addEvidence(analysis,'Pedeapsă finală explicită',durationLabel(hit),'ridicat',hit.source);
}

function mixedRetentionPreventiveRows(text){
  const value=String(text||''),out=[];
  const rx=new RegExp(`(?:se\\s+scade|se\\s+deduce)[^.;\\n]{0,180}?(?:durata\\s+)?(?:reținerii|retinerii)\\s+(?:și|si)\\s+(?:a\\s+)?(?:arestării|arestarii)\\s+preventive[^.;\\n]{0,180}?(?:din\\s+data\\s+de|de\\s+la)\\s*(${DATE_SRC})\\s+(?:la|p(?:â|a)n(?:ă|a)\\s+la)\\s*(?:data\\s+de\\s+)?(${DATE_SRC})`,'gi');
  let m; while((m=rx.exec(value))){
    const a=parseDate(m[1]),b=parseDate(m[2]); if(!a||!b) continue;
    const source=`Perioadă dedusă — ${sourceAt(value,m.index,m[0])} · reținere + arest preventiv indicate global; interval inclusiv, fără inventarea datei schimbării măsurii`;
    const row={start:a.iso,end:b.iso,type:'generic',confidence:'mediu',source,reviewRequired:true};
    const c=ocrConfidence(source); if(Number.isFinite(c)) row.ocrConfidence=c;
    out.push(row);
    if(m[0]==='') rx.lastIndex++;
  }
  return out;
}

function applyMixedRetentionPreventive(analysis,text){
  const rows=mixedRetentionPreventiveRows(text); if(!rows.length) return;
  const existing=analysis.deductions||[];
  const replaced=existing.filter(x=>!rows.some(r=>r.start===x.start&&r.end===x.end));
  analysis.deductions=[...replaced,...rows];
  analysis.numericReviewRequired=true;
  addWarning(analysis,'DEDUCERI: documentul indică global reținerea și arestarea preventivă într-un singur interval. Intervalul este tratat inclusiv și trebuie confirmat; AI nu inventează data schimbării măsurii.');
  for(const row of rows) addEvidence(analysis,'Deducere agregată',`${row.start} – ${row.end}`,'mediu',row.source);
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot5Hardening) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const text=analysis.text||String(rawText||'');
    applyExplicitMainSentence(analysis,text);
    applyMixedRetentionPreventive(analysis,text);
    return analysis;
  };
  root.AIDocumentSafety.__betaLot5Hardening=true;
}

install();
root.AIBetaLot5Hardening={explicitMainSentenceHits,mixedRetentionPreventiveRows,applyExplicitMainSentence,applyMixedRetentionPreventive};
})(typeof window!=='undefined'?window:globalThis);
