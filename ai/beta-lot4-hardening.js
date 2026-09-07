(function(root){
'use strict';

const OCR_REVIEW_THRESHOLD = 80;

function clean(value){
  return String(value || '')
    .replace(/\u00ad/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function fold(value){
  return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function sourceAt(text,index,fragment){
  return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || clean(fragment);
}

function ocrConfidence(source){
  return root.AIDocumentCore?.ocrConfidenceFromSource?.(source);
}

function duration(value){
  return root.AIDocumentCore?.durationFromString?.(String(value || '')) || null;
}

function durationLabel(d){
  return `${Number(d?.years || 0)} ani, ${Number(d?.months || 0)} luni, ${Number(d?.days || 0)} zile`;
}

function sameDuration(a,b){
  return Boolean(a && b) && Number(a.years || 0) === Number(b.years || 0) && Number(a.months || 0) === Number(b.months || 0) && Number(a.days || 0) === Number(b.days || 0);
}

function addWarning(analysis,message){
  analysis.warnings = analysis.warnings || [];
  if (message && !analysis.warnings.includes(message)) analysis.warnings.push(message);
}

function addEvidence(analysis,label,value,confidence,source){
  analysis.evidence = analysis.evidence || [];
  if (!value || analysis.evidence.some(item => item.label === label && item.value === value)) return;
  const item = { label, value, confidence, source };
  const c = ocrConfidence(source);
  if (Number.isFinite(c)) item.ocrConfidence = c;
  analysis.evidence.push(item);
}

function normalizedDate(day,month,year){
  const d = Number(day), m = Number(month), y = Number(String(year || '').replace(/\s+/g,''));
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return '';
  const date = new Date(y,m-1,d);
  if (date.getFullYear() !== y || date.getMonth() !== m-1 || date.getDate() !== d) return '';
  return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
}

function collectReceiptStampHits(text){
  const value = String(text || '');
  const hits = [];
  const patterns = [
    /(?:intrare|intrarea)\s*nr\.?[^\n]{0,45}?[\/:|-]\s*([0-3]?\d)[.\s\/-]+([01]?\d)[.\s\/-]+((?:19|20)\s?\d{2})/gi,
    /\bziua\s*([0-3]?\d)\s*(?:luna\s*)?([01]?\d)\s*((?:19|20)\s?\d{2})\b/gi
  ];
  for (const rx of patterns) {
    let match;
    while ((match = rx.exec(value))) {
      const date = normalizedDate(match[1],match[2],match[3]);
      if (!date) continue;
      const source = sourceAt(value,match.index,match[0]);
      hits.push({ value:date, index:match.index, source, ocrConfidence:ocrConfidence(source) });
      if (match[0] === '') rx.lastIndex++;
    }
  }
  const unique = new Map();
  for (const hit of hits) {
    if (!unique.has(hit.value)) unique.set(hit.value,hit);
    else {
      const existing = unique.get(hit.value);
      if (!Number.isFinite(existing.ocrConfidence) && Number.isFinite(hit.ocrConfidence)) unique.set(hit.value,hit);
    }
  }
  return [...unique.values()];
}

function explicitExecutionDurations(text){
  const value = String(text || '');
  const hits=[];
  const patterns=[
    /(?:urmând|urmand)\s+ca\s+(?:acesta|aceasta|inculpatul|condamnatul)\s+s(?:ă|a)\s+execute\s+([^.;\n]{0,90})/gi,
    /(?:urmând|urmand)\s+s(?:ă|a)\s+execute\s+([^.;\n]{0,90})/gi
  ];
  for(const rx of patterns){
    let match;
    while((match=rx.exec(value))){
      const parsed=duration(match[1]);
      if(!parsed) continue;
      const source=sourceAt(value,match.index,match[0]);
      hits.push({...parsed,index:match.index,source,ocrConfidence:ocrConfidence(source)});
      if(match[0]==='') rx.lastIndex++;
    }
  }
  const unique=new Map();
  for(const hit of hits){
    const key=`${hit.years}-${hit.months}-${hit.days}`;
    if(!unique.has(key)) unique.set(key,hit);
  }
  return [...unique.values()];
}

function blankDeductionClause(text){
  const value=String(text || '');
  const patterns=[
    /(?:se\s+va\s+deduce|se\s+deduce)[^.;\n]{0,180}?(?:reținerii|retinerii)[^.;\n]{0,120}?de\s+la\s*[-–—_. ]{2,}\s*p(?:â|a)n(?:ă|a)\s+la\s*[-–—_. ]{2,}/i,
    /(?:reținerii|retinerii)[^.;\n]{0,120}?de\s+la\s*(?:[-–—_. ]{2,})?\s*p(?:â|a)n(?:ă|a)\s+la\s*(?:[-–—_. ]{2,})(?=\s|$)/i
  ];
  for(const rx of patterns){
    const match=rx.exec(value);
    if(match) return {index:match.index,raw:match[0],source:sourceAt(value,match.index,match[0])};
  }
  return null;
}

function rowComesFromBlankClause(row){
  const value=fold(row?.source || '');
  return /(?:se va deduce|se deduce)/.test(value) && /retinerii/.test(value) && /de la/.test(value) && /pana la/.test(value) && /(?:---|___|\.\.\.|—|–)/.test(String(row?.source || ''));
}

function applyReceiptStamp(analysis,text){
  const hits=collectReceiptStampHits(text);
  if(!hits.length) return;

  if(hits.length>1){
    analysis.receivedDate='';
    analysis.suggestedReceivedDate='';
    analysis.conflicts={...(analysis.conflicts||{}),receivedDate:true};
    addWarning(analysis,`CONFLICT: ștampila de intrare conține mai multe date de primire (${hits.map(x=>x.value).join(', ')}). Câmpul a fost lăsat necompletat.`);
    return;
  }

  const hit=hits[0];
  if(analysis.receivedDate && analysis.receivedDate!==hit.value){
    const previous=analysis.receivedDate;
    analysis.receivedDate='';
    analysis.suggestedReceivedDate='';
    analysis.conflicts={...(analysis.conflicts||{}),receivedDate:true};
    addWarning(analysis,`CONFLICT: data primirii extrasă textual (${previous}) diferă de ștampila de intrare (${hit.value}). Câmpul a fost lăsat necompletat.`);
    return;
  }

  if(Number.isFinite(hit.ocrConfidence) && hit.ocrConfidence < OCR_REVIEW_THRESHOLD){
    analysis.receivedDate='';
    analysis.suggestedReceivedDate=hit.value;
    analysis.numericReviewRequired=true;
    addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: data primirii din ștampila de intrare provine din OCR cu încredere ${Math.round(hit.ocrConfidence)}%. Valoarea nu a fost folosită automat.`);
    addEvidence(analysis,'Data primirii — sugerată',hit.value,'scăzut',hit.source);
    return;
  }

  analysis.receivedDate=hit.value;
  addEvidence(analysis,'Data primirii în penitenciar',hit.value,'ridicat',hit.source);
}

function applyFinalExecutionFormula(analysis,text){
  const hits=explicitExecutionDurations(text);
  if(!hits.length) return;
  if(hits.length>1){
    analysis.finalSentence={years:0,months:0,days:0};
    analysis.numericReviewRequired=true;
    addWarning(analysis,`CONFLICT: formula explicită „urmează să execute” indică mai multe cuantumuri (${hits.map(durationLabel).join(' / ')}). Completează manual pedeapsa aplicabilă.`);
    return;
  }
  const hit=hits[0];
  const current=analysis.finalSentence;
  const currentHasValue=Boolean(current && (current.years || current.months || current.days));
  if(currentHasValue && !sameDuration(current,hit)){
    analysis.finalSentence={years:0,months:0,days:0};
    analysis.numericReviewRequired=true;
    addWarning(analysis,`CONFLICT: pedeapsa finală identificată anterior (${durationLabel(current)}) diferă de formula explicită „urmează să execute” (${durationLabel(hit)}). Completează manual.`);
    return;
  }
  if(Number.isFinite(hit.ocrConfidence) && hit.ocrConfidence < OCR_REVIEW_THRESHOLD){
    analysis.suggestedFinalSentence={years:hit.years,months:hit.months,days:hit.days};
    analysis.finalSentence={years:0,months:0,days:0};
    analysis.numericReviewRequired=true;
    addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: pedeapsa finală din formula „urmează să execute” provine din OCR cu încredere ${Math.round(hit.ocrConfidence)}%. Valoarea nu a fost folosită automat.`);
    return;
  }
  analysis.finalSentence={years:hit.years,months:hit.months,days:hit.days};
  addEvidence(analysis,'Pedeapsă finală explicită',durationLabel(hit),'ridicat',hit.source);
}

function applyBlankDeductionGuard(analysis,text){
  const blank=blankDeductionClause(text);
  if(!blank) return;
  analysis.blankDeductionClause=true;
  analysis.deductions=(analysis.deductions||[]).filter(row=>!rowComesFromBlankClause(row));
  addWarning(analysis,'DEDUCERI: rubrica „de la … până la …” este necompletată în document. Nu a fost introdusă automat nicio perioadă din această rubrică.');
  addEvidence(analysis,'Rubrică deduceri','Necompletată','ridicat',blank.source);
}

function install(){
  if(!root.AIDocumentSafety || root.AIDocumentSafety.__betaLot4Hardening) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText);
    if(analysis.multiplePrimaryDocuments) return analysis;
    const text=analysis.text || String(rawText || '');
    applyFinalExecutionFormula(analysis,text);
    applyReceiptStamp(analysis,text);
    applyBlankDeductionGuard(analysis,text);
    return analysis;
  };
  root.AIDocumentSafety.__betaLot4Hardening=true;
}

install();
root.AIBetaLot4Hardening={collectReceiptStampHits,explicitExecutionDurations,blankDeductionClause,applyReceiptStamp,applyFinalExecutionFormula,applyBlankDeductionGuard};
})(typeof window!=='undefined'?window:globalThis);
