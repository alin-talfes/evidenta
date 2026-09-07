(function(root){
'use strict';

const EDUCATIONAL = new Set(['NCP124','NCP125']);
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const fmt = d => typeof root.fmtDate === 'function' ? root.fmtDate(d) : '—';

function readInt(id){ const n=Number($(id)?.value||0); return Number.isSafeInteger(n)&&n>=0?n:0; }
function selectedGroups(){
  const groups={concurs:[],recidiva:[],revocare:[],litb:[]};
  document.querySelectorAll('#penaltyRows tr').forEach(row=>{
    const group=row.querySelector('.p-group')?.value;
    if(!groups[group]) return;
    const years=Number(row.querySelector('.p-y')?.value||0), months=Number(row.querySelector('.p-m')?.value||0), days=Number(row.querySelector('.p-d')?.value||0);
    if(![years,months,days].every(Number.isSafeInteger)) return;
    const totalDays=root.ContopiriCore.toDays(years,months,days);
    if(totalDays>0) groups[group].push({years,months,days,totalDays});
  });
  return groups;
}
function groupCount(groups){ return Object.values(groups).reduce((n,a)=>n+a.length,0); }
function deductions(){
  const rows=[];
  document.querySelectorAll('#deductionRows tr').forEach(row=>{
    const a=root.parseDate?.(row.querySelector('.d-start')?.value.trim()||'');
    const b=root.parseDate?.(row.querySelector('.d-end')?.value.trim()||'');
    if(a&&b&&b>=a) rows.push([a,b]);
  });
  return rows;
}
function warningTexts(){
  const values=[...document.querySelectorAll('#resultContent .ai-warning, #warningList .ai-warning')].map(x=>x.textContent.trim()).filter(Boolean);
  return [...new Set(values)];
}
function item(label,value,important=false,note=''){
  return `<div class="result-item${important?' important':''}"><div class="result-label">${esc(label)}</div><div class="result-value">${value}</div>${note?`<div class="result-note">${esc(note)}</div>`:''}</div>`;
}
function section(title,body){ return `<div class="result-section"><h4>${esc(title)}</h4>${body}</div>`; }
function fraction(r){ return typeof root.fracStr==='function'?root.fracStr(r):String(r); }

function renderPedepseStyle(){
  const card=$('resultCard');
  if(!card || card.classList.contains('ai-hidden')) return;
  const startDate=root.parseDate?.($('startDate')?.value.trim()||'');
  if(!startDate) return;
  const life=Boolean($('lifeSentence')?.checked), art=$('article')?.value||'', birthDate=root.parseDate?.($('birthDate')?.value.trim()||''), receivedDate=root.parseDate?.($('receivedDate')?.value.trim()||''), sex=$('sex')?.value||'M';
  const groups=selectedGroups();
  const contopire=groupCount(groups)?root.ContopiriCore.calculate(groups):null;
  const manual={years:readInt('finalYears'),months:readInt('finalMonths'),days:readInt('finalDays')};
  const duration=contopire?contopire.finalDuration:manual;
  let theorExp=null,realExp=null,totalDays=7305,ded=0;
  const dedRows=deductions(); ded=root.sumIntervals?.(dedRows)||0;
  if(!life){
    theorExp=root.addCalendarSafe(startDate,duration.years,duration.months,duration.days); theorExp.setDate(theorExp.getDate()-1);
    totalDays=root.daysBetween(startDate,theorExp)+1;
    realExp=new Date(theorExp); realExp.setDate(realExp.getDate()-ded);
  }
  let schedule=null;
  if(art&&birthDate){
    const sentenceOver10=!life&&(duration.years*12+duration.months+duration.days/30)>120;
    schedule=root.calculateLiberationSchedule({life,art,sentenceOver10,totalDays,birthDate,startDate,currentSex:sex,theorExp,dedDays:ded,nonExecDays:0});
  }
  const elapsedEnd=realExp&&root.today&&root.today()>realExp?realExp:(root.today?.()||new Date());
  const calendarDaysSinceStart=elapsedEnd>=startDate?Math.max(0,root.daysBetween(startDate,elapsedEnd)+1):0;
  const remaining=realExp?Math.max(0,root.daysBetween(root.today?.()||new Date(),realExp)+1):'—';
  let fifth=null,fDate=null,reanalysisLabel=null;
  if(life){
    const base=root.addCalendarSafe(startDate,6,6,0); base.setDate(base.getDate()-1); fDate=new Date(base); fDate.setDate(fDate.getDate()-ded); reanalysisLabel='REANALIZARE 6 ANI ȘI 6 LUNI';
  } else if(!EDUCATIONAL.has(art)) {
    fifth=Math.floor(totalDays/5); fDate=root.thresholdDate(startDate,fifth,ded,0); reanalysisLabel='REANALIZARE 1/5';
  }
  const q=receivedDate&&root.QuarantineRules?.schedule?root.QuarantineRules.schedule(receivedDate):null;
  const warnings=warningTexts();
  let html=warnings.map(w=>`<div class="ai-warning${/CONFLICT ARITMETIC|NECESITĂ VERIFICARE NUMERICĂ/.test(w)?' ai-critical':''}">${esc(w)}</div>`).join('');

  if(life){
    html+=section('DETALII PEDEAPSĂ',`<div class="result-grid">${item('DETENȚIUNE PE VIAȚĂ','Fără dată de expirare.')} ${item('ZILE DEDUSE',`${ded} zile`)} ${item('ZILE CALENDARISTICE DE LA ÎNCEPERE',`${calendarDaysSinceStart} zile`)}</div>`);
  } else {
    html+=section('DETALII MANDAT',`<div class="result-grid">${item('EXPIRARE TEORETICĂ',fmt(theorExp))}${item('EXPIRARE REALĂ',fmt(realExp),true)}${item('ZILE DEDUSE',`${ded} zile`)}${item('ZILE NEEXECUTATE','0 zile')}${item('ZILE CALENDARISTICE DE LA ÎNCEPERE',`${calendarDaysSinceStart} zile`)}${item('REST RĂMAS',`${remaining} zile`)}</div>`);
  }

  if(contopire){
    html+=section('CONTOPIRE PEDEPSE',`<div class="result-grid">${item('PEDEAPSĂ REZULTATĂ',esc(root.ContopiriCore.formatDuration(contopire.finalDuration)),true)}${contopire.bonusDays?item('SPOR CONCURS CALCULAT',`${contopire.bonusDays} zile`):''}${contopire.litbQuarterDays?item('SPOR MINIM ART. 129 ALIN. (2) LIT. B)',`${contopire.litbQuarterDays} zile`):''}</div>`);
  }

  if(schedule&&!schedule.error){
    html+=section('FRACȚII LIBERARE CONDIȚIONATĂ',`<div class="result-grid">${item('FRACȚIE MINIMĂ OBLIGATORIE',`${life?'PRAG':`<span class="fraction">${fraction(schedule.mR)}</span>`} → ${schedule.mDays} zile<br><span class="result-label">DATA</span> ${fmt(schedule.mDate)}`)}${item('DATA ÎMPLINIRII FRACȚIEI TOTALE / PROPOZABILĂ',`${life?'PRAG':`<span class="fraction">${fraction(schedule.tR)}</span>`} → ${schedule.tDays} zile<br><span class="result-label">DATA</span> ${fmt(schedule.tDate)}`)}</div>`);
  }

  if(reanalysisLabel){
    html+=section('REANALIZARE REGIM',`<div class="result-grid">${item(reanalysisLabel,life?'Prag temporal: 6 ani și 6 luni, ajustat cu zilele deduse.':`FĂRĂ DEDUCERI: ${fifth} ZILE<br><span class="result-label">DATA ÎMPLINIRII</span> ${fmt(fDate)}`)}</div>`);
  } else if(EDUCATIONAL.has(art)) {
    html+=section('REANALIZARE REGIM','<p class="help-text">Fracția de 1/5 nu se aplică automat măsurii educative selectate.</p>');
  }

  if(q){
    html+=section('CARANTINĂ',`<div class="result-grid">${item('CARANTINĂ — ZIUA 21',fmt(q.day21),false,'Ultima zi de carantină; ziua primirii este ziua 1.')}${item('REGIM PROVIZORIU — DIN ZIUA 22',fmt(q.day22),true,'Din această zi poate fi stabilit provizoriu regimul.')}</div>`);
  }

  const ids=window.AIDocumentSafety&&$('rawText')?.value?null:null;
  const analysisIds=[...document.querySelectorAll('#evidenceList .ai-evidence-item strong')].map(x=>x.textContent.trim()).filter(x=>/mandat|MEPI|sentin|decizi/i.test(x));
  if(analysisIds.length) html+=section('DATE DOCUMENT',`<div class="result-grid">${item('IDENTIFICATORI',esc(analysisIds.join(' · ')))}</div>`);

  $('resultContent').innerHTML=html;
}

function init(){ $('calculateBtn')?.addEventListener('click',()=>setTimeout(renderPedepseStyle,0)); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
root.AIResultPedepse={render:renderPedepseStyle};
})(typeof window!=='undefined'?window:globalThis);
