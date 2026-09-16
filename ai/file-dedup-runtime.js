(function(){
'use strict';

let redispatching=false;

function canReplaceFileList(){ return typeof DataTransfer==='function'; }
function repeatedSizes(files){
  const counts=new Map();
  for(const file of files||[]) counts.set(Number(file?.size||0),(counts.get(Number(file?.size||0))||0)+1);
  return [...counts.values()].some(n=>n>1);
}
function makeFileList(files){
  const dt=new DataTransfer();
  for(const file of files) dt.items.add(file);
  return dt.files;
}
function duplicateStatus(kept,duplicates){
  const el=document.getElementById('statusText');
  if(!el) return;
  el.textContent=`${kept} fișier(e) selectat(e) · ${duplicates} duplicat(e) identic(e) ignorat(e).`;
}
async function processFiles(files){
  if(!window.AIFileDedup?.dedupeExactFiles) return {files:Array.from(files||[]),duplicates:[],available:false};
  return window.AIFileDedup.dedupeExactFiles(files);
}
function dispatchFiles(input,files){
  input.files=makeFileList(files);
  redispatching=true;
  try{
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }finally{
    redispatching=false;
  }
}

async function onChange(event){
  if(redispatching || event.target?.id!=='fileInput') return;
  const input=event.target;
  const files=Array.from(input.files||[]);
  if(files.length<2 || !repeatedSizes(files) || !canReplaceFileList()) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  try{
    const result=await processFiles(files);
    dispatchFiles(input,result.files);
    if(result.duplicates.length) duplicateStatus(result.files.length,result.duplicates.length);
  }catch(_){
    dispatchFiles(input,files);
  }
}

async function onDrop(event){
  if(redispatching) return;
  const target=event.target?.closest?.('#dropZone');
  if(!target) return;
  const files=Array.from(event.dataTransfer?.files||[]);
  if(files.length<2 || !repeatedSizes(files) || !canReplaceFileList()) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  target.classList.remove('dragover');
  const input=document.getElementById('fileInput');
  if(!input) return;
  try{
    const result=await processFiles(files);
    dispatchFiles(input,result.files);
    if(result.duplicates.length) duplicateStatus(result.files.length,result.duplicates.length);
  }catch(_){
    /* Drop-ul original a fost deja oprit pentru deduplicarea asincronă.
       Reintroducem selecția originală, astfel încât o eroare de hashing să nu
       transforme un drop valid într-o operațiune pierdută. */
    try{ dispatchFiles(input,files); }catch(__){ /* validările/UI existente rămân intacte */ }
  }
}

document.addEventListener('change',event=>{ void onChange(event); },true);
document.addEventListener('drop',event=>{ void onDrop(event); },true);
})();
