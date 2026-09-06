(function(root){
'use strict';

const DATE_RX = /\b([0-3]?\d)[.\/-]([01]?\d)[.\/-]((?:19|20)\d{2})\b/g;
const DURATION_RX = /(?:(\d{1,2})\s*(?:ani|an))?(?:\s*(?:,|și|si)?\s*(\d{1,2})\s*(?:luni|lună|luna))?(?:\s*(?:,|și|si)?\s*(\d{1,3})\s*(?:zile|zi))?/gi;

function cleanText(value){
  return String(value || '')
    .replace(/\u00ad/g, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fold(value){
  return cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function parseDateToken(token){
  const m = String(token || '').match(/^([0-3]?\d)[.\/-]([01]?\d)[.\/-]((?:19|20)\d{2})$/);
  if (!m) return null;
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { d, m: mo, y, iso: `${String(d).padStart(2,'0')}.${String(mo).padStart(2,'0')}.${y}` };
}

function durationFromString(value){
  const text = fold(value);
  let years = 0, months = 0, days = 0, found = false;
  const y = text.match(/(\d{1,2})\s*(?:ani|an)\b/); if (y) { years = Number(y[1]); found = true; }
  const m = text.match(/(\d{1,2})\s*(?:luni|luna)\b/); if (m) { months = Number(m[1]); found = true; }
  const d = text.match(/(\d{1,3})\s*(?:zile|zi)\b/); if (d) { days = Number(d[1]); found = true; }
  return found ? { years, months, days } : null;
}

function snippet(text, index, radius = 150){
  const start = Math.max(0, index - radius), end = Math.min(text.length, index + radius);
  return cleanText(text.slice(start, end)).replace(/\n/g, ' ');
}

function evidence(label, value, confidence, source){
  return { label, value, confidence, source: source || '' };
}

function firstPattern(text, patterns){
  for (const rx of patterns) {
    rx.lastIndex = 0;
    const m = rx.exec(text);
    if (m) return { match:m, index:m.index };
  }
  return null;
}

function findNamedDate(text, patterns){
  const hit = firstPattern(text, patterns);
  if (!hit) return null;
  const token = hit.match[1];
  const parsed = parseDateToken(token);
  if (!parsed) return null;
  return { value: parsed.iso, index: hit.index, source: snippet(text, hit.index), confidence: 'ridicat' };
}

function extractFinalSentence(text){
  const patterns = [
    /pedeaps(?:a|ei)\s+rezultant(?:ă|a|e)\s+(?:de\s+)?([^\n.;]{0,80})/gi,
    /va\s+executa(?:\s+în\s+final)?\s+pedeapsa\s+(?:de\s+)?([^\n.;]{0,80})/gi,
    /executarea\s+pedepsei(?:\s+rezultante)?\s+(?:de\s+)?([^\n.;]{0,80})/gi,
    /pedeapsa\s+final(?:ă|a)\s+(?:de\s+)?([^\n.;]{0,80})/gi
  ];
  for (const rx of patterns) {
    const hit = firstPattern(text, [rx]);
    if (!hit) continue;
    const dur = durationFromString(hit.match[1]);
    if (dur) return { ...dur, confidence:'ridicat', source:snippet(text, hit.index), index:hit.index };
  }
  return null;
}

function extractDurationMentions(text){
  const original = cleanText(text);
  const globalFold = fold(original);
  const hits = [];
  const patterns = [
    { rx: /(condamn(?:ă|a|at|ată|ata)[^.;\n]{0,100}?pedeaps(?:a|ă|ei)\s+(?:de\s+)?)([^.;\n]{0,80})/gi, defaultGroup:'concurs' },
    { rx: /(stabile(?:ște|ste)[^.;\n]{0,80}?pedeaps(?:a|ă|ei)\s+(?:de\s+)?)([^.;\n]{0,80})/gi, defaultGroup:'concurs' },
    { rx: /((?:revoc(?:ă|a|area)|rest(?:ul)?\s+rămas|rest(?:ul)?\s+ramas)[^.;\n]{0,100}?)(\d{1,2}\s*(?:ani|an|luni|lună|luna|zile|zi)[^.;\n]{0,60})/gi, defaultGroup:'revocare' },
    { rx: /((?:art\.?\s*129[^.;\n]{0,70}?lit\.?\s*b)[^.;\n]{0,80}?)(\d{1,2}\s*(?:ani|an|luni|lună|luna|zile|zi)[^.;\n]{0,60})/gi, defaultGroup:'litb' }
  ];
  for (const spec of patterns) {
    let m;
    while ((m = spec.rx.exec(original))) {
      const dur = durationFromString(m[2]);
      if (!dur) continue;
      const source = cleanText(m[0]).replace(/\n/g,' ');
      const fctx = fold(source);
      if (/rezultant|va\s+executa|pedeapsa\s+final/.test(fctx)) continue;
      let group = spec.defaultGroup;
      if (/recidiv/.test(fctx)) group = 'recidiva';
      else if (/revoc|rest(?:ul)?\s+ramas/.test(fctx)) group = 'revocare';
      else if (/art\.?\s*129/.test(fctx)) group = 'litb';
      else if (!/concurs|contop|art\.?\s*39/.test(globalFold) && group === 'concurs') group = 'ignore';
      hits.push({ ...dur, group, confidence: group === 'ignore' ? 'scăzut' : 'mediu', source, index:m.index });
    }
  }
  hits.sort((a,b)=>a.index-b.index);
  const unique=[];
  for(const hit of hits){
    if(unique.some(x=>Math.abs(x.index-hit.index)<8 && x.years===hit.years && x.months===hit.months && x.days===hit.days)) continue;
    unique.push(hit);
  }
  return unique.slice(0,20);
}

function extractDeductions(text){
  const original = cleanText(text);
  const folded = fold(original);
  const hits = [];
  let pos = 0;
  while ((pos = folded.indexOf('deduc', pos)) !== -1) {
    const start = Math.max(0, pos - 80), end = Math.min(original.length, pos + 320);
    const chunk = original.slice(start, end);
    const dates = [...chunk.matchAll(DATE_RX)].map(m => ({ token:m[0], index:m.index }));
    if (dates.length >= 2) {
      const a = parseDateToken(dates[0].token), b = parseDateToken(dates[1].token);
      if (a && b) hits.push({ start:a.iso, end:b.iso, confidence:'ridicat', source:cleanText(chunk).replace(/\n/g,' ') });
    }
    pos += 5;
  }
  const unique = [];
  for (const h of hits) if (!unique.some(x => x.start===h.start && x.end===h.end)) unique.push(h);
  return unique.slice(0, 12);
}

function inferArticle(text){
  const f = fold(text);
  const rules = [
    ['NCP99', /\bart\.?\s*99\b/],
    ['NCP100', /\bart\.?\s*100\b/],
    ['NCP124', /\bart\.?\s*124\b/],
    ['NCP125', /\bart\.?\s*125\b/],
    ['VCP591', /\bart\.?\s*59\s*(?:1|\^1|¹)\b/],
    ['VCP602', /\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*2\s*\)?/],
    ['VCP603', /\bart\.?\s*60\s*(?:alin\.?\s*)?\(?\s*3\s*\)?/],
    ['VCP59', /\bart\.?\s*59\b/]
  ];
  for (const [value, rx] of rules) if (rx.test(f)) return { value, confidence:'mediu' };
  return { value:'', confidence:'scăzut' };
}

function extractIdentifiers(text){
  const mandate = firstPattern(text, [/mandat(?:ul)?(?:\s+de\s+executare)?[^\n]{0,60}?nr\.?\s*([A-Z0-9./-]+)/i]);
  const sentence = firstPattern(text, [/sentin(?:ța|ta)\s+penal(?:ă|a)[^\n]{0,50}?nr\.?\s*([A-Z0-9./-]+)/i]);
  const decision = firstPattern(text, [/decizi(?:a|ei)\s+penal(?:ă|a)[^\n]{0,50}?nr\.?\s*([A-Z0-9./-]+)/i]);
  return {
    mandate: mandate ? mandate.match[1].replace(/[.,;:]+$/,'') : '',
    sentence: sentence ? sentence.match[1].replace(/[.,;:]+$/,'') : '',
    decision: decision ? decision.match[1].replace(/[.,;:]+$/,'') : ''
  };
}

function analyzeDocument(rawText){
  const text = cleanText(rawText);
  const folded = fold(text);
  const birth = findNamedDate(text, [
    /(?:data\s+nașterii|data\s+nasterii|născut(?:ă|a)?\s+la\s+data\s+de|nascut(?:a)?\s+la\s+data\s+de)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ]);
  const start = findNamedDate(text, [
    /(?:data\s+începerii\s+executării|data\s+inceperii\s+executarii|începutul\s+executării|inceputul\s+executarii)\s*[:,-]?\s*([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i,
    /(?:încarcerat|incarcerat|arestat)\s+(?:la\s+data\s+de\s+)?([0-3]?\d[.\/-][01]?\d[.\/-](?:19|20)\d{2})/i
  ]);
  const finalSentence = extractFinalSentence(text);
  const penalties = extractDurationMentions(text);
  const deductions = extractDeductions(text);
  const article = inferArticle(text);
  const life = /deten(?:ț|t)iune\s+pe\s+via(?:ț|t)ă/.test(folded);
  const identifiers = extractIdentifiers(text);
  const evidences = [];
  if (birth) evidences.push(evidence('Data nașterii', birth.value, birth.confidence, birth.source));
  if (start) evidences.push(evidence('Data începerii executării', start.value, start.confidence, start.source));
  if (finalSentence) evidences.push(evidence('Pedeapsă rezultantă', `${finalSentence.years} ani, ${finalSentence.months} luni, ${finalSentence.days} zile`, finalSentence.confidence, finalSentence.source));
  if (article.value) evidences.push(evidence('Articol LC', article.value, article.confidence, 'Identificat explicit în text; verificarea juridică rămâne obligatorie.'));
  const warnings = [];
  if (!text) warnings.push('Nu există text de analizat.');
  if (!finalSentence && !life) warnings.push('Pedeapsa rezultantă nu a fost identificată cu suficientă certitudine. Completeaz-o manual.');
  if (!start) warnings.push('Data începerii executării nu a fost identificată. Completeaz-o manual.');
  if (!birth) warnings.push('Data nașterii nu a fost identificată; fracția LC nu poate fi calculată sigur fără ea.');
  if (!article.value) warnings.push('Articolul/configurația LC nu a fost identificată. Selectează-l manual din matricea IMSweb.');
  if (penalties.length > 1 && !/concurs|contop|art\.?\s*39/.test(folded)) warnings.push('Au fost găsite mai multe cuantumuri de pedeapsă, dar nu a fost identificată clar o contopire. Verifică manual categoriile.');
  return {
    text,
    life,
    birthDate: birth?.value || '',
    startDate: start?.value || '',
    article: article.value,
    finalSentence: finalSentence ? { years:finalSentence.years, months:finalSentence.months, days:finalSentence.days } : { years:0, months:0, days:0 },
    penalties,
    deductions,
    identifiers,
    evidence:evidences,
    warnings
  };
}

root.AIDocumentCore = { cleanText, fold, parseDateToken, durationFromString, analyzeDocument };
})(typeof window !== 'undefined' ? window : globalThis);
