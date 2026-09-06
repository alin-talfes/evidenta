(function(root){
'use strict';

function uniq(values){ return [...new Set(values.filter(Boolean))]; }
function fold(value){ return root.AIDocumentCore.fold(value); }
function parseDate(value){ return root.AIDocumentCore.parseDateToken(value); }
function duration(value){ return root.AIDocumentCore.durationFromString(value); }

function collectDateValues(text, patterns){
  const values=[];
  for (const rx of patterns) {
    const flags = rx.flags.includes('g') ? rx.flags : `${rx.flags}g`;
    const copy = new RegExp(rx.source, flags);
    let match;
    while ((match = copy.exec(text))) {
      const parsed = parseDate(match[1]);
      if (parsed) values.push(parsed.iso);
      if (match[0] === '') copy.lastIndex++;
    }
  }
  return uniq(values);
}

function collectFinalDurations(text){
  const patterns = [
    /pedeaps(?:a|ei)\s+rezultant(?:ă|a|e)\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /va\s+executa(?:\s+în\s+final)?\s+pedeapsa\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /executarea\s+pedepsei(?:\s+rezultante)?\s+(?:de\s+)?([^\n.;]{0,100})/gi,
    /pedeapsa\s+final(?:ă|a)\s+(?:de\s+)?([^\n.;]{0,100})/gi
  ];
  const found=[];
  for (const rx of patterns) {
    let match;
    while ((match = rx.exec(text))) {
      const parsed = duration(match[1]);
      if (parsed) found.push(parsed);
    }
  }
  const map = new Map();
  for (const item of found) map.set(`${item.years}-${item.months}-${item.days}`, item);
  return [...map.values()];
}

function articleCandidates(text){
  const value = fold(text);
  const rules = [
    ['NCP99', /\bart\.?\s*99\b/],
    ['NCP100', /\bart\.?\s*100\b/],
    ['NCP124', /\bart\.?\s*124\b/],
    ['NCP125', /\bart\.?\s*125\b/],
    ['VCP591', /\bart\.?\s*59\s*(?:1|\^1|¹)\b/],
    ['VCP602', /\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*2\s*\)?/],
    ['VCP603', /\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*3\s*\)?/],
    ['VCP59', /\bart\.?\s*59\b(?!\s*(?:1|\^1|¹))/]
  ];
  return rules.filter(([, rx]) => rx.test(value)).map(([name]) => name);
}

function detectDocumentTypes(text){
  const value = fold(text), types=[];
  if (/mandat(?:ul)?\s+de\s+executare|\bmepi\b/.test(value)) types.push('MEPI/mandat');
  if (/sentinta\s+penala/.test(value)) types.push('Sentință penală');
  if (/decizi(?:a|ei)\s+penala/.test(value)) types.push('Decizie penală');
  if (/incheiere\s+penala/.test(value)) types.push('Încheiere penală');
  return types;
}

function addWarning(analysis, message){
  if (!analysis.warnings.includes(message)) analysis.warnings.push(message);
}

function addEvidence(analysis, label, value, confidence, source){
  if (!value || analysis.evidence.some(item => item.label === label && item.value === value)) return;
  analysis.evidence.push({ label, value, confidence, source });
}

function analyze(rawText){
  const analysis = root.AIDocumentCore.analyzeDocument(rawText);
  const text = analysis.text || String(rawText || '');

  const birthValues = collectDateValues(text, [
    /(?:data\s+nașterii|data\s+nasterii|născut(?:ă|a)?\s+la\s+data\s+de|nascut(?:a)?\s+la\s+data\s+de)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ]);
  const startValues = collectDateValues(text, [
    /(?:data\s+începerii\s+executării|data\s+inceperii\s+executarii|începutul\s+executării|inceputul\s+executarii)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i,
    /(?:încarcerat|incarcerat|arestat)\s+(?:la\s+data\s+de\s+)?([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ]);
  const receivedValues = collectDateValues(text, [
    /(?:primit(?:ă|a)?\s+(?:în|in)\s+penitenciar|data\s+primirii\s+(?:în|in)\s+penitenciar|depus(?:ă|a)?\s+(?:în|in)\s+penitenciar)\s*[:,-]?\s*(?:la\s+data\s+de\s+)?([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ]);

  if (birthValues.length > 1) {
    analysis.birthDate = '';
    addWarning(analysis, `CONFLICT: au fost identificate mai multe date de naștere (${birthValues.join(', ')}). Câmpul a fost lăsat necompletat.`);
  }
  if (startValues.length > 1) {
    analysis.startDate = '';
    addWarning(analysis, `CONFLICT: au fost identificate mai multe date de începere a executării (${startValues.join(', ')}). Câmpul a fost lăsat necompletat.`);
  }
  analysis.receivedDate = receivedValues.length === 1 ? receivedValues[0] : '';
  if (receivedValues.length > 1) addWarning(analysis, `CONFLICT: au fost identificate mai multe date de primire în penitenciar (${receivedValues.join(', ')}). Câmpul a fost lăsat necompletat.`);
  if (analysis.receivedDate) addEvidence(analysis, 'Data primirii în penitenciar', analysis.receivedDate, 'ridicat', 'Identificată textual; verifică documentul-sursă.');

  const finalDurations = collectFinalDurations(text);
  analysis.finalSentenceCandidates = finalDurations;
  if (finalDurations.length > 1) {
    analysis.finalSentence = { years:0, months:0, days:0 };
    addWarning(analysis, `CONFLICT: apar mai multe pedepse prezentate ca rezultante/finale (${finalDurations.map(item => `${item.years}a ${item.months}l ${item.days}z`).join(' / ')}). Completează manual pedeapsa aplicabilă.`);
  }

  const articles = uniq(articleCandidates(text));
  analysis.articleCandidates = articles;
  if (articles.length > 1) {
    analysis.article = '';
    addWarning(analysis, `CONFLICT: documentul conține mai multe articole/configurații LC (${articles.join(', ')}). Selectează manual regula aplicabilă.`);
  }

  analysis.documentTypes = detectDocumentTypes(text);
  if (analysis.documentTypes.length) addEvidence(analysis, 'Tip document', analysis.documentTypes.join(' + '), 'mediu', 'Clasificare textuală automată.');

  if (analysis.life && analysis.article && !['NCP99','VCP551'].includes(analysis.article)) {
    addWarning(analysis, 'Detențiunea pe viață a fost identificată împreună cu o configurație incompatibilă. Verifică articolul.');
  }
  if (!analysis.life && ['NCP99','VCP551'].includes(analysis.article)) {
    addWarning(analysis, 'Configurația de detențiune pe viață a fost identificată fără mențiune clară de detențiune pe viață.');
  }

  analysis.conflicts = {
    birthDate: birthValues.length > 1,
    startDate: startValues.length > 1,
    receivedDate: receivedValues.length > 1,
    finalSentence: finalDurations.length > 1,
    article: articles.length > 1
  };
  return analysis;
}

root.AIDocumentSafety = { analyze, articleCandidates, detectDocumentTypes };
})(typeof window !== 'undefined' ? window : globalThis);
