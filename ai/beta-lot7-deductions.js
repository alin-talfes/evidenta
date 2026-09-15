(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';

function parseDate(value){ return root.AIDocumentCore?.parseDateToken?.(String(value||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function addWarning(analysis,message){ analysis.warnings=analysis.warnings||[]; if(message&&!analysis.warnings.includes(message)) analysis.warnings.push(message); }

function makeRow(text,index,start,end,type,fragment,reason){
  const labels={retention24h:'Reținere 24 h',preventive:'Arest preventiv',home_arrest:'Arest la domiciliu',generic:'Perioadă dedusă'};
  const source=`${labels[type]||labels.generic} — ${sourceAt(text,index,fragment)}${reason?` · ${reason}`:''}`;
  const row={start,end,type,confidence:'mediu',source,reviewRequired:true};
  const confidence=ocrConfidence(source);
  if(Number.isFinite(confidence)) row.ocrConfidence=confidence;
  return row;
}

function dedupe(rows){
  const map=new Map();
  for(const row of rows||[]){
    const key=`${row.start||''}|${row.end||''}|${row.type||'generic'}`;
    const existing=map.get(key);
    if(!existing||(!existing.reviewRequired&&row.reviewRequired)) map.set(key,row);
  }
  return [...map.values()];
}

function deductionSegments(text){
  const out=[];
  const rx=/(?:se\s+)?(?:deduce|deducând|deducand|scade|scăzând|scazand)[^;\n]{0,1200}?(?:\bla\s+zi\b|[.;](?=\s*(?:$|[A-ZĂÂÎȘȚ])))/gi;
  let match;
  while((match=rx.exec(String(text||'')))){
    out.push({text:match[0],index:match.index});
    if(match[0]==='') rx.lastIndex++;
  }
  return out;
}

function parseOperationalMixedList(text){
  const rows=[];
  for(const segment of deductionSegments(text)){
    const value=segment.text;
    if(!/(?:reținer|retiner|arestului\s+preventiv|arestării\s+preventive|arestarii\s+preventive|arestului\s+la\s+domiciliu)/i.test(value)) continue;

    const retention=new RegExp(`(?:reținerii|retinerii|reținerea|retinerea)[^,;\\n]{0,90}?(?:din\\s+data\\s+de|de\\s+la|din)\\s*(${DATE_SRC})`,'i').exec(value);
    if(retention){
      const date=parseDate(retention[1]);
      if(date) rows.push(makeRow(text,segment.index+retention.index,date.iso,date.iso,'retention24h',retention[0],'reținere de 24 de ore = 1 zi'));
    }

    const preventive=new RegExp(`(?:arestului\\s+preventiv|arestării\\s+preventive|arestarii\\s+preventive)[^,;\\n]{0,120}?(?:din\\s+data\\s+de|de\\s+la|din)\\s*(${DATE_SRC})\\s*(?:până|pana)\\s*(?:în\\s+)?(?:data\\s+de\\s*)?(${DATE_SRC})`,'i').exec(value);
    if(preventive){
      const start=parseDate(preventive[1]),end=parseDate(preventive[2]);
      if(start&&end&&end.date>=start.date) rows.push(makeRow(text,segment.index+preventive.index,start.iso,end.iso,'preventive',preventive[0],'interval calculat cu ambele capete incluse'));
    }

    const preventiveOpen=new RegExp(`(?:arestului\\s+preventiv|arestării\\s+preventive|arestarii\\s+preventive)[^,;\\n]{0,120}?(?:din\\s+data\\s+de|de\\s+la|din)\\s*(${DATE_SRC})\\s*(?:până\\s+)?la\\s+zi\\b`,'i').exec(value);
    if(preventiveOpen){
      const start=parseDate(preventiveOpen[1]);
      if(start) rows.push(makeRow(text,segment.index+preventiveOpen.index,start.iso,'','preventive',preventiveOpen[0],'interval deschis „la zi”; data stabilește începutul executării'));
    }

    const homeOpen=new RegExp(`(?:arestului\\s+la\\s+domiciliu|arestului\\s+domiciliar)[^,;\\n]{0,120}?(?:din\\s+data\\s+de|de\\s+la|din)\\s*(${DATE_SRC})\\s*(?:până\\s+)?la\\s+zi\\b`,'i').exec(value);
    if(homeOpen){
      const start=parseDate(homeOpen[1]);
      if(start) rows.push(makeRow(text,segment.index+homeOpen.index,start.iso,'','home_arrest',homeOpen[0],'interval deschis „la zi”; data stabilește începutul executării'));
    }

    const homeClosed=new RegExp(`(?:arestului\\s+la\\s+domiciliu|arestului\\s+domiciliar)[^,;\\n]{0,120}?(?:din\\s+data\\s+de|de\\s+la|din)\\s*(${DATE_SRC})\\s*(?:până|pana)\\s*(?:în\\s+)?(?:data\\s+de\\s*)?(${DATE_SRC})`,'i').exec(value);
    if(homeClosed){
      const start=parseDate(homeClosed[1]),end=parseDate(homeClosed[2]);
      if(start&&end&&end.date>=start.date) rows.push(makeRow(text,segment.index+homeClosed.index,start.iso,end.iso,'home_arrest',homeClosed[0],'interval calculat cu ambele capete incluse'));
    }
  }
  return dedupe(rows);
}

function apply(analysis){
  if(!analysis?.text) return analysis;
  const extra=parseOperationalMixedList(analysis.text);
  if(!extra.length) return analysis;
  analysis.deductions=dedupe([...(analysis.deductions||[]),...extra]);
  analysis.numericReviewRequired=true;
  addWarning(analysis,'DEDUCERI MIXTE: reținerea, arestul preventiv și arestul la domiciliu au fost separate pe rânduri. Confirmă perioadele extrase înainte de operare.');
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot7Deductions) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){ return apply(base(rawText)); };
  root.AIDocumentSafety.__betaLot7Deductions=true;
}

install();
root.AIBetaLot7Deductions={deductionSegments,parseOperationalMixedList,apply};
})(typeof window!=='undefined'?window:globalThis);
