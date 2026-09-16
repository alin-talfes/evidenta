(function(root){
'use strict';
const DAYS_PER_MONTH=30, MONTHS_PER_YEAR=12, DAYS_PER_YEAR=DAYS_PER_MONTH*MONTHS_PER_YEAR;
function toDays(years,months,days){
 for(const v of [years,months,days]) if(!Number.isSafeInteger(v)||v<0) throw new Error('Duratele trebuie să fie numere întregi pozitive sau zero.');
 const total=years*DAYS_PER_YEAR+months*DAYS_PER_MONTH+days;
 if(!Number.isSafeInteger(total)) throw new Error('Durata totală depășește limita numerică sigură.');
 return total;
}
function fromDays(totalDays){ if(!Number.isSafeInteger(totalDays)||totalDays<0) throw new Error('Durată totală invalidă.'); const years=Math.floor(totalDays/DAYS_PER_YEAR), remainder=totalDays%DAYS_PER_YEAR, months=Math.floor(remainder/DAYS_PER_MONTH), days=remainder%DAYS_PER_MONTH; return {years,months,days}; }
function formatDuration({years,months,days}){ const p=[]; if(years) p.push(`${years} ani`); if(months) p.push(`${months} luni`); if(days) p.push(`${days} zile`); return p.join(', ')||'0 zile'; }
function safeSum(penalties){
 return penalties.reduce((sum,p)=>{
  if(!p||!Number.isSafeInteger(p.totalDays)||p.totalDays<0) throw new Error('Pedeapsă invalidă.');
  const next=sum+p.totalDays;
  if(!Number.isSafeInteger(next)) throw new Error('Durata totală depășește limita numerică sigură.');
  return next;
 },0);
}
function safeAdd(...values){
 return values.reduce((sum,value)=>{
  if(!Number.isSafeInteger(value)||value<0) throw new Error('Durată totală invalidă.');
  const next=sum+value;
  if(!Number.isSafeInteger(next)) throw new Error('Durata totală depășește limita numerică sigură.');
  return next;
 },0);
}
function calculate(groups){
 if(!groups||typeof groups!=='object') throw new Error('Grupele de pedepse sunt invalide.');
 const concurs=groups.concurs||[], recidiva=groups.recidiva||[], revocare=groups.revocare||[], litb=groups.litb||[];
 for(const group of [concurs,recidiva,revocare,litb]) if(!Array.isArray(group)) throw new Error('Grupele de pedepse sunt invalide.');
 if(!concurs.length&&!recidiva.length&&!revocare.length&&!litb.length) throw new Error('Adaugă cel puțin o pedeapsă validă.');
 if(litb.length&&!concurs.length&&!recidiva.length&&!revocare.length) throw new Error('Categoria art. 129 alin. (2) lit. b) reprezintă un spor minim de 1/4 și necesită o pedeapsă de bază introdusă într-o altă categorie.');
 let concursResultDays=0, bonusDays=0, maxPenalty=null, othersTotalDays=0;
 if(concurs.length){
  safeSum(concurs);
  maxPenalty=concurs.reduce((max,p)=>p.totalDays>max.totalDays?p:max,concurs[0]);
  const others=concurs.filter(p=>p!==maxPenalty);
  othersTotalDays=safeSum(others);
  bonusDays=Math.floor(othersTotalDays/3);
  concursResultDays=safeAdd(maxPenalty.totalDays,bonusDays);
 }
 const recidivaTotalDays=safeSum(recidiva), revocareTotalDays=safeSum(revocare);
 const litbTotalDays=safeSum(litb);
 const litbQuarterDays=litbTotalDays?Math.ceil(litbTotalDays/4):0;
 const finalDays=safeAdd(concursResultDays,recidivaTotalDays,revocareTotalDays,litbQuarterDays);
 return {finalDays,finalDuration:fromDays(finalDays),concursResultDays,bonusDays,maxPenalty,othersTotalDays,recidivaTotalDays,revocareTotalDays,litbTotalDays,litbQuarterDays};
}
root.ContopiriCore={DAYS_PER_MONTH,DAYS_PER_YEAR,toDays,fromDays,formatDuration,calculate};
})(typeof window!=='undefined'?window:globalThis);
