(function(root){
'use strict';

const WORDS = new Map([
  ['zero',0],['un',1],['unu',1],['una',1],['o',1],['doi',2],['doua',2],['trei',3],['patru',4],['cinci',5],
  ['sase',6],['sapte',7],['opt',8],['noua',9],['zece',10],['unsprezece',11],['doisprezece',12],['douasprezece',12],
  ['treisprezece',13],['paisprezece',14],['cincisprezece',15],['saisprezece',16],['saptesprezece',17],['optsprezece',18],
  ['nouasprezece',19],['douazeci',20],['treizeci',30]
]);

function fold(value){
  return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
}

function numberValue(token){
  const value=fold(token).replace(/[^a-z0-9]/g,'');
  if(/^\d+$/.test(value)) return Number(value);
  if(WORDS.has(value)) return WORDS.get(value);
  const compound=value.match(/^(douazeci|treizeci)(?:si)?(un|unu|una|doi|doua|trei|patru|cinci|sase|sapte|opt|noua)$/);
  if(compound) return WORDS.get(compound[1])+WORDS.get(compound[2]);
  return null;
}

function parseDuration(fragment){
  const text=fold(fragment);
  let years=0,months=0,days=0,found=false;
  const token='(?:\\d{1,3}|zero|un|unu|una|o|doi|doua|trei|patru|cinci|sase|sapte|opt|noua|zece|unsprezece|doisprezece|douasprezece|treisprezece|paisprezece|cincisprezece|saisprezece|saptesprezece|optsprezece|nouasprezece|douazeci(?:\\s+si\\s+(?:un|unu|una|doi|doua|trei|patru|cinci|sase|sapte|opt|noua))?|treizeci(?:\\s+si\\s+(?:un|unu|una|doi|doua|trei|patru|cinci|sase|sapte|opt|noua))?)';
  const rx=new RegExp(`(${token})(?:\\s*\\([^)]{1,24}\\))?\\s*(ani|an|luni|luna|zile|zi)\\b`,'gi');
  let m;
  while((m=rx.exec(text))){
    const n=numberValue(m[1]);
    if(!Number.isSafeInteger(n)||n<0) continue;
    found=true;
    if(/^an/.test(m[2])) years=n;
    else if(/^lun/.test(m[2])) months=n;
    else days=n;
  }
  return found?{years,months,days}:null;
}

function extractExplicitFinal(text){
  const original=String(text||'');
  const normalized=fold(original);
  const patterns=[
    /pedeaps(?:a|ei)?\s+(?:principala\s+)?rezultanta[^.;\n]{0,180}/gi,
    /va\s+executa(?:\s+in\s+final)?\s+pedeapsa[^.;\n]{0,180}/gi,
    /executa\s+pedeapsa\s+(?:principala\s+)?rezultanta[^.;\n]{0,180}/gi,
    /pedeapsa\s+finala[^.;\n]{0,180}/gi
  ];
  for(const rx of patterns){
    const m=rx.exec(normalized);
    if(!m) continue;
    const duration=parseDuration(m[0]);
    if(duration&&(duration.years||duration.months||duration.days)){
      const start=Math.max(0,m.index-40),end=Math.min(original.length,m.index+m[0].length+40);
      const source=root.AIDocumentCore?.sourceSnippet?.(original,m.index,original.slice(start,end))||original.slice(start,end).trim();
      return {...duration,source,index:m.index};
    }
  }
  return null;
}

function apply(analysis){
  if(!analysis?.text) return analysis;
  const explicit=extractExplicitFinal(analysis.text);
  if(!explicit) return analysis;
  analysis.finalSentence={years:explicit.years,months:explicit.months,days:explicit.days};
  analysis.extractionMeta={...(analysis.extractionMeta||{}),finalSentence:{source:explicit.source,basis:'explicit_result_duration'}};
  analysis.evidence=Array.isArray(analysis.evidence)?analysis.evidence:[];
  analysis.evidence=analysis.evidence.filter(item=>item?.label!=='Pedeapsă rezultantă');
  analysis.evidence.push({
    label:'Pedeapsă rezultantă',
    value:`${explicit.years} ani, ${explicit.months} luni, ${explicit.days} zile`,
    confidence:'ridicat',
    source:explicit.source,
    ocrConfidence:root.AIDocumentCore?.ocrConfidenceFromSource?.(explicit.source)
  });
  analysis.warnings=(analysis.warnings||[]).filter(w=>!String(w).includes('Pedeapsa rezultantă nu a fost identificată'));
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot7Duration) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){return apply(base(rawText));};
  root.AIDocumentSafety.__betaLot7Duration=true;
}

install();
root.AIBetaLot7Duration={parseDuration,extractExplicitFinal,apply};
})(typeof window!=='undefined'?window:globalThis);
