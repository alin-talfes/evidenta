(()=>{
  if(window.TRAINING_BOOT)return;
  let bootPromise=null,pendingView=null,replaying=false,preloaded=false,legislationPromise=null;
  const persistenceScript="persistence-layer.js";
  const dataLoaderScript="heavy-data-loader.js?v=2";
  const runtimeScript="generated/runtime-bundle.js?v=3";
  const dataHealthScript="data-health.js?v=2";
  const legislationControllerScript="generated/controllers/legislation.js?v=4";
  const requiredData=["legislation","official","interview"];
  const preloadList=[persistenceScript,dataLoaderScript,runtimeScript,dataHealthScript,legislationControllerScript];
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  const legalParagraphPattern=/^\(\d+(?:(?:\^\d+)|[¹²³⁴⁵⁶⁷⁸⁹⁰]+)?\)/;
  const legalLetterPattern=/^[a-zăâîșț]\)/i;

  function classifyLegalReading(root=document){
    root.querySelectorAll('.legal-article .legal-intro').forEach(paragraph=>{
      paragraph.classList.toggle('legal-alinea',legalParagraphPattern.test(paragraph.textContent.trim()));
    });
    root.querySelectorAll('.legal-article .legal-lines').forEach(list=>{
      const items=[...list.children].filter(item=>item.matches('li'));
      const numbered=items.length>0&&items.every(item=>legalParagraphPattern.test(item.textContent.trim()));
      const lettered=items.length>0&&items.every(item=>legalLetterPattern.test(item.textContent.trim()));
      list.classList.toggle('legal-lines-alinea',numbered);
      list.classList.toggle('legal-lines-lettered',lettered);
    });
  }

  function observeLegalReading(){
    const host=document.getElementById('legislation-content');
    if(!host||host.dataset.legalReadingObserver==='true')return;
    host.dataset.legalReadingObserver='true';
    let queued=false;
    const refresh=()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{queued=false;classifyLegalReading(host)});
    };
    new MutationObserver(refresh).observe(host,{childList:true,subtree:true});
    refresh();
  }

  function visualView(id){
    if(id==='bibliography')id='legislation';
    if(!id||!document.getElementById(id))return;
    pendingView=id;
    $$('.view').forEach(view=>view.classList.toggle('active-view',view.id===id));
    $$('.nav-item').forEach(button=>button.classList.toggle('active',button.dataset.view===id));
    try{history.replaceState(null,'',`#${id}`)}catch{}
    window.scrollTo(0,0);
  }

  function preloadScripts(){
    if(preloaded)return;preloaded=true;
    for(const src of preloadList){
      if(document.querySelector(`link[rel="preload"][href="${src}"]`))continue;
      const link=document.createElement('link');link.rel='preload';link.as='script';link.href=src;document.head.appendChild(link);
    }
  }

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const existing=[...document.scripts].find(script=>script.getAttribute('src')===src);
      if(existing){
        if(existing.dataset.trainingLoaded==='true'||existing.readyState==='complete'){resolve();return}
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error(`Nu pot încărca ${src}`)),{once:true});
        return;
      }
      const script=document.createElement('script');
      script.src=src;script.async=false;
      script.onload=()=>{script.dataset.trainingLoaded='true';resolve()};
      script.onerror=()=>reject(new Error(`Nu pot încărca ${src}`));
      document.body.appendChild(script);
    });
  }

  async function hydrateDataBeforeRuntime(){
    document.documentElement.dataset.dataBooting='true';
    try{
      await loadScript(dataLoaderScript);
      if(typeof window.loadTrainingHeavyData!=='function')throw new Error('Loaderul dataseturilor nu este disponibil.');
      await window.loadTrainingHeavyData(requiredData);
      const missing=requiredData.filter(part=>!window.TRAINING_HEAVY_DATA?.[part]);
      if(missing.length)throw new Error(`Dataseturi indisponibile: ${missing.join(', ')}`);
      document.documentElement.dataset.dataReady='true';
      delete document.documentElement.dataset.dataLoadError;
    }catch(error){
      console.error('Training data preload:',error);
      document.documentElement.dataset.dataLoadError='true';
    }finally{
      delete document.documentElement.dataset.dataBooting;
    }
  }

  function fallbackLegislation(error){
    const host=document.getElementById('legislation-content');
    if(!host)return;
    const items=typeof laws!=='undefined'&&Array.isArray(laws)?laws:[];
    const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    host.innerHTML=`<div class="notice warning"><strong>Legislația nu s-a putut reda complet.</strong><p>Catalogul oficial rămâne disponibil mai jos. Reîncarcă pagina pentru a reîncerca textele integrate.</p>${error?`<small>${esc(error.message||error)}</small>`:''}</div>${items.map(act=>`<section class="legal-act"><header><div><p class="eyebrow">BIBLIOGRAFIE</p><h2>${esc(act.title)}</h2><p class="legal-scope">${esc(act.scope)}</p></div><div class="legal-act-actions"><a class="official-link" href="${esc(act.url)}" target="_blank" rel="noopener">Deschide forma oficială consolidată ↗</a></div></header></section>`).join('')}`;
  }

  async function openLegislation(){
    if(legislationPromise)return legislationPromise;
    legislationPromise=(async()=>{
      visualView('legislation');
      const host=document.getElementById('legislation');
      if(host){host.dataset.loading='true';delete host.dataset.loadError}
      try{
        await ensureApp();
        await loadScript(dataLoaderScript);
        if(!window.TRAINING_HEAVY_DATA?.legislation&&typeof window.loadTrainingHeavyData==='function')await window.loadTrainingHeavyData('legislation');
        await loadScript(legislationControllerScript);
        if(typeof bindLegislation==='function')bindLegislation();
        if(typeof renderLegislation!=='function')throw new Error('Rendererul Legislație nu este disponibil.');
        renderLegislation();
        observeLegalReading();
        if(host){delete host.dataset.loading;delete host.dataset.loadError;host.dataset.directRoute='true'}
        document.dispatchEvent(new CustomEvent('training:view-ready',{detail:{id:'legislation',direct:true}}));
        window.TRAINING_DATA_HEALTH?.audit?.();
        return true;
      }catch(error){
        console.error('Legislation direct route:',error);
        if(host){delete host.dataset.loading;host.dataset.loadError='true'}
        fallbackLegislation(error);
        return false;
      }finally{
        legislationPromise=null;
      }
    })();
    return legislationPromise;
  }

  function ensureApp(){
    if(bootPromise)return bootPromise;
    preloadScripts();document.documentElement.dataset.appBooting='true';
    bootPromise=(async()=>{
      await loadScript(persistenceScript);
      if(window.TRAINING_STATE_READY?.then)await window.TRAINING_STATE_READY;
      await hydrateDataBeforeRuntime();
      const directLegislation=pendingView==='legislation';
      if(directLegislation){try{history.replaceState(null,'','#dashboard')}catch{}}
      await loadScript(runtimeScript);
      if(directLegislation){try{history.replaceState(null,'','#legislation')}catch{}}
      await loadScript(dataHealthScript);
      document.documentElement.dataset.appReady='true';delete document.documentElement.dataset.appBooting;
      if(pendingView&&pendingView!=='legislation'&&typeof window.showView==='function')window.showView(pendingView);
      document.dispatchEvent(new CustomEvent('training:app-ready'));
      window.TRAINING_DATA_HEALTH?.audit?.();
      return true;
    })().catch(error=>{console.error('Training bootstrap:',error);delete document.documentElement.dataset.appBooting;document.documentElement.dataset.appBootError='true';bootPromise=null;throw error});
    return bootPromise;
  }

  async function prepareServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
      await registration.update();
      await navigator.serviceWorker.ready;
    }catch(error){console.warn('Service worker:',error)}
  }

  observeLegalReading();
  preloadScripts();
  document.addEventListener('pointerdown',event=>{
    if(document.documentElement.dataset.appReady==='true'||bootPromise)return;
    if(event.target.closest('.nav-item,[data-go],[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start,#interview-simulation-start'))ensureApp().catch(()=>{});
  },{capture:true,passive:true});

  document.addEventListener('click',event=>{
    const nav=event.target.closest('.nav-item,[data-go]');
    const id=nav?.dataset?.view||nav?.dataset?.go;
    if(id==='legislation'){
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingView='legislation';
      openLegislation().catch(()=>{});
      return;
    }
    if(replaying||document.documentElement.dataset.appReady==='true')return;
    if(nav&&id){event.preventDefault();visualView(id);ensureApp().catch(()=>{});return}
    const action=event.target.closest('[data-start-adaptive],[data-start-quiz],#quiz-start,#adaptive-start,#mistakes-start,#exam-start,#interview-simulation-start');
    if(action){event.preventDefault();ensureApp().then(()=>{replaying=true;try{action.click()}finally{replaying=false}}).catch(()=>{})}
  },true);

  window.addEventListener('hashchange',()=>{
    const id=decodeURIComponent(location.hash.replace(/^#/,''));
    if(id==='legislation'){openLegislation().catch(()=>{});return}
    if(document.documentElement.dataset.appReady==='true')return;
    if(id)visualView(id);
  });
  const initial=(()=>{try{const value=decodeURIComponent(location.hash.replace(/^#/,''));return value==='bibliography'?'legislation':value}catch{return ''}})();
  if(initial==='legislation')openLegislation().catch(()=>{});
  else if(initial&&initial!=='dashboard'&&document.getElementById(initial)){visualView(initial);ensureApp().catch(()=>{})}
  else{
    const schedule=()=>{if(document.documentElement.dataset.appReady==='true'||bootPromise)return;if('requestIdleCallback' in window)requestIdleCallback(()=>ensureApp().catch(()=>{}),{timeout:700});else setTimeout(()=>ensureApp().catch(()=>{}),220)};
    if(document.readyState==='complete')schedule();else window.addEventListener('load',schedule,{once:true});
  }
  if(document.readyState==='complete')setTimeout(prepareServiceWorker,0);else window.addEventListener('load',()=>setTimeout(prepareServiceWorker,0),{once:true});
  window.TRAINING_BOOT={ensureApp,visualView,preloadScripts,hydrateDataBeforeRuntime,openLegislation,get ready(){return document.documentElement.dataset.appReady==='true'}};
})();
