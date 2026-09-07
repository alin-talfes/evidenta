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

async function onChange(event){
  if(redispatching || event.target?.id!=='fileInput') return;
  const input=event.target;
  const files=Array.from(input.files||[]);
  if(files.length<2 || !repeatedSizes(files) || !canReplaceFileList()) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  try{
    const result=await processFiles(files);
    input.files=makeFileList(result.files);
    redispatching=true;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    redispatching=false;
    if(result.duplicates.length) duplicateStatus(result.files.length,result.duplicates.length);
  }catch(_){
    redispatching=true;
    input.files=makeFileList(files);
    input.dispatchEvent(new Event('change',{bubbles:true}));
    redispatching=false;
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
  try{
    const result=await processFiles(files);
    const input=document.getElementById('fileInput');
    if(!input) return;
    input.files=makeFileList(result.files);
    redispatching=true;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    redispatching=false;
    if(result.duplicates.length) duplicateStatus(result.files.length,result.duplicates.length);
  }catch(_){ /* fail-open pentru selectarea locală; validările existente rămân active */ }
}

document.addEventListener('change',event=>{ void onChange(event); },true);
document.addEventListener('drop',event=>{ void onDrop(event); },true);
})();
