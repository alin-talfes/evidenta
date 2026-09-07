import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const code=fs.readFileSync('ai/file-dedup.js','utf8');
const ctx={console,crypto:webcrypto,Uint8Array,Array,Map,Number,String,globalThis:null}; ctx.globalThis=ctx;
vm.createContext(ctx); vm.runInContext(code,ctx,{filename:'ai/file-dedup.js'});

function fakeFile(name,bytes){
  const data=Uint8Array.from(bytes);
  return {name,size:data.byteLength,arrayBuffer:async()=>data.buffer.slice(0)};
}

const a=fakeFile('scan-a.jpg',[1,2,3,4,5]);
const b=fakeFile('scan-a-copy.jpg',[1,2,3,4,5]);
const c=fakeFile('scan-b.jpg',[1,2,3,4,6]);
const d=fakeFile('alt.pdf',[9,8,7]);
const result=await ctx.AIFileDedup.dedupeExactFiles([a,b,c,d]);
assert.equal(result.available,true);
assert.deepEqual(Array.from(result.files,x=>x.name),['scan-a.jpg','scan-b.jpg','alt.pdf']);
assert.equal(result.duplicates.length,1);
assert.equal(result.duplicates[0].file.name,'scan-a-copy.jpg');
assert.equal(result.duplicates[0].duplicateOf.name,'scan-a.jpg');

const distinctSameSize=await ctx.AIFileDedup.dedupeExactFiles([a,c]);
assert.equal(distinctSameSize.files.length,2);
assert.equal(distinctSameSize.duplicates.length,0);

console.log('AI duplicate files: SHA-256 local elimină numai fișiere byte-identice, indiferent de nume.');
