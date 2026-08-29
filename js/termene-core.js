(function (root) {
'use strict';
function cloneDate(d){ return new Date(d.getTime()); }
function dateOnly(input){ const d = new Date(input); if (isNaN(d)) throw new Error('Dată invalidă.'); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(date,n){ const d=cloneDate(date); d.setDate(d.getDate()+n); return d; }
function addMonths(date,n){ const d=cloneDate(date), day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); return d; }
function addYears(date,n){ const d=cloneDate(date), day=d.getDate(), month=d.getMonth(); d.setDate(1); d.setFullYear(d.getFullYear()+n); d.setMonth(month); d.setDate(Math.min(day,new Date(d.getFullYear(),month+1,0).getDate())); return d; }
function key(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function orthodoxEasterSunday(year){ const a=year%4,b=year%7,c=year%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7; const month=Math.floor((d+e+114)/31),day=((d+e+114)%31)+1; const j=new Date(year,month-1,day); const offset=Math.floor(year/100)-Math.floor(year/400)-2; j.setDate(j.getDate()+offset); return j; }
function getRomanianPublicHolidays(year){ const fixed=[[1,1],[1,2],[1,6],[1,7],[1,24],[5,1],[6,1],[8,15],[11,30],[12,1],[12,25],[12,26]]; const out=new Set(fixed.map(([m,d])=>key(new Date(year,m-1,d)))); const easter=orthodoxEasterSunday(year); [-2,0,1,49,50].forEach(delta=>out.add(key(addDays(easter,delta)))); return out; }
function isWeekend(date){ const day=date.getDay(); return day===0||day===6; }
function isHoliday(date){ return getRomanianPublicHolidays(date.getFullYear()).has(key(date)); }
function isNonWorkingDay(date){ return isWeekend(date)||isHoliday(date); }
function nextWorkingDay(date){ let d=cloneDate(date); while(isNonWorkingDay(d)) d=addDays(d,1); return d; }
function calculateDeadline({start,duration,unit,termType='general'}){
  if(!['hours','days','months','years'].includes(unit)) throw new Error('Unitate invalidă.');
  if(!Number.isSafeInteger(duration)||duration<=0) throw new Error('Durata trebuie să fie un număr întreg pozitiv.');
  const preventive=termType==='preventive';
  if(unit==='hours'){
    const d=new Date(start); if(isNaN(d)) throw new Error('Data/ora de început invalidă.');
    const raw=new Date(d); raw.setHours(raw.getHours()+(preventive?duration-1:duration+1));
    return {rawDeadline:raw,deadline:raw,effectiveDeadline:raw,rule:preventive?'art. 271':'art. 269',workingDayAdjustment:false};
  }
  const d=dateOnly(start); let raw;
  if(unit==='days') raw=addDays(d,preventive?duration-1:duration+1);
  else if(unit==='months') raw=preventive?addDays(addMonths(d,duration),-1):addMonths(d,duration);
  else raw=preventive?addDays(addYears(d,duration),-1):addYears(d,duration);
  let deadline=raw, adjusted=false;
  if(!preventive && isNonWorkingDay(raw)){ deadline=nextWorkingDay(raw); adjusted=true; }
  return {rawDeadline:raw,deadline,effectiveDeadline:deadline,rule:preventive?'art. 271':'art. 269',workingDayAdjustment:adjusted};
}
root.TermeneCore={addDays,addMonths,addYears,orthodoxEasterSunday,getRomanianPublicHolidays,isHoliday,isNonWorkingDay,nextWorkingDay,calculateDeadline};
})(typeof window!=='undefined'?window:globalThis);
