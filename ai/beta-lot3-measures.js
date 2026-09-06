(function(root){
'use strict';
const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function unique(rows){ const map=new Map(); for(const r of rows||[]){ if(!r?.start) continue; const key=`${r.start}|${r.end}|${r.type||'generic'}`; if(!map.has(key)) map.set(key,r); } return [...map.values()]; }
function scope(rawText){ const s=root.AIBetaLot3Hardening?.scopePrimary?.(rawText); return s?.multiple?{text:String(rawText||''),multiple:true}:{text:s?.text||String(rawText||''),multiple:false}; }
function combinedMeasureRows(text,documentDate){
  if(!documentDate) return [];
  const out=[];
  const rx=new RegExp(`(?:durata\\s+)?(?:măsurilor|masurilor)\\s+preventive\\s+privative\\s+de\\s+libertate[^;\\n]{0,160}?(?:respectiv\\s+)?(?:reținere|retinere)\\s*,?\\s*arest\\s+preventiv\\s*(?:și|si|,)\\s*arest\\s+la\\s+domiciliu[^;\\n]{0,120}?(?:începând\\s+cu\\s+data\\s+de|incepand\\s+cu\\s+data\\s+de|de\\s+la|din\\s+data\\s+de)\\s*(${DATE_SRC})\\s+la\\s+zi(?:\\s*[—–-]\\s*(${DATE_SRC}))?`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[1]); if(!a) continue;
    const observed=m[2]?parseDate(m[2]):null;
    const mismatch=observed&&observed.iso!==documentDate;
    const source=`Perioadă dedusă — ${sourceAt(text,m.index,m[0])} · măsuri succesive; „la zi” ancorat la data mandatului ${documentDate}${mismatch?`; endpoint OCR ${observed.iso} ignorat`:''}`;
    const row={start:a.iso,end:documentDate,type:'generic',confidence:'mediu',source,reviewRequired:true};
    const c=ocrConfidence(source); if(Number.isFinite(c)) row.ocrConfidence=c;
    out.push(row);
  }
  return out;
}
function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot3Measures) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const s=scope(rawText); if(s.multiple) return analysis;
    const extra=combinedMeasureRows(s.text,analysis.documentDate||'');
    if(extra.length){
      let rows=[...(analysis.deductions||[])];
      for(const r of extra){ rows=rows.filter(x=>!(x.start===r.start&&/la\s+zi/i.test(x.source||'')&&x.end!==r.end)); }
      analysis.deductions=unique([...rows,...extra]);
      analysis.numericReviewRequired=true;
      if(!(analysis.warnings||[]).some(w=>String(w).startsWith('DEDUCERI:'))) analysis.warnings.push('DEDUCERI: perioadele interpretate automat trebuie confirmate înainte de calcul.');
    }
    return analysis;
  };
  root.AIDocumentSafety.__betaLot3Measures=true;
}
install();
root.AIBetaLot3Measures={combinedMeasureRows};
})(typeof window!=='undefined'?window:globalThis);
