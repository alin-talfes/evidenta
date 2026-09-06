(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function unique(rows){
  const map=new Map();
  for(const r of rows||[]){ if(!r?.start) continue; const key=`${r.start}|${r.end}|${r.type||'generic'}`; if(!map.has(key)) map.set(key,r); }
  return [...map.values()];
}
function primaryScope(rawText){
  const seg=root.AIBetaLot2Hardening?.segmentPrimaryDocuments?.(rawText);
  if(!seg||seg.primaryDocuments?.length!==1) return String(rawText||'');
  return seg.primaryDocuments[0].text;
}
function preventiveRows(text){
  const out=[];
  const rx=new RegExp(`(?:durata\\s+)?arestării\\s+preventive[^.;\\n]{0,120}?(?:de\\s+la\\s+(?:data\\s+de\\s+)?|din\\s+data\\s+de\\s+)(${DATE_SRC})\\s+(?:până\\s+la|pana\\s+la)\\s*(?:data\\s+de\\s+)?(${DATE_SRC})`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]),b=parseDate(m[2]); if(!a||!b) continue;
    const source=`Arest preventiv — ${sourceAt(text,m.index,m[0])} · interval inclusiv`;
    const row={start:a.iso,end:b.iso,type:'preventive',confidence:'mediu',source,reviewRequired:true};
    const c=ocrConfidence(source); if(Number.isFinite(c)) row.ocrConfidence=c;
    out.push(row);
  }
  return out;
}
function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot2Postprocess) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const text=primaryScope(rawText);
    const extra=preventiveRows(text);
    if(extra.length){
      analysis.deductions=unique([...(analysis.deductions||[]),...extra]);
      analysis.numericReviewRequired=true;
      if(!(analysis.warnings||[]).some(w=>String(w).startsWith('DEDUCERI:'))) analysis.warnings.push('DEDUCERI: perioadele interpretate automat trebuie confirmate înainte de calcul.');
    }
    return analysis;
  };
  root.AIDocumentSafety.__betaLot2Postprocess=true;
}
install();
root.AIBetaLot2Postprocess={preventiveRows,primaryScope};
})(typeof window!=='undefined'?window:globalThis);
