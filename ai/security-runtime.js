(function(root){
'use strict';

const PDF_VERSION='6.2.108';
const OCR_LANGUAGE='ron';
const OCR_DPI='300';
const LOW_CONFIDENCE_THRESHOLD=78;
const SCRIPT_URL=new URL(document.currentScript?.src||'security-runtime.js',document.baseURI);
const SW_URL=new URL('security-sw.js',SCRIPT_URL);
const SW_SCOPE=new URL('./',SW_URL);
const SECURE_BASE=new URL('_secure/',SW_URL);
const PDF_MODULE_URL=new URL('pdf/pdf.min.mjs',SECURE_BASE).href;
const PDF_WORKER_URL=new URL('pdf/pdf.worker.min.mjs',SECURE_BASE).href;
const TESSERACT_URL=new URL('tesseract/tesseract.min.js',SECURE_BASE).href;
const TESSERACT_WORKER_URL=new URL('tesseract/worker.min.js',SECURE_BASE).href;
const TESSERACT_CORE_PATH=new URL('tesseract-core/',SECURE_BASE).href.replace(/\/$/,'');
const TESSERACT_LANG_PATH=new URL('tessdata-best/',SECURE_BASE).href.replace(/\/$/,'');
const OCR_CACHE_PATH='evidenta-ai-ron-best-v2';
const DANGEROUS_PDF_TOKENS=['/JavaScript','/JS','/OpenAction','/AA','/Launch','/EmbeddedFile','/RichMedia','/SubmitForm','/GoToE'];

let securePdfPromise=null;
let secureTesseractPromise=null;
let secureOcrWorkerPromise=null;
let currentLogger=null;
let sensitiveFiles=[];
let runtimeReady=false;
let networkLocked=false;
let preflightPassed=false;

const nativeFetch=root.fetch?.bind(root);
const NativeXHR=root.XMLHttpRequest;
const NativeWebSocket=root.WebSocket;
const NativeEventSource=root.EventSource;
const nativeBeacon=root.navigator?.sendBeacon?.bind(root.navigator);

function sameOrigin(value){
  try {
    const raw=typeof value==='string'?value:value?.url;
    return new URL(raw,location.href).origin===location.origin;
  } catch(_){ return false; }
}

function lockOutboundNetwork(){
  if(networkLocked) return;
  networkLocked=true;
  if(nativeFetch){
    root.fetch=(input,init)=>{
      if(!sameOrigin(input)) return Promise.reject(new Error('Conexiunile externe sunt blocate cât timp un document sensibil este încărcat.'));
      return nativeFetch(input,init);
    };
  }
  if(NativeXHR){
    root.XMLHttpRequest=class SecureXHR extends NativeXHR{
      open(method,url,...rest){
        if(!sameOrigin(url)) throw new Error('Conexiunile externe sunt blocate cât timp un document sensibil este încărcat.');
        return super.open(method,url,...rest);
      }
    };
  }
  if(NativeWebSocket) root.WebSocket=function(){throw new Error('WebSocket este dezactivat în modul document sensibil.');};
  if(NativeEventSource) root.EventSource=function(){throw new Error('EventSource este dezactivat în modul document sensibil.');};
  if(root.navigator&&nativeBeacon){
    try{Object.defineProperty(root.navigator,'sendBeacon',{configurable:true,value:()=>false});}catch(_){}
  }
}

async function ensureSecurityWorker(){
  if(!('serviceWorker' in navigator)) throw new Error('Browserul nu oferă Service Worker; modulul AI rămâne blocat.');
  const registration=await navigator.serviceWorker.register(SW_URL.href,{scope:SW_SCOPE.href,updateViaCache:'none'});
  await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller){
    await new Promise(resolve=>{
      const timeout=setTimeout(resolve,5000);
      navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timeout);resolve();},{once:true});
    });
  }
  if(!navigator.serviceWorker.controller) throw new Error('Proxy-ul local de integritate nu a preluat controlul paginii. Reîncarcă pagina.');
  if(registration.waiting) registration.waiting.postMessage?.({type:'SKIP_WAITING'});
  return registration;
}

function loadScript(url,globalName){
  if(root[globalName]) return Promise.resolve(root[globalName]);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timeout=setTimeout(()=>{script.remove();reject(new Error(`Încărcarea ${globalName} a expirat.`));},30000);
    script.src=url;
    script.async=true;
    script.referrerPolicy='no-referrer';
    script.dataset.aiSecureDependency=globalName;
    script.onload=()=>{clearTimeout(timeout);root[globalName]?resolve(root[globalName]):reject(new Error(`${globalName} nu s-a inițializat.`));};
    script.onerror=()=>{clearTimeout(timeout);script.remove();reject(new Error(`Integritatea sau încărcarea ${globalName} a eșuat.`));};
    document.head.appendChild(script);
  });
}

async function securePdf(){
  if(securePdfPromise) return securePdfPromise;
  securePdfPromise=import(PDF_MODULE_URL).then(lib=>{
    if(String(lib.version)!==PDF_VERSION) throw new Error(`Versiune PDF.js neașteptată: ${lib.version||'necunoscută'}.`);
    lib.GlobalWorkerOptions.workerSrc=PDF_WORKER_URL;
    return new Proxy(lib,{
      get(target,prop){
        if(prop!=='getDocument') return Reflect.get(target,prop);
        return input=>{
          const opts=(input&&typeof input==='object'&&!ArrayBuffer.isView(input))?{...input}:{data:input};
          return target.getDocument({...opts,isEvalSupported:false,enableScripting:false,enableXfa:false,useWasm:false});
        };
      }
    });
  }).catch(error=>{securePdfPromise=null;throw error;});
  return securePdfPromise;
}

async function ensureSecureTesseract(){
  if(!secureTesseractPromise){
    secureTesseractPromise=loadScript(TESSERACT_URL,'Tesseract').catch(error=>{secureTesseractPromise=null;throw error;});
  }
  return secureTesseractPromise;
}

function psmValue(Tesseract,key,fallback){return Tesseract?.PSM?.[key]??fallback;}

async function configureWorker(worker,Tesseract,pageSegMode){
  await worker.setParameters({tessedit_pageseg_mode:pageSegMode,preserve_interword_spaces:'1',user_defined_dpi:OCR_DPI});
}

function normalizedCandidate(result,pass){
  const rawText=result?.data?.text||'';
  const text=root.AIRomanianOCR?.normalizeRomanianText?root.AIRomanianOCR.normalizeRomanianText(rawText):rawText;
  const confidence=Number(result?.data?.confidence||0);
  const score=root.AIRomanianOCR?.scoreCandidate?root.AIRomanianOCR.scoreCandidate(text,confidence):confidence;
  return{text,confidence,score,pass};
}

function scaledLogger(logger,offset,span){
  if(typeof logger!=='function') return null;
  return message=>{
    const copy={...message};
    if(copy.status==='recognizing text'&&Number.isFinite(copy.progress)) copy.progress=Math.max(0,Math.min(1,offset+copy.progress*span));
    logger(copy);
  };
}

async function getSecureOcrWorker(logger){
  currentLogger=typeof logger==='function'?logger:null;
  if(!secureOcrWorkerPromise){
    const Tesseract=await ensureSecureTesseract();
    const oem=Tesseract?.OEM?.LSTM_ONLY??1;
    secureOcrWorkerPromise=Tesseract.createWorker(OCR_LANGUAGE,oem,{
      workerPath:TESSERACT_WORKER_URL,
      workerBlobURL:false,
      corePath:TESSERACT_CORE_PATH,
      langPath:TESSERACT_LANG_PATH,
      cachePath:OCR_CACHE_PATH,
      cacheMethod:'write',
      gzip:true,
      logger:message=>currentLogger?.(message),
      errorHandler:error=>console.error('Tesseract worker:',error)
    }).then(async worker=>{
      await configureWorker(worker,Tesseract,psmValue(Tesseract,'AUTO','3'));
      return worker;
    }).catch(error=>{secureOcrWorkerPromise=null;throw error;});
  }
  return secureOcrWorkerPromise;
}

async function secureRecognizeDetailed(source,logger){
  const Tesseract=await ensureSecureTesseract();
  const worker=await getSecureOcrWorker(logger);
  const prepared=root.AIRomanianOCR?.preprocessSource?await root.AIRomanianOCR.preprocessSource(source):source;
  const autoMode=psmValue(Tesseract,'AUTO','3');
  const blockMode=psmValue(Tesseract,'SINGLE_BLOCK','6');
  await configureWorker(worker,Tesseract,autoMode);
  currentLogger=scaledLogger(logger,0,0.76);
  const first=normalizedCandidate(await worker.recognize(prepared,{rotateAuto:true}),'auto');
  const retry=first.confidence<LOW_CONFIDENCE_THRESHOLD||first.text.length<120||first.score<68;
  if(!retry){currentLogger=typeof logger==='function'?logger:null;return{...first,retried:false};}
  await configureWorker(worker,Tesseract,blockMode);
  currentLogger=scaledLogger(logger,0.76,0.24);
  const second=normalizedCandidate(await worker.recognize(prepared,{rotateAuto:true}),'single-block');
  await configureWorker(worker,Tesseract,autoMode);
  currentLogger=typeof logger==='function'?logger:null;
  const best=second.score>first.score?second:first;
  return{...best,retried:true};
}

async function secureRecognize(source,logger){return(await secureRecognizeDetailed(source,logger)).text;}

async function terminateSecureOcr(){
  currentLogger=null;
  if(!secureOcrWorkerPromise) return;
  try{const worker=await secureOcrWorkerPromise;await worker.terminate();}
  catch(_){}
  finally{secureOcrWorkerPromise=null;}
}

async function warmOcr(){
  await ensureSecureTesseract();
  const canvas=document.createElement('canvas');
  canvas.width=16;canvas.height=16;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas OCR indisponibil.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,16,16);
  await secureRecognizeDetailed(canvas,()=>{});
  canvas.width=1;canvas.height=1;
}

async function prepareRuntime(){
  const deps=root.AIDocumentDependencies;
  if(!deps) throw new Error('Controllerul de dependențe AI lipsește.');
  await ensureSecurityWorker();
  deps.ensurePdf=securePdf;
  deps.ensureTesseract=ensureSecureTesseract;
  deps.recognize=secureRecognize;
  deps.recognizeDetailed=secureRecognizeDetailed;
  deps.terminateOcr=terminateSecureOcr;
  deps.PDFJS_URL=PDF_MODULE_URL;
  deps.PDFJS_WORKER_URL=PDF_WORKER_URL;
  deps.TESSERACT_URL=TESSERACT_URL;
  deps.TESSERACT_WORKER_URL=TESSERACT_WORKER_URL;
  deps.TESSERACT_CORE_PATH=TESSERACT_CORE_PATH;
  deps.TESSERACT_LANG_PATH=TESSERACT_LANG_PATH;
  await Promise.all([securePdf(),warmOcr()]);
  runtimeReady=true;
  return true;
}

function bytesToAscii(bytes){
  let out='';const step=0x8000;
  for(let i=0;i<bytes.length;i+=step) out+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+step)));
  return out;
}

async function inspectPdfFile(file){
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(bytes.length<5||String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-') throw new Error(`${file.name}: extensia este PDF, dar semnătura fișierului nu este validă.`);
  const raw=bytesToAscii(bytes);
  const found=DANGEROUS_PDF_TOKENS.filter(token=>raw.includes(token));
  if(found.length) throw new Error(`${file.name}: documentul conține elemente PDF active (${found.join(', ')}). Din motive de securitate, fișierul a fost blocat.`);
  return true;
}

async function preflightFiles(){
  for(const file of sensitiveFiles){
    const name=String(file?.name||'').toLowerCase();
    if(file?.type==='application/pdf'||name.endsWith('.pdf')) await inspectPdfFile(file);
  }
}

function setStatus(message,error=false){
  const status=document.getElementById('statusText');
  if(status){status.textContent=message||'';status.classList.toggle('ai-security-error',Boolean(error));}
}

function setInputReady(ready){
  const input=document.getElementById('fileInput');const drop=document.getElementById('dropZone');const analyze=document.getElementById('analyzeFilesBtn');
  if(input) input.disabled=!ready;if(analyze) analyze.disabled=!ready;
  drop?.setAttribute('aria-disabled',String(!ready));drop?.classList.toggle('ai-security-locked',!ready);
}

function scrubSensitiveDom(){
  sensitiveFiles=[];preflightPassed=false;
  for(const id of ['rawText','fileInput','evidenceList','resultContent','warningList','penaltyRows','deductionRows']){
    const el=document.getElementById(id);if(!el) continue;
    if('value' in el) el.value='';else el.textContent='';
  }
  for(const id of ['birthDate','startDate','receivedDate']){const el=document.getElementById(id);if(el) el.value='';}
}

function rememberSelected(list){sensitiveFiles=[...(list||[])];preflightPassed=false;if(sensitiveFiles.length) lockOutboundNetwork();}

function init(){
  const input=document.getElementById('fileInput');const drop=document.getElementById('dropZone');const analyze=document.getElementById('analyzeFilesBtn');const clear=document.getElementById('clearBtn');
  setInputReady(false);setStatus('Inițializare securizată…');
  void prepareRuntime().then(()=>{setInputReady(true);setStatus('Procesare locală securizată pregătită.');}).catch(error=>{setInputReady(false);setStatus(`Modul AI blocat: ${error?.message||error}`,true);});
  input?.addEventListener('change',event=>rememberSelected(event.target.files),true);
  drop?.addEventListener('drop',event=>{if(!runtimeReady){event.preventDefault();event.stopImmediatePropagation();return;}rememberSelected(event.dataTransfer?.files);},true);
  analyze?.addEventListener('click',event=>{
    if(preflightPassed){preflightPassed=false;return;}
    if(!runtimeReady){event.preventDefault();event.stopImmediatePropagation();setStatus('Runtime-ul securizat nu este pregătit.',true);return;}
    event.preventDefault();event.stopImmediatePropagation();analyze.disabled=true;setStatus('Verificare de securitate a documentului…');
    void preflightFiles().then(()=>{preflightPassed=true;analyze.disabled=false;setStatus('Document verificat. Începe procesarea locală.');analyze.click();}).catch(error=>{preflightPassed=false;analyze.disabled=false;setStatus(error?.message||String(error),true);});
  },true);
  clear?.addEventListener('click',()=>{sensitiveFiles=[];preflightPassed=false;},true);
  root.addEventListener('pagehide',()=>{scrubSensitiveDom();void terminateSecureOcr();},{once:true});
}

root.AISecurityRuntime={PDF_VERSION,PDF_MODULE_URL,PDF_WORKER_URL,TESSERACT_URL,DANGEROUS_PDF_TOKENS,prepareRuntime,inspectPdfFile,preflightFiles,get ready(){return runtimeReady;}};
if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',init,{once:true});
})(typeof window!=='undefined'?window:globalThis);
