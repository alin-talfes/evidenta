(function(root){
'use strict';

function bytesToHex(bytes){
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function sha256File(file){
  if(!root.crypto?.subtle) throw new Error('SHA-256 nu este disponibil în acest browser.');
  if(!file || typeof file.arrayBuffer!=='function') throw new Error('Fișier invalid pentru verificarea duplicatelor.');
  const digest=await root.crypto.subtle.digest('SHA-256',await file.arrayBuffer());
  return bytesToHex(digest);
}

function repeatedSizes(files){
  const counts=new Map();
  for(const file of files||[]) counts.set(Number(file?.size||0),(counts.get(Number(file?.size||0))||0)+1);
  return counts;
}

async function dedupeExactFiles(files){
  const input=Array.from(files||[]);
  if(input.length<2) return {files:input,duplicates:[],available:Boolean(root.crypto?.subtle)};
  if(!root.crypto?.subtle) return {files:input,duplicates:[],available:false};

  const counts=repeatedSizes(input);
  const seen=new Map();
  const kept=[];
  const duplicates=[];

  for(const file of input){
    const size=Number(file?.size||0);
    if((counts.get(size)||0)<2){ kept.push(file); continue; }
    const hash=await sha256File(file);
    const key=`${size}:${hash}`;
    if(seen.has(key)) duplicates.push({file,duplicateOf:seen.get(key)});
    else { seen.set(key,file); kept.push(file); }
  }
  return {files:kept,duplicates,available:true};
}

root.AIFileDedup={sha256File,dedupeExactFiles,repeatedSizes};
})(typeof window!=='undefined'?window:globalThis);
