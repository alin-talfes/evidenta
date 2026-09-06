(function(root){
'use strict';

const PDF_VERSION='6.2.108';
const PDF_MODULE_URL=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/legacy/build/pdf.min.mjs`;
const PDF_WORKER_URL=`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_VERSION}/legacy/build/pdf.worker.min.mjs`;
const DANGEROUS_PDF_TOKENS=[
  '/JavaScript','/JS','/OpenAction','/AA','/Launch','/EmbeddedFile','/RichMedia','/SubmitForm','/GoToE'
];

let securePdfPromise=null;
let pdfModuleObjectUrl='';
let pdfWorkerObjectUrl='';
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
  try { return new URL(value,location.href).origin===location.origin; }
  catch(_){ return false; }
}

function lockOutboundNetwork(){
  if(networkLocked) return;
  networkLocked=true;
  if(nativeFetch){
    root.fetch=(input,init)=>{
      const url=typeof input==='string'?input:input?.url;
      if(!sameOrigin(url)) return Promise.reject(new Error('Conexiunile externe sunt blocate cât timp un document sensibil este încărcat.'));
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
  if(NativeWebSocket) root.WebSocket=function(){ throw new Error('WebSocket este dezactivat în modul document sensibil.'); };
  if(NativeEventSource) root.EventSource=function(){ throw new Error('EventSource este dezactivat în modul document sensibil.'); };
  if(root.navigator&&nativeBeacon){
    try { Object.defineProperty(root.navigator,'sendBeacon',{configurable:true,value:()=>false}); } catch(_) {}
  }
}

async function fetchText(url){
  if(!nativeFetch) throw new Error('Browserul nu oferă fetch pentru inițializarea runtime-ului securizat.');
  const response=await nativeFetch(url,{cache:'force-cache',credentials:'omit',referrerPolicy:'no-referrer',mode:'cors'});
  if(!response.ok) throw new Error(`Nu s-a putut încărca runtime-ul securizat (${response.status}).`);
  return response.text();
}

async function securePdf(){
  if(securePdfPromise) return securePdfPromise;
  securePdfPromise=(async()=>{
    const [moduleSource,workerSource]=await Promise.all([fetchText(PDF_MODULE_URL),fetchText(PDF_WORKER_URL)]);
    if(moduleSource.length<100000||workerSource.length<100000) throw new Error('Distribuția PDF.js descărcată este incompletă.');
    pdfModuleObjectUrl=URL.createObjectURL(new Blob([moduleSource],{type:'text/javascript'}));
    pdfWorkerObjectUrl=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
    const lib=await import(pdfModuleObjectUrl);
    if(String(lib.version)!==PDF_VERSION) throw new Error(`Versiune PDF.js neașteptată: ${lib.version||'necunoscută'}.`);
    lib.GlobalWorkerOptions.workerSrc=pdfWorkerObjectUrl;
    return new Proxy(lib,{
      get(target,prop){
        if(prop!=='getDocument') return Reflect.get(target,prop);
        return input=>{
          const opts=(input&&typeof input==='object'&&!ArrayBuffer.isView(input))?{...input}:{data:input};
          return target.getDocument({
            ...opts,
            isEvalSupported:false,
            enableScripting:false,
            enableXfa:false,
            useWasm:false
          });
        };
      }
    });
  })().catch(error=>{ securePdfPromise=null; throw error; });
  return securePdfPromise;
}

async function warmOcr(){
  const deps=root.AIDocumentDependencies;
  if(!deps?.ensureTesseract||!deps?.recognizeDetailed) throw new Error('Runtime-ul OCR nu este disponibil.');
  await deps.ensureTesseract();
  const canvas=document.createElement('canvas');
  canvas.width=16; canvas.height=16;
  const ctx=canvas.getContext('2d');
  if(!ctx) throw new Error('Canvas OCR indisponibil.');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,16,16);
  await deps.recognizeDetailed(canvas,()=>{});
  canvas.width=1; canvas.height=1;
}

async function prepareRuntime(){
  const deps=root.AIDocumentDependencies;
  if(!deps) throw new Error('Controllerul de dependențe AI lipsește.');
  deps.ensurePdf=securePdf;
  deps.PDFJS_URL=PDF_MODULE_URL;
  deps.PDFJS_WORKER_URL=PDF_WORKER_URL;
  await Promise.all([securePdf(),warmOcr()]);
  runtimeReady=true;
  return true;
}

function bytesToAscii(bytes){
  let out='';
  const step=0x8000;
  for(let i=0;i<bytes.length;i+=step) out+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+step)));
  return out;
}

async function inspectPdfFile(file){
  const buffer=await file.arrayBuffer();
  const bytes=new Uint8Array(buffer);
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
  if(status){ status.textContent=message||''; status.classList.toggle('ai-security-error',Boolean(error)); }
}

function setInputReady(ready){
  const input=document.getElementById('fileInput');
  const drop=document.getElementById('dropZone');
  const analyze=document.getElementById('analyzeFilesBtn');
  if(input) input.disabled=!ready;
  if(analyze) analyze.disabled=!ready;
  drop?.setAttribute('aria-disabled',String(!ready));
  drop?.classList.toggle('ai-security-locked',!ready);
}

function scrubSensitiveDom(){
  sensitiveFiles=[];
  preflightPassed=false;
  const ids=['rawText','fileInput','evidenceList','resultContent','warningList'];
  for(const id of ids){
    const el=document.getElementById(id);
    if(!el) continue;
    if('value' in el) el.value='';
    else el.textContent='';
  }
}

function rememberSelected(list){
  sensitiveFiles=[...(list||[])];
  preflightPassed=false;
  if(sensitiveFiles.length) lockOutboundNetwork();
}

function init(){
  const input=document.getElementById('fileInput');
  const drop=document.getElementById('dropZone');
  const analyze=document.getElementById('analyzeFilesBtn');
  const clear=document.getElementById('clearBtn');
  setInputReady(false);
  setStatus('Inițializare securizată…');

  void prepareRuntime().then(()=>{
    setInputReady(true);
    setStatus('Procesare locală pregătită.');
  }).catch(error=>{
    setInputReady(false);
    setStatus(`Modul AI blocat: ${error?.message||error}`,true);
  });

  input?.addEventListener('change',event=>rememberSelected(event.target.files),true);
  drop?.addEventListener('drop',event=>{
    if(!runtimeReady){ event.preventDefault(); event.stopImmediatePropagation(); return; }
    rememberSelected(event.dataTransfer?.files);
  },true);

  analyze?.addEventListener('click',event=>{
    if(preflightPassed){ preflightPassed=false; return; }
    if(!runtimeReady){ event.preventDefault(); event.stopImmediatePropagation(); setStatus('Runtime-ul securizat nu este pregătit.',true); return; }
    event.preventDefault();
    event.stopImmediatePropagation();
    analyze.disabled=true;
    setStatus('Verificare de securitate a documentului…');
    void preflightFiles().then(()=>{
      preflightPassed=true;
      analyze.disabled=false;
      setStatus('Document verificat. Începe procesarea locală.');
      analyze.click();
    }).catch(error=>{
      preflightPassed=false;
      analyze.disabled=false;
      setStatus(error?.message||String(error),true);
    });
  },true);

  clear?.addEventListener('click',()=>{ sensitiveFiles=[]; preflightPassed=false; },true);
  root.addEventListener('pagehide',scrubSensitiveDom,{once:true});
}

root.AISecurityRuntime={PDF_VERSION,PDF_MODULE_URL,PDF_WORKER_URL,DANGEROUS_PDF_TOKENS,prepareRuntime,inspectPdfFile,preflightFiles,get ready(){return runtimeReady;}};
if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',init,{once:true});
})(typeof window!=='undefined'?window:globalThis);
