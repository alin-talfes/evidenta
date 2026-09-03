(()=>{
  const DAY=86400000;
  const addDays=(date,days)=>new Date(date.getTime()+days*DAY);
  const iso=date=>date.toISOString().slice(0,10);
  function addCalendar(date,years=0,months=0,days=0){
    const totalMonths=(date.getUTCFullYear()+years)*12+date.getUTCMonth()+months;
    const year=Math.floor(totalMonths/12),month=((totalMonths%12)+12)%12;
    const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
    return addDays(new Date(Date.UTC(year,month,Math.min(date.getUTCDate(),lastDay))),days);
  }
  const sentenceEnd=(start,duration)=>addDays(addCalendar(start,duration.years,duration.months,duration.days),-1);
  const inclusiveDays=(from,to)=>Math.floor((to-from)/DAY)+1;
  const overYears=(duration,years)=>duration.years!==years?duration.years>years:duration.months>0||duration.days>0;
  const fractionRule=duration=>overYears(duration,10)?"3/4":"2/3";
  const age60Rule=duration=>overYears(duration,10)?"2/3":"1/2";
  const age60Minimum=duration=>overYears(duration,10)?"1/2":"1/3";
  const regimeFor=duration=>overYears(duration,13)?"maximă siguranță":overYears(duration,3)?"închis":overYears(duration,1)?"semideschis":"deschis";
  const excludedOn=(date,periods=[])=>periods.some(period=>period.type==="interruption"&&iso(date)>period.from&&iso(date)<period.to);
  function dateForExecutedDays(start,targetDays,periods=[]){
    let current=new Date(start.getTime()),executed=0,guard=0;
    while(guard++<25000){
      if(!excludedOn(current,periods))executed++;
      if(executed>=targetDays)return current;
      current=addDays(current,1);
    }
    throw new Error("self-test calendar guard");
  }

  const galatiStart=new Date(Date.UTC(2019,10,2));
  const galatiEnd=sentenceEnd(galatiStart,{years:6,months:7,days:0});
  const total2404=inclusiveDays(galatiStart,galatiEnd);
  const interruption=[{type:"interruption",from:"2024-01-05",to:"2024-01-10"}];
  const cases=[
    ["Galați · expirare calendaristică",iso(galatiEnd)==="2026-06-01"],
    ["Galați · total 2.404 zile",total2404===2404],
    ["Galați · 2/3 se trunchiază la 1.602",Math.floor(total2404*2/3)===1602],
    ["Prag 10 ani exact · fracție 2/3",fractionRule({years:10,months:0,days:0})==="2/3"],
    ["Peste 10 ani · fracție 3/4",fractionRule({years:10,months:1,days:0})==="3/4"],
    ["60+ până la 10 ani · fracție 1/2",age60Rule({years:10,months:0,days:0})==="1/2"],
    ["60+ peste 10 ani · fracție 2/3",age60Rule({years:10,months:1,days:0})==="2/3"],
    ["60+ minim efectiv până la 10 ani · 1/3",age60Minimum({years:10,months:0,days:0})==="1/3"],
    ["60+ minim efectiv peste 10 ani · 1/2",age60Minimum({years:10,months:1,days:0})==="1/2"],
    ["Regim · 1 an exact = deschis",regimeFor({years:1,months:0,days:0})==="deschis"],
    ["Regim · peste 1 an = semideschis",regimeFor({years:1,months:1,days:0})==="semideschis"],
    ["Regim · 3 ani exact = semideschis",regimeFor({years:3,months:0,days:0})==="semideschis"],
    ["Regim · peste 3 ani = închis",regimeFor({years:3,months:1,days:0})==="închis"],
    ["Regim · 13 ani exact = închis",regimeFor({years:13,months:0,days:0})==="închis"],
    ["Regim · peste 13 ani = maximă siguranță",regimeFor({years:13,months:1,days:0})==="maximă siguranță"],
    ["Întrerupere · zilele-limită rămân executate",iso(dateForExecutedDays(new Date(Date.UTC(2024,0,1)),15,interruption))==="2024-01-19"],
    ["Plafon minim efectiv · creditul nu poate coborî sub minim",Math.max(1202,1602-500)===1202]
  ];
  const failed=cases.filter(([,ok])=>!ok).map(([name])=>name);
  window.WRITTEN_EXAM_SELFTEST={ok:failed.length===0,total:cases.length,failed,checkedAt:new Date().toISOString()};
  if(!failed.length){console.info(`[training] written exam calibration: ${cases.length}/${cases.length} checks passed`);return}

  console.error("[training] written exam calibration failed",failed);
  const disableGeneratedCalculations=()=>{
    ["full-exam-start","calc-start","age-calc-start"].forEach(id=>{
      const button=document.getElementById(id);
      if(button){button.disabled=true;button.setAttribute("aria-disabled","true");button.title="Dezactivat: verificarea internă a calculelor a eșuat."}
    });
  };
  disableGeneratedCalculations();
  new MutationObserver(disableGeneratedCalculations).observe(document.body,{childList:true,subtree:true});

  const host=document.getElementById("full-written-exam");
  if(host&&!host.querySelector(".full-exam-calibration-error")){
    const warning=document.createElement("div");
    warning.className="notice warning full-exam-calibration-error";
    warning.innerHTML=`<strong>Simulatorul de calcul a picat verificarea internă.</strong><br><small>${failed.length} verificări au eșuat. Simularea completă și generatoarele de spețe au fost blocate automat; folosește spețele oficiale ANP până la remediere.</small>`;
    host.prepend(warning);
  }
})();
