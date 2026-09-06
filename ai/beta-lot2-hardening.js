(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
const PAGE_HEADER=/^\[([^\]\n]+?)\s+—\s+(pagina\s+\d+|imagine)\s+—\s+([^\]]+)\]\s*$/gmi;

function clean(v){ return String(v||'').replace(/\u00ad/g,'').replace(/\r/g,'').replace(/[ \t]{2,}/g,' ').trim(); }
function fold(v){ return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function duration(v){ return root.AIDocumentCore?.durationFromString?.(v) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || clean(fragment); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function addWarning(a,msg){ if(msg && !(a.warnings||[]).includes(msg)){ a.warnings=a.warnings||[]; a.warnings.push(msg); } }
function addEvidence(a,label,value,confidence,source){
  a.evidence=a.evidence||[];
  if(!value || a.evidence.some(x=>x.label===label&&x.value===value)) return;
  const item={label,value,confidence,source};
  const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  a.evidence.push(item);
}
function durationLabel(d){ return `${d?.years||0} ani, ${d?.months||0} luni, ${d?.days||0} zile`; }
function sameDuration(a,b){ return !!a&&!!b&&Number(a.years||0)===Number(b.years||0)&&Number(a.months||0)===Number(b.months||0)&&Number(a.days||0)===Number(b.days||0); }

function splitPages(text){
  const value=String(text||''),matches=[];
  const rx=new RegExp(PAGE_HEADER.source,PAGE_HEADER.flags);
  let m; while((m=rx.exec(value))) matches.push({index:m.index,end:rx.lastIndex,file:clean(m[1]),page:clean(m[2]),mode:clean(m[3]),header:m[0]});
  if(!matches.length) return [];
  return matches.map((item,i)=>{
    const end=i+1<matches.length?matches[i+1].index:value.length;
    const raw=value.slice(item.index,end).trim();
    const body=value.slice(item.end,end).trim();
    const pageNum=Number((item.page.match(/\d+/)||[])[0]||0);
    return {...item,pageNum,raw,body};
  });
}

function pageKind(body){
  const f=fold(body);
  if(/mandat\s+de\s+executare[\s\S]{0,90}?pedeps/.test(f) || /mandat\s+de\s+executare\s+a\s+pedepsei\s+inchisorii/.test(f)) return 'mepi';
  if(/fisa\s+urmaritului/.test(f)) return 'aux';
  if(/proces\s*[-–—]?\s*verbal[\s\S]{0,100}?predare[\s\/-]*primire/.test(f)) return 'aux';
  if(/administratia\s+nationala\s+a\s+penitenciarelor/.test(f) && /(garant|repatri|monitorizare|spatiu\s+minim)/.test(f)) return 'aux';
  return 'continuation';
}

function segmentPrimaryDocuments(text){
  const pages=splitPages(text);
  if(!pages.length) return {pages:[],primaryDocuments:[],auxiliaryPages:[]};
  const primary=[],aux=[],current={pages:[]};
  function close(){
    if(!current.pages.length) return;
    primary.push({pages:[...current.pages],text:current.pages.map(p=>p.raw).join('\n\n'),firstPage:current.pages[0].pageNum,lastPage:current.pages[current.pages.length-1].pageNum,file:current.pages[0].file});
    current.pages.length=0;
  }
  for(const page of pages){
    const kind=pageKind(page.body);
    page.kind=kind;
    if(kind==='mepi'){
      close();
      current.pages.push(page);
    } else if(kind==='aux'){
      close();
      aux.push(page);
    } else if(current.pages.length){
      current.pages.push(page);
    }
  }
  close();
  return {pages,primaryDocuments:primary,auxiliaryPages:aux};
}

function blankCriticalFields(analysis){
  analysis.birthDate='';
  analysis.startDate='';
  analysis.receivedDate='';
  analysis.article='';
  analysis.finalSentence={years:0,months:0,days:0};
  analysis.penalties=[];
  analysis.deductions=[];
  analysis.numericReviewRequired=true;
  analysis.multiplePrimaryDocuments=true;
  analysis.conflicts={...(analysis.conflicts||{}),finalSentence:true,startDate:true,receivedDate:true};
}

function row(text,index,start,end,type,raw,reason){
  const prefix=type==='retention24h'?'Reținere 24 h — ':type==='preventive'?'Arest preventiv — ':'Perioadă dedusă — ';
  const source=`${prefix}${sourceAt(text,index,raw)}${reason?` · ${reason}`:''}`;
  const value={start,end,type,confidence:'mediu',source,reviewRequired:true};
  const c=ocrConfidence(source); if(Number.isFinite(c)) value.ocrConfidence=c;
  return value;
}
function uniqueRows(rows){
  const map=new Map();
  for(const r of rows||[]){ if(!r?.start) continue; const key=`${r.start}|${r.end}|${r.type||'generic'}`; if(!map.has(key)) map.set(key,r); }
  return [...map.values()];
}

function extractRetentionSingles(text){
  const out=[];
  const explicitDay=new RegExp(`(?:durata\\s+reținerii[^.;\\n]{0,90}?)?(?:din\\s+data\\s+de\\s+)?(${DATE_SRC})\\s*(?:[—–-]|:)\\s*1\\s+zi\\b`,'gi');
  let m; while((m=explicitDay.exec(text))){ const a=parseDate(m[1]); if(a) out.push(row(text,m.index,a.iso,a.iso,'retention24h',m[0],'menționată explicit ca 1 zi')); }
  const twentyFour=new RegExp(`durata\\s+reținerii\\s+de\\s+24\\s+de\\s+ore[^.;\\n]{0,100}?data\\s+de\\s+(${DATE_SRC})`,'gi');
  while((m=twentyFour.exec(text))){ const a=parseDate(m[1]); if(a) out.push(row(text,m.index,a.iso,a.iso,'retention24h',m[0],'reținere de 24 de ore = 1 zi')); }
  return out;
}

function extractPreventiveIntervals(text){
  const out=[];
  const rx=new RegExp(`(?:durata\\s+)?arestării\\s+preventive[^.;\\n]{0,90}?(?:de\\s+la|din\\s+data\\s+de)\\s*(${DATE_SRC})\\s+(?:până\\s+la|pana\\s+la)\\s*(?:data\\s+de\\s+)?(${DATE_SRC})`,'gi');
  let m; while((m=rx.exec(text))){ const a=parseDate(m[1]),b=parseDate(m[2]); if(a&&b) out.push(row(text,m.index,a.iso,b.iso,'preventive',m[0],'interval inclusiv')); }
  return out;
}

function extractContinuousToDate(text,documentDate){
  const out=[];
  const rx=new RegExp(`((?:reținerii|arestării\\s+preventive|arestului\\s+la\\s+domiciliu|perioada\\s+(?:deja\\s+)?executată)[^.;\\n]{0,260}?(?:începând\\s+cu\\s+data\\s+de|de\\s+la)\\s*(${DATE_SRC})\\s+la\\s+zi(?:\\s*[—–-]\\s*(${DATE_SRC}))?)`,'gi');
  let m; while((m=rx.exec(text))){
    const a=parseDate(m[2]); if(!a) continue;
    const explicit=m[3]?parseDate(m[3]):null;
    const end=documentDate || explicit?.iso || '';
    if(!end) continue;
    const f=fold(m[1]);
    const onlyPreventive=/arestarii\s+preventive/.test(f) && !/retinerii|arestului\s+la\s+domiciliu|perioada\s+(?:deja\s+)?executata/.test(f);
    const mismatch=explicit&&documentDate&&explicit.iso!==documentDate;
    out.push(row(text,m.index,a.iso,end,onlyPreventive?'preventive':'generic',m[1],mismatch?`„la zi” ancorat la data mandatului ${documentDate}; data OCR ${explicit.iso} nu a fost folosită`:`„la zi” ancorat la data mandatului ${end}`));
  }
  return out;
}

function applyDeductionHardening(analysis,text){
  const extra=uniqueRows([
    ...extractRetentionSingles(text),
    ...extractPreventiveIntervals(text),
    ...extractContinuousToDate(text,analysis.documentDate||'')
  ]);
  if(extra.length){
    const trusted=(analysis.deductions||[]).filter(x=>x?.type && !extra.some(e=>e.start===x.start&&e.end===x.end));
    analysis.deductions=uniqueRows([...trusted,...extra]);
    analysis.numericReviewRequired=true;
    if(!analysis.warnings?.some(w=>String(w).startsWith('DEDUCERI:'))) addWarning(analysis,'DEDUCERI: perioadele interpretate automat trebuie confirmate înainte de calcul.');
  }
  if(analysis.documentDate){
    for(const item of analysis.deductions||[]){
      if(!/la\s+zi/i.test(item.source||'')) continue;
      if(item.end!==analysis.documentDate){
        item.end=analysis.documentDate;
        item.reviewRequired=true;
        item.confidence='mediu';
        analysis.numericReviewRequired=true;
      }
    }
  }
}

function parseDurationList(value){
  const f=fold(value),out=[];
  const rx=/(\d{1,2})\s*(?:ani|an)(?:\s*(?:si\s*)?(\d{1,2})\s*(?:luni|luna))?|(\d{1,2})\s*(?:luni|luna)/g;
  let m; while((m=rx.exec(f))){ if(m[1]) out.push({years:Number(m[1]),months:Number(m[2]||0),days:0}); else out.push({years:0,months:Number(m[3]),days:0}); }
  return out;
}
function calcContest(penalties){
  if(!root.ContopiriCore||penalties.length<2) return null;
  try{
    const items=penalties.map(p=>({...p,totalDays:root.ContopiriCore.toDays(p.years,p.months,p.days)}));
    return root.ContopiriCore.calculate({concurs:items,recidiva:[],revocare:[],litb:[]}).finalDuration;
  }catch(_){ return null; }
}
function verifiedContest(durations,finalSentence,source){
  const penalties=(durations||[]).filter(d=>(d.years||d.months||d.days)).map(d=>({...d,group:'concurs',confidence:'ridicat',source}));
  const calc=calcContest(penalties);
  return calc&&sameDuration(calc,finalSentence)?penalties:null;
}

function extractInlineContest(text,finalSentence){
  const rx=/contope(?:ște|ste)[^.;\n]{0,180}?pedepsele[^.;\n]{0,520}?((?:\d{1,2}\s*(?:ani|an|luni|luna)[^.;\n]{0,80}?){2,})\s+(?:în|in)\s+pedeapsa\s+cea\s+mai\s+grea/gi;
  let m; while((m=rx.exec(text))){
    const ds=parseDurationList(m[1]);
    const source=sourceAt(text,m.index,m[0]);
    const verified=verifiedContest(ds,finalSentence,source); if(verified) return verified;
  }
  return null;
}

function extractSimpleTwoContest(text,finalSentence){
  const rx=/contope(?:ște|ste)\s+pedeapsa[^.;\n]{0,90}?de\s+([^,.;\n]{0,50})\s+[^.;\n]{0,100}?cu\s+pedeapsa\s+de\s+([^,.;\n]{0,50})[^.;\n]{0,180}?(?:aplicând|aplicand)\s+pedeapsa\s+cea\s+mai\s+grea/gi;
  let m; while((m=rx.exec(text))){
    const a=duration(m[1]),b=duration(m[2]); if(!a||!b) continue;
    const source=sourceAt(text,m.index,m[0]);
    const verified=verifiedContest([a,b],finalSentence,source); if(verified) return verified;
  }
  return null;
}

function extractBulletContest(text,finalSentence){
  const formula=/contope(?:ște|ste)\s+cele\s+(?:două|doua|trei|patru|cinci|\d+)\s+pedepse[^.;\n]{0,260}?pedeapsa\s+cea\s+mai\s+grea/gi;
  let m; while((m=formula.exec(text))){
    const before=text.slice(Math.max(0,m.index-2600),m.index);
    const ds=[];
    const bullet=/[-•]\s*(\d{1,2})(?:\s*\([^)]*\))?\s*(ani|an|luni|lună|luna)\s+închisoare/gi;
    let b; while((b=bullet.exec(before))){ ds.push(/lun/i.test(b[2])?{years:0,months:Number(b[1]),days:0}:{years:Number(b[1]),months:0,days:0}); }
    if(ds.length<2) continue;
    const source=sourceAt(text,m.index,`${before.slice(-900)} ${m[0]}`);
    const verified=verifiedContest(ds.slice(-8),finalSentence,source); if(verified) return verified;
  }
  return null;
}

function applyContestHardening(analysis,text){
  const final=analysis.finalSentence;
  if(!final || !(final.years||final.months||final.days)) return;
  const penalties=extractInlineContest(text,final)||extractSimpleTwoContest(text,final)||extractBulletContest(text,final);
  if(penalties){
    analysis.penalties=penalties;
    addEvidence(analysis,'Contopire verificată',`${penalties.map(durationLabel).join(' + ')} → ${durationLabel(final)}`,'ridicat',penalties[0].source);
  }
}

function applyPlausibilityGuards(analysis,text){
  const suspicious=[];
  const rx=/pedeaps(?:a|ă|ei)[^.;\n]{0,45}?(?:de\s+|:\s*)(\d{2,3})\s*(?:ani|an)\b/gi;
  let m; while((m=rx.exec(text))){ const y=Number(m[1]); if(y>30) suspicious.push({years:y,index:m.index,source:sourceAt(text,m.index,m[0])}); }
  if(suspicious.length){
    addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: OCR-ul a produs ${suspicious.length} cuantum(uri) de peste 30 de ani. Aceste valori nu sunt folosite automat.`);
    analysis.numericReviewRequired=true;
    for(const item of analysis.penalties||[]){ if(Number(item.years||0)>30){ item.reviewRequired=true; item.suggestedGroup=item.group; item.group='ignore'; item.confidence='scăzut'; } }
    if(Number(analysis.finalSentence?.years||0)>30){ analysis.suggestedFinalSentence={...analysis.finalSentence}; analysis.finalSentence={years:0,months:0,days:0}; }
  }
}

function harden(rawText){
  const base=root.AIDocumentSafety?.__lot2BaseAnalyze || root.AIDocumentSafety?.analyze;
  if(typeof base!=='function') throw new Error('Motorul AI de bază nu este disponibil.');
  const segmentation=segmentPrimaryDocuments(rawText);
  if(segmentation.primaryDocuments.length>1){
    const analysis=base(rawText);
    blankCriticalFields(analysis);
    analysis.documentSegments=segmentation.primaryDocuments.map(d=>({file:d.file,firstPage:d.firstPage,lastPage:d.lastPage}));
    addWarning(analysis,`DOCUMENTE MULTIPLE: au fost detectate ${segmentation.primaryDocuments.length} mandate independente. Datele nu au fost combinate; analizează separat mandatul dorit.`);
    return analysis;
  }

  const scoped=segmentation.primaryDocuments.length===1?segmentation.primaryDocuments[0].text:String(rawText||'');
  const analysis=base(scoped);
  if(segmentation.primaryDocuments.length===1 && segmentation.auxiliaryPages.length){
    analysis.ignoredAuxiliaryPages=segmentation.auxiliaryPages.map(p=>({file:p.file,page:p.pageNum}));
    addWarning(analysis,`PAGINI AUXILIARE: ${segmentation.auxiliaryPages.length} pagină(i) au fost excluse din extragerea juridică principală.`);
  }
  applyDeductionHardening(analysis,scoped);
  applyContestHardening(analysis,scoped);
  applyPlausibilityGuards(analysis,scoped);
  return analysis;
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__betaLot2Hardening) return;
  root.AIDocumentSafety.__lot2BaseAnalyze=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=harden;
  root.AIDocumentSafety.__betaLot2Hardening=true;
}
install();

root.AIBetaLot2Hardening={segmentPrimaryDocuments,extractRetentionSingles,extractPreventiveIntervals,extractContinuousToDate,extractInlineContest,extractSimpleTwoContest,extractBulletContest,harden};
})(typeof window!=='undefined'?window:globalThis);
