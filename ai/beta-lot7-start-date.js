(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
const MONTHS={ianuarie:1,februarie:2,martie:3,aprilie:4,mai:5,iunie:6,iulie:7,august:8,septembrie:9,octombrie:10,noiembrie:11,decembrie:12};

function fold(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function addWarning(a,msg){ a.warnings=a.warnings||[]; if(msg&&!a.warnings.includes(msg)) a.warnings.push(msg); }
function addEvidence(a,label,value,confidence,source){
  a.evidence=a.evidence||[];
  if(!value||a.evidence.some(x=>x.label===label&&x.value===value)) return;
  const item={label,value,confidence,source}; const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  a.evidence.push(item);
}
function numericDate(day,month,year){
  const d=Number(day),m=Number(month),y=Number(year),dt=new Date(y,m-1,d);
  if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d) return '';
  return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
}

function mandateDate(text){
  const value=String(text||'');
  const numeric=[
    /mandat\s+de\s+executare\s+a\s+pedepsei\s+(?:închisorii|inchisorii)[\s\S]{0,160}?\bdin\s+(${DATE_SRC})/i,
    /mandat\s+de\s+executare\s+a\s+pedepsei\s+(?:închisorii|inchisorii)[\s\S]{0,160}?\bemis(?:\s+azi|\s+la\s+data\s+de|\s+în\s+ziua|\s+in\s+ziua)?\s*(${DATE_SRC})/i
  ];
  for(const rx0 of numeric){ const rx=new RegExp(rx0.source.replace('${DATE_SRC}',DATE_SRC),rx0.flags); const m=rx.exec(value); if(m){ const p=parseDate(m[1]); if(p) return {value:p.iso,index:m.index,source:sourceAt(value,m.index,m[0])}; } }
  const written=/mandat\s+de\s+executare\s+a\s+pedepsei\s+(?:închisorii|inchisorii)[\s\S]{0,180}?(?:emis\s+)?(?:în|in)\s+ziua\s+([0-3]?\d)\s+(?:luna\s+)?(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(?:anul\s+)?((?:19|20)\d{2})/i;
  const m=written.exec(value); if(!m) return null;
  const v=numericDate(m[1],MONTHS[fold(m[2])],m[3]);
  return v?{value:v,index:m.index,source:sourceAt(value,m.index,m[0])}:null;
}

function openEndedDeductionStart(text){
  const value=String(text||'');

  // În formulele mixte pot exista mai multe date înainte de „la zi”.
  // Data relevantă este ultima dată explicită din dispoziția de deducere înainte de „la zi”.
  // Punctele din date (ZZ.LL.AAAA) nu sunt tratate ca terminatoare de propoziție.
  const segmentRx=/(?:se\s+)?(?:deduce|deducând|deducand|scade|scăzând|scazand)[^;\n]{0,900}?\bla\s+zi\b/gi;
  let segment;
  while((segment=segmentRx.exec(value))){
    const dateRx=new RegExp(DATE_SRC,'g');
    const dates=[...segment[0].matchAll(dateRx)];
    if(!dates.length) continue;
    const last=dates[dates.length-1];
    const before=segment[0].slice(Math.max(0,(last.index||0)-70),last.index||0);
    if(!/(?:de\s+la|din\s+data\s+de|începând\s+cu|incepand\s+cu|de\s+la\s+data\s+de)\s*$/i.test(before)) {
      const after=segment[0].slice((last.index||0)+last[0].length);
      if(!/^\s*(?:până\s+)?la\s+zi\b/i.test(after)) continue;
    }
    const parsed=parseDate(last[0]);
    if(parsed) return {value:parsed.iso,index:segment.index+(last.index||0),source:sourceAt(value,segment.index,segment[0])};
  }

  const patterns=[
    new RegExp(`(?:se\\s+)?(?:deduce|deducând|deducand|scade|scăzând|scazand)[^;\\n]{0,520}?(?:de\\s+la|din\\s+data\\s+de|începând\\s+cu|incepand\\s+cu)\\s*(${DATE_SRC})\\s+(?:până\\s+)?la\\s+zi\\b`,'i'),
    new RegExp(`(?:se\\s+)?(?:deduce|deducând|deducand|scade|scăzând|scazand)[^;\\n]{0,520}?(${DATE_SRC})[^;\\n]{0,120}?\\bla\\s+zi\\b`,'i')
  ];
  for(const rx of patterns){ const m=rx.exec(value); if(!m) continue; const p=parseDate(m[1]); if(p) return {value:p.iso,index:m.index,source:sourceAt(value,m.index,m[0])}; }
  return null;
}

function applyStartDateRule(analysis,text){
  if(analysis.multiplePrimaryDocuments) return;
  const primary=analysis.primaryDocumentType||'';
  if(primary!=='MEPI/mandat'&&!/mandat\s+de\s+executare\s+a\s+pedepsei/i.test(fold(text))) return;
  const open=openEndedDeductionStart(text);
  const mandate=mandateDate(text);
  const chosen=open||mandate;
  if(!chosen) return;
  analysis.startDate=chosen.value;
  analysis.startDateBasis=open?'deduction_to_date':'mandate_date';
  analysis.extractionMeta={...(analysis.extractionMeta||{}),start:{source:chosen.source,ocrConfidence:ocrConfidence(chosen.source),basis:analysis.startDateBasis}};
  addEvidence(analysis,'Data începerii executării',chosen.value,'ridicat',chosen.source);
  analysis.warnings=(analysis.warnings||[]).filter(w=>!String(w).startsWith('Data începerii executării nu a fost identificată'));
  if(open) addWarning(analysis,'DATA ÎNCEPERII: preluată din formula de deducere „de la/din data de … la zi”; aceasta prevalează asupra datei mandatului.');
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot7StartDate) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText),text=analysis.text||String(rawText||'');
    applyStartDateRule(analysis,text);
    return analysis;
  };
  root.AIDocumentSafety.__betaLot7StartDate=true;
}

install();
root.AIBetaLot7StartDate={mandateDate,openEndedDeductionStart,applyStartDateRule};
})(typeof window!=='undefined'?window:globalThis);
