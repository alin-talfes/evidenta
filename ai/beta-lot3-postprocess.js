(function(root){
'use strict';
const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function unique(rows){ const map=new Map(); for(const r of rows||[]){ if(!r?.start) continue; const key=`${r.start}|${r.end}|${r.type||'generic'}`; if(!map.has(key)) map.set(key,r); } return [...map.values()]; }
function primaryScope(rawText){
  const scoped=root.AIBetaLot3Hardening?.scopePrimary?.(rawText);
  if(scoped?.multiple) return {text:String(rawText||''),multiple:true};
  return {text:scoped?.text||String(rawText||''),multiple:false};
}
function preventiveToDateRows(text,documentDate){
  if(!documentDate) return [];
  const out=[];
  const rx=new RegExp(`(?:durata\\s+)?(?:arestului\\s+preventiv|arestării\\s+preventive|arestarii\\s+preventive)[^;\\n]{0,140}?(?:începând\\s+cu\\s+data\\s+de|incepand\\s+cu\\s+data\\s+de|de\\s+la\\s+(?:data\\s+de\\s+)?|din\\s+data\\s+de)\\s*(${DATE_SRC})\\s+la\\s+zi`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]); if(!a) continue;
    const source=`Arest preventiv — ${sourceAt(text,m.index,m[0])} · „la zi” ancorat la data mandatului ${documentDate}`;
    const row={start:a.iso,end:documentDate,type:'preventive',confidence:'mediu',source,reviewRequired:true};
    const c=ocrConfidence(source); if(Number.isFinite(c)) row.ocrConfidence=c;
    out.push(row);
  }
  return out;
}
function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot3Postprocess) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const scoped=primaryScope(rawText);
    if(scoped.multiple) return analysis;
    const extra=preventiveToDateRows(scoped.text,analysis.documentDate||'');
    if(extra.length){
      analysis.deductions=unique([...(analysis.deductions||[]),...extra]);
      analysis.numericReviewRequired=true;
      if(!(analysis.warnings||[]).some(w=>String(w).startsWith('DEDUCERI:'))) analysis.warnings.push('DEDUCERI: perioadele interpretate automat trebuie confirmate înainte de calcul.');
    }
    return analysis;
  };
  root.AIDocumentSafety.__betaLot3Postprocess=true;
}
install();
root.AIBetaLot3Postprocess={preventiveToDateRows,primaryScope};
})(typeof window!=='undefined'?window:globalThis);
