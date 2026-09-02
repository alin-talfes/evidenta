(()=>{
  if(window.TRAINING_PERF)return;
  const events=[],MAX=120,pending=new Map();
  const push=entry=>{events.push({...entry,ts:Date.now()});if(events.length>MAX)events.splice(0,events.length-MAX)};
  const markStart=(id,label=id)=>{pending.set(id,{label,start:performance.now()})};
  const markEnd=(id,extra={})=>{const item=pending.get(id);if(!item)return null;pending.delete(id);const duration=Math.round((performance.now()-item.start)*10)/10;const row={type:"measure",id,label:item.label,duration,...extra};push(row);return row};
  document.addEventListener("pointerdown",event=>{const target=event.target.closest?.(".nav-item,[data-go]");const id=target?.dataset?.view||target?.dataset?.go;if(id)markStart(`view:${id}`,`tap → ${id}`)},{capture:true,passive:true});
  document.addEventListener("training:view-ready",event=>{const id=event.detail?.id;if(id)markEnd(`view:${id}`,{view:id})});
  document.addEventListener("training:data-measure",event=>push({type:"data",...event.detail}));
  try{
    if("PerformanceObserver" in window){const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.duration>=50)push({type:"longtask",duration:Math.round(entry.duration*10)/10,name:entry.name})}});observer.observe({entryTypes:["longtask"]})}
  }catch{}
  window.TRAINING_PERF={events,markStart,markEnd,summary(){const measures=events.filter(x=>x.type==="measure");const byView={};for(const row of measures){const key=row.view||row.label;(byView[key]??=[]).push(row.duration)}return Object.fromEntries(Object.entries(byView).map(([key,values])=>[key,{count:values.length,avg:Math.round(values.reduce((a,b)=>a+b,0)/values.length),max:Math.max(...values)}]))},version:"perf-v1"};
})();
