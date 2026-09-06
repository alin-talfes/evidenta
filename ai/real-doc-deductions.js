(function(root){
'use strict';

const DATE_SRC='[0-3]?\\d[.\\/-][01]?\\d[.\\/-](?:19|20)\\d{2}';
const OCR_REVIEW_THRESHOLD=80;

function parseDate(v){ return root.AIDocumentCore?.parseDateToken?.(String(v||'').trim()) || null; }
function sourceAt(text,index,fragment){ return root.AIDocumentCore?.sourceSnippet?.(text,index,fragment) || String(fragment||'').trim(); }
function ocrConfidence(source){ return root.AIDocumentCore?.ocrConfidenceFromSource?.(source); }
function dayNumber(v){ const p=parseDate(v); return p?Math.floor(Date.UTC(p.y,p.m-1,p.d)/86400000):null; }
function fold(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function addWarning(analysis,message){ analysis.warnings=analysis.warnings||[]; if(message&&!analysis.warnings.includes(message)) analysis.warnings.push(message); }
function addEvidence(analysis,label,value,confidence,source){
  analysis.evidence=analysis.evidence||[];
  analysis.evidence=analysis.evidence.filter(item=>item.label!==label);
  if(!value) return;
  const item={label,value,confidence,source};
  const c=ocrConfidence(source); if(Number.isFinite(c)) item.ocrConfidence=c;
  analysis.evidence.push(item);
}

function sentenceTail(text,start,max=520){
  const value=String(text||'').slice(start,start+max);
  for(let i=0;i<value.length;i++){
    if(value[i]!=='.') continue;
    const before=value[i-1]||'',after=value[i+1]||'';
    if(/\d/.test(before)&&/\d/.test(after)) continue;
    let j=i+1; while(j<value.length&&/[ \t]/.test(value[j])) j++;
    if(j>=value.length||value[j]==='\n'||/[A-ZĂÂÎȘȚ]/.test(value[j])) return value.slice(0,i+1);
  }
  return value;
}

function intervalItems(segment){
  const out=[];
  const rx=new RegExp(`(${DATE_SRC})\\s*(?:[—–-]|(?:la|până\\s+la|pana\\s+la))\\s*(?:data\\s+de\\s+)?(${DATE_SRC}|zi\\b)|(${DATE_SRC})`,'gi');
  let m; while((m=rx.exec(segment))){
    if(m[1]) out.push({start:m[1],end:m[2].toLowerCase()==='zi'?'la zi':m[2],raw:m[0],index:m.index});
    else out.push({start:m[3],end:'',raw:m[0],index:m.index});
  }
  return out;
}

function row(text,index,start,end,type,raw,reason){
  const prefix=type==='retention24h'?'Reținere 24 h — ':type==='preventive'?'Arest preventiv — ':'Perioadă dedusă — ';
  const source=`${prefix}${sourceAt(text,index,raw)}${reason?` · ${reason}`:''}`;
  const value={start,end,type,confidence:'mediu',source,reviewRequired:true};
  const c=ocrConfidence(source); if(Number.isFinite(c)) value.ocrConfidence=c;
  return value;
}
function unique(rows){
  const map=new Map();
  for(const r of rows){ const key=`${r.start}|${r.end}|${r.type}`; if(!map.has(key)) map.set(key,r); }
  return [...map.values()];
}

function extractMixedRetainedArrested(text,documentDate){
  const out=[];
  const rx=/(?:a\s+fost\s+)?reținut(?:ă|a)?\s+(?:și|si)\s+arestat(?:ă|a)?\s+preventiv(?:ă|a)?/gi;
  let m; while((m=rx.exec(text))){
    const sentence=sentenceTail(text,m.index,520);
    const items=intervalItems(sentence).filter(x=>x.end);
    items.forEach((item,i)=>{
      const a=parseDate(item.start); if(!a) return;
      if(i===0&&item.end!=='la zi'){
        const b=parseDate(item.end); if(!b) return;
        const span=dayNumber(b.iso)-dayNumber(a.iso);
        if(span<=1){
          out.push(row(text,m.index+item.index,a.iso,a.iso,'retention24h',item.raw,'prima perioadă din formula „reținut și arestat preventiv”; 1 zi'));
          return;
        }
      }
      if(item.end==='la zi') out.push(row(text,m.index+item.index,a.iso,documentDate||'','preventive',item.raw,documentDate?`„la zi” propus până la data mandatului ${documentDate}`:'completează sfârșitul pentru „la zi”'));
      else { const b=parseDate(item.end); if(b) out.push(row(text,m.index+item.index,a.iso,b.iso,'preventive',item.raw,'tip dedus din formularea mixtă; confirmă')); }
    });
  }
  return out;
}

function extractRespectivList(text,documentDate){
  const out=[];
  const rx=/durata\s+reținerii\s*,\s*arestării\s+preventive[\s\S]{0,320}?respectiv\s+/gi;
  let m; while((m=rx.exec(text))){
    const list=sentenceTail(text,m.index+m[0].length,300);
    const items=intervalItems(list);
    items.forEach((item,i)=>{
      const a=parseDate(item.start); if(!a) return;
      if(!item.end){
        out.push(row(text,m.index+m[0].length+item.index,a.iso,a.iso,i===0?'retention24h':'generic',item.raw,i===0?'prima dată singulară din lista „reținerii, arestării preventive...” = 1 zi':'dată singulară; confirmă'));
      } else if(item.end==='la zi') {
        out.push(row(text,m.index+m[0].length+item.index,a.iso,documentDate||'','generic',item.raw,documentDate?`„la zi” propus până la data mandatului ${documentDate}`:'completează sfârșitul pentru „la zi”'));
      } else {
        const b=parseDate(item.end); if(b) out.push(row(text,m.index+m[0].length+item.index,a.iso,b.iso,'generic',item.raw,'lista combină măsuri/perioadă executată; capete incluse'));
      }
    });
  }
  return out;
}

function normalizeStampDate(day,month,year){
  const y=String(year||'').replace(/\s+/g,'');
  const d=Number(day),m=Number(month),yy=Number(y);
  if(y.length!==4||!Number.isInteger(d)||!Number.isInteger(m)||!Number.isInteger(yy)) return '';
  const dt=new Date(yy,m-1,d);
  if(dt.getFullYear()!==yy||dt.getMonth()!==m-1||dt.getDate()!==d) return '';
  return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
}

function extractReceivedStamp(text){
  const hits=[];
  const rx=/\bintrare(?:a)?\s*(?:nr\.?\s*[^\n]{0,28})?[\s\S]{0,90}?\bziua\s*[:.]?\s*([0-3]?\d)\s*(?:luna\s*[:.]?\s*)?([01]?\d)\s*((?:19|20)\s*\d{2})/gi;
  let m; while((m=rx.exec(text))){
    const value=normalizeStampDate(m[1],m[2],m[3]);
    if(!value) continue;
    const source=sourceAt(text,m.index,m[0]);
    hits.push({value,source,ocrConfidence:ocrConfidence(source)});
  }
  const map=new Map(); for(const hit of hits) if(!map.has(hit.value)) map.set(hit.value,hit);
  return [...map.values()];
}

function applyReceivedStamp(analysis,text){
  const hits=extractReceivedStamp(text);
  if(!hits.length) return;
  if(hits.length>1){
    analysis.receivedDate='';
    addWarning(analysis,`CONFLICT: ștampila de intrare conține mai multe date (${hits.map(x=>x.value).join(', ')}). Data primirii a fost lăsată necompletată.`);
    analysis.conflicts={...(analysis.conflicts||{}),receivedDate:true};
    return;
  }
  const hit=hits[0];
  if(analysis.receivedDate&&analysis.receivedDate!==hit.value){
    const previous=analysis.receivedDate;
    analysis.receivedDate='';
    addWarning(analysis,`CONFLICT: data primirii extrasă textual (${previous}) diferă de ștampila de intrare (${hit.value}). Verifică documentul.`);
    analysis.conflicts={...(analysis.conflicts||{}),receivedDate:true};
    return;
  }
  if(Number.isFinite(hit.ocrConfidence)&&hit.ocrConfidence<OCR_REVIEW_THRESHOLD){
    analysis.suggestedReceivedDate=hit.value;
    analysis.receivedDate='';
    addEvidence(analysis,'Data primirii în penitenciar',hit.value,'scăzut',hit.source);
    addWarning(analysis,`NECESITĂ VERIFICARE NUMERICĂ: data primirii din ștampila de intrare provine din OCR cu încredere ${Math.round(hit.ocrConfidence)}%. Valoarea nu a fost folosită automat.`);
    analysis.numericReviewRequired=true;
    return;
  }
  analysis.receivedDate=hit.value;
  addEvidence(analysis,'Data primirii în penitenciar',hit.value,'ridicat',hit.source);
}

function detectPrimaryDocumentType(text){
  const value=fold(text);
  if(/mandat\s+de\s+executare\s+a\s+pedepsei\s+inchisorii/.test(value)) return 'MEPI/mandat';
  if(/\bsentinta\s+penala\b/.test(value)) return 'Sentință penală';
  if(/\bdecizie\s+penala\b/.test(value)) return 'Decizie penală';
  if(/\bincheiere\s+penala\b/.test(value)) return 'Încheiere penală';
  return '';
}

function applyPrimaryDocumentType(analysis,text){
  const primary=detectPrimaryDocumentType(text);
  if(!primary) return;
  analysis.primaryDocumentType=primary;
  analysis.referencedDocumentTypes=(analysis.documentTypes||[]).filter(type=>type!==primary);
  analysis.documentTypes=[primary];
  addEvidence(analysis,'Tip document',primary,'ridicat','Clasificare după titlul principal al documentului.');
}

function install(){
  if(!root.AIDocumentSafety||root.AIDocumentSafety.__realDocDeductionHardening) return;
  const base=root.AIDocumentSafety.analyze;
  root.AIDocumentSafety.analyze=function(rawText){
    const analysis=base(rawText),text=analysis.text||String(rawText||'');
    applyReceivedStamp(analysis,text);
    applyPrimaryDocumentType(analysis,text);
    const extra=unique([...extractMixedRetainedArrested(text,analysis.documentDate||''),...extractRespectivList(text,analysis.documentDate||'')]);
    if(extra.length){
      const preserved=(analysis.deductions||[]).filter(existing=>!extra.some(x=>x.start===existing.start&&x.end===existing.end));
      analysis.deductions=unique([...preserved,...extra]);
      if(!(analysis.warnings||[]).some(w=>String(w).startsWith('DEDUCERI:'))) analysis.warnings.push('DEDUCERI: formulele mixte și perioadele „la zi” necesită confirmarea rândurilor marcate.');
      analysis.numericReviewRequired=true;
    }
    return analysis;
  };
  root.AIDocumentSafety.__realDocDeductionHardening=true;
}
install();
root.AIRealDocumentDeductions={extractMixedRetainedArrested,extractRespectivList,intervalItems,sentenceTail,extractReceivedStamp,detectPrimaryDocumentType};
})(typeof window!=='undefined'?window:globalThis);
