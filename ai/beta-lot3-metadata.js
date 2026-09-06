(function(root){
'use strict';
function uniquePages(items){
  const map=new Map();
  for(const item of items||[]){
    if(!item) continue;
    const key=`${item.file||''}|${item.page||item.pageNum||0}`;
    if(!map.has(key)) map.set(key,{file:item.file||'',page:Number(item.page||item.pageNum||0)});
  }
  return [...map.values()];
}
function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot3Metadata) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const seg=root.AIBetaLot2Hardening?.segmentPrimaryDocuments?.(rawText);
    if(seg?.primaryDocuments?.length===1 && seg.auxiliaryPages?.length){
      analysis.ignoredAuxiliaryPages=uniquePages([
        ...(analysis.ignoredAuxiliaryPages||[]),
        ...seg.auxiliaryPages.map(p=>({file:p.file,page:p.pageNum}))
      ]);
      if(!(analysis.warnings||[]).some(w=>String(w).startsWith('PAGINI AUXILIARE:'))){
        analysis.warnings=analysis.warnings||[];
        analysis.warnings.push(`PAGINI AUXILIARE: ${seg.auxiliaryPages.length} pagină(i) au fost excluse din extragerea juridică principală.`);
      }
    }
    return analysis;
  };
  root.AIDocumentSafety.__betaLot3Metadata=true;
}
install();
root.AIBetaLot3Metadata={uniquePages};
})(typeof window!=='undefined'?window:globalThis);
