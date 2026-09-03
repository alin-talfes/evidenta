(()=>{
  const set=officialSets.find(item=>item.id==="anp2024");
  if(set)set.legalNote=String(set.legalNote||"").replace(/pragul legal actual este 65 de ani/i,"pragul legal actual pentru această fracție este 60 de ani");

  /* mobile-nav.js contains a legacy compatibility autoloader for the full written
     simulation. This marker tells it that the feature is managed by fast-loader. */
  if(!document.querySelector('script[data-full-written-exam]')){
    const marker=document.createElement("script");
    marker.type="application/json";
    marker.dataset.fullWrittenExam="lazy";
    document.head.appendChild(marker);
  }

  /* Performance overrides can start downloading while the parser continues. The JS
     executes on the next task, after app.js has defined the functions it optimizes. */
  if(!document.querySelector('link[href="runtime-performance.css"]')){
    const perfStyle=document.createElement("link");perfStyle.rel="stylesheet";perfStyle.href="runtime-performance.css";document.head.appendChild(perfStyle);
  }
  setTimeout(()=>{
    if(document.querySelector('script[src="runtime-performance.js"]'))return;
    const perfScript=document.createElement("script");perfScript.src="runtime-performance.js";document.body.appendChild(perfScript);
  },0);

  /* Fast boot: suppress only large hidden lists that have a safe lazy re-render path. */
  const deferredIds=new Set([
    "bibliography-list","legislation-content","official-sets","official-written",
    "interview-summary","interview-profile","interview-list","interview-workspace","interview-simulation-panel",
    "mistakes-list","synthesis-list"
  ]);
  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
  let fastBoot=true;
  if(descriptor?.set&&descriptor?.get){
    try{
      Object.defineProperty(Element.prototype,"innerHTML",{
        configurable:descriptor.configurable,
        enumerable:descriptor.enumerable,
        get:descriptor.get,
        set(value){
          if(fastBoot&&this?.id&&deferredIds.has(this.id)){
            this.dataset.fastBootDeferred="true";
            return;
          }
          return descriptor.set.call(this,value);
        }
      });
      setTimeout(()=>{
        fastBoot=false;
        try{Object.defineProperty(Element.prototype,"innerHTML",descriptor)}catch{}
        window.TRAINING_FAST_BOOT_DONE=true;
        document.dispatchEvent(new CustomEvent("training:fast-boot-ready"));
      },0);
    }catch{fastBoot=false}
  }

  /* OMJ 2188 is the largest optional corpus. Park its nine fetches until needed. */
  const nativeFetch=window.fetch.bind(window);
  let omjUnlocked=false;
  const pending=[];
  const isOmjPart=input=>{
    const value=typeof input==="string"?input:(input?.url||"");
    return /(?:^|\/)omj2188-data\/part-[^/?]+\.txt(?:[?#]|$)/i.test(value);
  };
  window.fetch=function(input,init){
    if(!omjUnlocked&&isOmjPart(input))return new Promise((resolve,reject)=>pending.push(()=>nativeFetch(input,init).then(resolve,reject)));
    return nativeFetch(input,init);
  };
  window.TRAINING_UNLOCK_OMJ=()=>{
    if(omjUnlocked)return;
    omjUnlocked=true;
    pending.splice(0).forEach(run=>run());
    document.dispatchEvent(new CustomEvent("training:omj-unlocked"));
  };
  window.TRAINING_OMJ_IS_UNLOCKED=()=>omjUnlocked;
})();
