(function(root){
'use strict';
const DAYS_PER_MONTH=30, MONTHS_PER_YEAR=12, DAYS_PER_YEAR=DAYS_PER_MONTH*MONTHS_PER_YEAR;
function toDays(years,months,days){ for(const v of [years,months,days]) if(!Number.isSafeInteger(v)||v<0) throw new Error('Duratele trebuie să fie numere întregi pozitive sau zero.'); return years*DAYS_PER_YEAR+months*DAYS_PER_MONTH+days; }
function fromDays(totalDays){ if(!Number.isSafeInteger(totalDays)||totalDays<0) throw new Error('Durată totală invalidă.'); const years=Math.floor(totalDays/DAYS_PER_YEAR), remainder=totalDays%DAYS_PER_YEAR, months=Math.floor(remainder/DAYS_PER_MONTH), days=remainder%DAYS_PER_MONTH; return {years,months,days}; }
function formatDuration({years,months,days}){ const p=[]; if(years) p.push(`${years} ani`); if(months) p.push(`${months} luni`); if(days) p.push(`${days} zile`); return p.join(', ')||'0 zile'; }
function calculate(groups){
 const concurs=groups.concurs||[], recidiva=groups.recidiva||[], revocare=groups.revocare||[];
 if(!concurs.length&&!recidiva.length&&!revocare.length) throw new Error('Adaugă cel puțin o pedeapsă validă.');
 let concursResultDays=0, bonusDays=0, maxPenalty=null, othersTotalDays=0;
 if(concurs.length){ maxPenalty=concurs.reduce((max,p)=>p.totalDays>max.totalDays?p:max,concurs[0]); const others=concurs.filter(p=>p!==maxPenalty); othersTotalDays=others.reduce((sum,p)=>sum+p.totalDays,0); bonusDays=Math.floor(othersTotalDays/3); concursResultDays=maxPenalty.totalDays+bonusDays; }
 const recidivaTotalDays=recidiva.reduce((s,p)=>s+p.totalDays,0), revocareTotalDays=revocare.reduce((s,p)=>s+p.totalDays,0);
 const finalDays=concursResultDays+recidivaTotalDays+revocareTotalDays;
 return {finalDays,finalDuration:fromDays(finalDays),concursResultDays,bonusDays,maxPenalty,othersTotalDays,recidivaTotalDays,revocareTotalDays};
}
root.ContopiriCore={DAYS_PER_MONTH,DAYS_PER_YEAR,toDays,fromDays,formatDuration,calculate};
})(typeof window!=='undefined'?window:globalThis);
