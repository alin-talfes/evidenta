(()=>{
  if(window.TRAINING_PERSISTENCE)return;
  const DB_NAME="evidenta-training-state";
  const DB_VERSION=1;
  const STORE="state";
  const KEY="main";
  const LS_KEY="evidenta-training";
  let dbPromise=null,pendingState=null,flushTimer=0,writing=null;

  const parse=value=>{try{const data=JSON.parse(value||"null");return data&&typeof data==="object"&&!Array.isArray(data)?data:null}catch{return null}};
  const openDb=()=>{
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("IndexedDB indisponibil"));
    }).catch(error=>{console.warn("Training IndexedDB:",error);return null});
    return dbPromise;
  };
  const readDb=async()=>{
    const db=await openDb();if(!db)return null;
    return new Promise(resolve=>{try{const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>resolve(null)}catch{resolve(null)}});
  };
  const writeDb=async value=>{
    const db=await openDb();if(!db)return false;
    return new Promise(resolve=>{try{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(value,KEY);tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false)}catch{resolve(false)}});
  };
  const compact=value=>{
    const s=value&&typeof value==="object"?value:{};
    const keep=["answered","correct","correctIds","mistakes","completedCards","readArticles","writtenResults","lastActive","streak","questionStats","interviewResults","interviewScores"];
    const out={__idb:true};for(const key of keep)if(s[key]!==undefined)out[key]=s[key];return out;
  };
  const writeCompact=value=>{try{localStorage.setItem(LS_KEY,JSON.stringify(compact(value)))}catch{}};

  window.TRAINING_STATE_READY=(async()=>{
    const legacy=parse(localStorage.getItem(LS_KEY));
    let state=await readDb();
    if(!state&&legacy){state=legacy;await writeDb(state)}
    state=state||legacy||{};
    window.TRAINING_STATE_HYDRATED=state;
    writeCompact(state);
    return state;
  })();

  async function flush(){
    clearTimeout(flushTimer);flushTimer=0;
    if(!pendingState)return writing;
    const value=pendingState;pendingState=null;
    writeCompact(value);
    writing=writeDb(value).finally(()=>{writing=null;if(pendingState)queue(pendingState,60)});
    return writing;
  }
  function queue(value,delay=220){pendingState=value;clearTimeout(flushTimer);flushTimer=setTimeout(flush,delay)}
  window.addEventListener("pagehide",()=>{if(pendingState){writeCompact(pendingState);writeDb(pendingState)}},{capture:true});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});
  window.TRAINING_PERSISTENCE={queue,flush,compact,ready:window.TRAINING_STATE_READY,version:"idb-v1"};
})();
