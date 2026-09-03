import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const fail=[];
const note=[];
const dormant=new Set(['dashboard-study-plan.css']);
const ignoredDirs=new Set(['.git','node_modules']);

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(ignoredDirs.has(entry.name))return [];
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[path.relative(root,full).replaceAll('\\','/')];
  });
}

function structuralCheck(file,css){
  const pairs={'}':'{',']':'[',')':'('};
  const open=new Set(Object.values(pairs));
  const stack=[];
  let quote='',escaped=false,comment=false;
  for(let i=0;i<css.length;i++){
    const ch=css[i],next=css[i+1];
    if(comment){if(ch==='*'&&next==='/'){comment=false;i++}continue}
    if(quote){if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch===quote)quote='';continue}
    if(ch==='/'&&next==='*'){comment=true;i++;continue}
    if(ch==='"'||ch==="'"){quote=ch;continue}
    if(open.has(ch)){stack.push({ch,i});continue}
    if(pairs[ch]){const top=stack.pop();if(!top||top.ch!==pairs[ch]){fail.push(`${file}: delimiter ${ch} fără pereche la offset ${i}`);return}}
  }
  if(comment)fail.push(`${file}: comentariu CSS neînchis`);
  if(quote)fail.push(`${file}: șir CSS neînchis (${quote})`);
  if(stack.length)fail.push(`${file}: delimitator ${stack.at(-1).ch} neînchis`);
}

function localUrls(css){
  const urls=[];
  for(const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gsi)){
    const raw=match[2].trim();
    if(!raw||/^(?:data:|https?:|blob:|#)/i.test(raw)||raw.includes('var('))continue;
    urls.push(raw.split(/[?#]/,1)[0]);
  }
  return urls;
}

const cssFiles=walk(root).filter(file=>file.endsWith('.css')).sort();
let postcss=null;
try{postcss=(await import('postcss')).default}catch{note.push('PostCSS indisponibil; rulează verificarea structurală internă.')}

for(const file of cssFiles){
  const css=fs.readFileSync(path.join(root,file),'utf8');
  structuralCheck(file,css);
  if(postcss){try{postcss.parse(css,{from:file})}catch(error){fail.push(`${file}: ${error.reason||error.message}${error.line?` (linia ${error.line}, coloana ${error.column})`:''}`)}}
  for(const ref of localUrls(css)){
    const resolved=path.normalize(path.join(root,path.dirname(file),ref));
    if(!resolved.startsWith(root+path.sep)&&resolved!==root){fail.push(`${file}: url() iese din repository: ${ref}`);continue}
    if(!fs.existsSync(resolved))fail.push(`${file}: resursă locală inexistentă în url(): ${ref}`);
  }
}

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const fastLoader=fs.readFileSync(path.join(root,'fast-loader.js'),'utf8');
const buildMobile=fs.readFileSync(path.join(root,'scripts/build-mobile-css.mjs'),'utf8');
const direct=new Set([...index.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)].map(m=>m[1].split(/[?#]/,1)[0]));
const lazy=new Set([...fastLoader.matchAll(/\bstyle\(\s*["']([^"']+\.css)["']\s*\)/g)].map(m=>m[1]));
const sourceBlock=buildMobile.match(/const\s+sources\s*=\s*\[([^\]]+)\]/s)?.[1]||'';
const bundled=new Set([...sourceBlock.matchAll(/["']([^"']+\.css)["']/g)].map(m=>m[1]));
const active=new Set([...direct,...lazy,...bundled]);

for(const href of [...direct,...lazy,...bundled]){
  if(!fs.existsSync(path.join(root,href)))fail.push(`Referință CSS inexistentă: ${href}`);
}
for(const file of cssFiles){
  if(file.startsWith('generated/')&&file!=='generated/mobile-bundle.css')continue;
  if(active.has(file)||dormant.has(file))continue;
  fail.push(`CSS fără traseu de încărcare declarat: ${file}`);
}
for(const file of dormant){
  if(!cssFiles.includes(file))fail.push(`CSS dormant declarat dar inexistent: ${file}`);
}

const banner='/* GENERATED FILE — edit source CSS files, not this bundle. */\n';
const expected=banner+[...bundled].map(file=>`\n/* ${file} */\n${fs.readFileSync(path.join(root,file),'utf8').trim()}\n`).join('');
const generatedPath=path.join(root,'generated/mobile-bundle.css');
if(!fs.existsSync(generatedPath))fail.push('Lipsește generated/mobile-bundle.css');
else if(fs.readFileSync(generatedPath,'utf8')!==expected)fail.push('generated/mobile-bundle.css nu corespunde surselor declarate în scripts/build-mobile-css.mjs');

for(const match of fastLoader.matchAll(/\bstyle\(\s*["']([^"']+\.css)["']\s*\)/g)){
  const before=fastLoader.slice(Math.max(0,match.index-16),match.index);
  if(!/await\s*$/.test(before))fail.push(`fast-loader.js: ${match[1]} este inserat fără await; modulul poate fi randat înaintea CSS-ului`);
}

if(fail.length){
  console.error(`CSS audit FAILED (${fail.length})`);
  for(const item of fail)console.error(`- ${item}`);
  process.exit(1);
}
console.log(`CSS audit OK: ${cssFiles.length} fișiere, ${direct.size} directe, ${lazy.size} lazy, ${bundled.size} surse bundle, ${dormant.size} dormant intenționat.`);
for(const item of note)console.log(`- ${item}`);
