(function(root){
'use strict';

const NUMERIC_OCR_REVIEW_THRESHOLD = 80;
function uniq(values){ return [...new Set(values.filter(Boolean))]; }
function fold(value){ return root.AIDocumentCore.fold(value); }
function parseDate(value){ return root.AIDocumentCore.parseDateToken(value); }
function duration(value){ return root.AIDocumentCore.durationFromString(value); }
function pageContext(text,index){ return root.AIDocumentCore.pageContextAt?.(text,index) || {label:'',ocrConfidence:null}; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore.sourceSnippet?.(text,index,fragment) || String(fragment||''); }

function collectDateHits(text, patterns){
  const hits=[];
  for (const rx of patterns) {
    const flags=rx.flags.includes('g')?rx.flags:`${rx.flags}g`;
    const copy=new RegExp(rx.source,flags);
    let match;
    while ((match=copy.exec(text))) {
      const parsed=parseDate(match[1]);
      if (parsed) {
        const ctx=pageContext(text,match.index);
        hits.push({value:parsed.iso,index:match.index,source:sourceAt(text,match.index,match[0]),ocrConfidence:ctx.ocrConfidence});
      }
      if (match[0]==='') copy.lastIndex++;
    }
  }
  const unique=new Map();
  for (const hit of hits) if (!unique.has(hit.value)) unique.set(hit.value,hit);
  return [...unique.values()];
}

function collectFinalDurations(text){
  const patterns=[
    /pedeaps(?:a|ei)\s+rezultant(?:ă|a|e)\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /va\s+executa(?:\s+în\s+final)?\s+pedeapsa\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /executarea\s+pedepsei(?:\s+rezultante)?\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /pedeapsa\s+final(?:ă|a)\s+(?:de\s+)?([^\n.;]{0,100})/gi
  ];
  const found=[];
  for (const rx of patterns) {
    let match;
    while ((match=rx.exec(text))) {
      const parsed=duration(match[1]);
      if (parsed) {
        const ctx=pageContext(text,match.index);
        found.push({...parsed,index:match.index,source:sourceAt(text,match.index,match[0]),ocrConfidence:ctx.ocrConfidence});
      }
    }
  }
  const map=new Map();
  for (const item of found) map.set(`${item.years}-${item.months}-${item.days}`,item);
  return [...map.values()];
}

function articleCandidates(text){
  const value=fold(text);
  const rules=[
    ['NCP99',/\bart\.?\s*99\b/],['NCP100',/\bart\.?\s*100\b/],['NCP124',/\bart\.?\s*124\b/],['NCP125',/\bart\.?\s*125\b/],
    ['VCP591',/\bart\.?\s*59\s*(?:1|\^1|¹)\b/],['VCP602',/\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*2\s*\)?/],
    ['VCP603',/\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*3\s*\)?/],['VCP59',/\bart\.?\s*59\b(?!\s*(?:1|\^1|¹))/]
  ];
  return rules.filter(([,rx])=>rx.test(value)).map(([name])=>name);
}

function detectDocumentTypes(text){
  const value=fold(text),types=[];
  if (/mandat(?:ul)?\s+de\s+executare|\bmepi\b/.test(value)) types.push('MEPI/mandat');
  if (/sentinta\s+penala/.test(value)) types.push('Sentință penală');
  if (/decizi(?:a|ei)\s+penala/.test(value)) types.push('Decizie penală');
  if (/incheiere\s+penala/.test(value)) types.push('Încheiere penală');
  return types;
}

function addWarning(analysis,message){ if (!analysis.warnings.includes(message)) analysis.warnings.push(message); }
function addEvidence(analysis,label,value,confidence,source){
  if (!value||analysis.evidence.some(item=>item.label===label&&item.value===value)) return;
  const item={label,value,confidence,source};
  const ocrConfidence=root.AIDocumentCore.ocrConfidenceFromSource?.(source);
  if (Number.isFinite(ocrConfidence)) item.ocrConfidence=ocrConfidence;
  analysis.evidence.push(item);
}
function lowOcr(value){ return Number.isFinite(value) && value < NUMERIC_OCR_REVIEW_THRESHOLD; }
function numericWarning(label,confidence){ return `NECESITĂ VERIFICARE NUMERICĂ: ${label} provine dintr-o pagină OCR cu încredere ${Math.round(confidence)}%. Valoarea nu a fost folosită automat.`; }

function protectPrimaryNumericFields(analysis){
  const meta=analysis.extractionMeta||{};
  if (analysis.birthDate&&lowOcr(meta.birth?.ocrConfidence)) {
    analysis.suggestedBirthDate=analysis.birthDate; analysis.birthDate='';
    addWarning(analysis,numericWarning('data nașterii',meta.birth.ocrConfidence));
  }
  if (analysis.startDate&&lowOcr(meta.start?.ocrConfidence)) {
    analysis.suggestedStartDate=analysis.startDate; analysis.startDate='';
    addWarning(analysis,numericWarning('data începerii executării',meta.start.ocrConfidence));
  }
  if ((analysis.finalSentence?.years||analysis.finalSentence?.months||analysis.finalSentence?.days)&&lowOcr(meta.finalSentence?.ocrConfidence)) {
    analysis.suggestedFinalSentence={...analysis.finalSentence};
    analysis.finalSentence={years:0,months:0,days:0};
    addWarning(analysis,numericWarning('pedeapsa rezultantă',meta.finalSentence.ocrConfidence));
  }
  if (analysis.article&&lowOcr(meta.article?.ocrConfidence)) {
    analysis.suggestedArticle=analysis.article; analysis.article='';
    addWarning(analysis,numericWarning('articolul/configurația IMSweb',meta.article.ocrConfidence));
  }
}

function protectRows(analysis){
  let riskyPenalties=0,riskyDeductions=0;
  for (const item of analysis.penalties||[]) {
    if (!lowOcr(item.ocrConfidence)) continue;
    item.reviewRequired=true;
    item.suggestedGroup=item.group;
    item.group='ignore';
    item.confidence='scăzut';
    riskyPenalties++;
  }
  for (const item of analysis.deductions||[]) {
    if (!lowOcr(item.ocrConfidence)) continue;
    item.reviewRequired=true;
    item.confidence='scăzut';
    riskyDeductions++;
  }
  if (riskyPenalties) addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: ${riskyPenalties} pedeapsă/pedepse componente provin din OCR sub ${NUMERIC_OCR_REVIEW_THRESHOLD}%. Sunt setate implicit pe „Ignoră” până la verificare.`);
  if (riskyDeductions) addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: ${riskyDeductions} perioadă/perioade deduse provin din OCR sub ${NUMERIC_OCR_REVIEW_THRESHOLD}%. Confirmă explicit fiecare rând înainte de calcul.`);
}

function stripEmptyOcrMetadata(analysis){
  for (const collection of [analysis.penalties,analysis.deductions,analysis.finalSentenceCandidates,analysis.evidence]) {
    for (const item of collection||[]) if (!Number.isFinite(item.ocrConfidence)) delete item.ocrConfidence;
  }
}

function analyze(rawText){
  const analysis=root.AIDocumentCore.analyzeDocument(rawText);
  const text=analysis.text||String(rawText||'');

  const birthHits=collectDateHits(text,[/(?:data\s+nașterii|data\s+nasterii|născut(?:ă|a)?\s+la\s+data\s+de|nascut(?:a)?\s+la\s+data\s+de)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i]);
  const startHits=collectDateHits(text,[/(?:data\s+începerii\s+executării|data\s+inceperii\s+executarii|începutul\s+executării|inceputul\s+executarii)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i,/(?:încarcerat|incarcerat|arestat)\s+(?:la\s+data\s+de\s+)?([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i]);
  const receivedHits=collectDateHits(text,[/(?:primit(?:ă|a)?\s+(?:în|in)\s+penitenciar|data\s+primirii\s+(?:în|in)\s+penitenciar|depus(?:ă|a)?\s+(?:în|in)\s+penitenciar)\s*[:,-]?\s*(?:la\s+data\s+de\s+)?([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i]);

  if (birthHits.length>1) { analysis.birthDate=''; addWarning(analysis,`CONFLICT: au fost identificate mai multe date de naștere (${birthHits.map(x=>x.value).join(', ')}). Câmpul a fost lăsat necompletat.`); }
  if (startHits.length>1) { analysis.startDate=''; addWarning(analysis,`CONFLICT: au fost identificate mai multe date de începere a executării (${startHits.map(x=>x.value).join(', ')}). Câmpul a fost lăsat necompletat.`); }
  analysis.receivedDate=receivedHits.length===1?receivedHits[0].value:'';
  if (receivedHits.length>1) addWarning(analysis,`CONFLICT: au fost identificate mai multe date de primire în penitenciar (${receivedHits.map(x=>x.value).join(', ')}). Câmpul a fost lăsat necompletat.`);
  if (analysis.receivedDate) {
    addEvidence(analysis,'Data primirii în penitenciar',analysis.receivedDate,'ridicat',receivedHits[0].source);
    if (lowOcr(receivedHits[0].ocrConfidence)) {
      analysis.suggestedReceivedDate=analysis.receivedDate; analysis.receivedDate='';
      addWarning(analysis,numericWarning('data primirii în penitenciar',receivedHits[0].ocrConfidence));
    }
  }

  const finalDurations=collectFinalDurations(text);
  analysis.finalSentenceCandidates=finalDurations;
  if (finalDurations.length>1) {
    analysis.finalSentence={years:0,months:0,days:0};
    addWarning(analysis,`CONFLICT: apar mai multe pedepse prezentate ca rezultante/finale (${finalDurations.map(item=>`${item.years}a ${item.months}l ${item.days}z`).join(' / ')}). Completează manual pedeapsa aplicabilă.`);
  }

  const articles=uniq(articleCandidates(text));
  analysis.articleCandidates=articles;
  if (articles.length>1) { analysis.article=''; addWarning(analysis,`CONFLICT: documentul conține mai multe articole/configurații LC (${articles.join(', ')}). Selectează manual regula aplicabilă.`); }

  analysis.documentTypes=detectDocumentTypes(text);
  if (analysis.documentTypes.length) addEvidence(analysis,'Tip document',analysis.documentTypes.join(' + '),'mediu','Clasificare textuală automată.');

  protectPrimaryNumericFields(analysis);
  protectRows(analysis);

  if (analysis.life&&analysis.article&&!['NCP99','VCP551'].includes(analysis.article)) addWarning(analysis,'Detențiunea pe viață a fost identificată împreună cu o configurație incompatibilă. Verifică articolul.');
  if (!analysis.life&&['NCP99','VCP551'].includes(analysis.article)) addWarning(analysis,'Configurația de detențiune pe viață a fost identificată fără mențiune clară de detențiune pe viață.');

  analysis.conflicts={birthDate:birthHits.length>1,startDate:startHits.length>1,receivedDate:receivedHits.length>1,finalSentence:finalDurations.length>1,article:articles.length>1};
  analysis.numericReviewRequired=(analysis.penalties||[]).some(x=>x.reviewRequired)||(analysis.deductions||[]).some(x=>x.reviewRequired)||analysis.warnings.some(w=>w.includes('NECESITĂ VERIFICARE NUMERICĂ'));
  stripEmptyOcrMetadata(analysis);
  return analysis;
}

root.AIDocumentSafety={analyze,articleCandidates,detectDocumentTypes,NUMERIC_OCR_REVIEW_THRESHOLD};
})(typeof window !== 'undefined' ? window : globalThis);
