import fs from 'node:fs';
import * as acorn from 'acorn';
import {transformSync} from 'esbuild';

const appSource=fs.readFileSync('app.js','utf8');
const ast=acorn.parse(appSource,{ecmaVersion:'latest',sourceType:'script',allowHashBang:true});
const groups={interview:[],legislation:[],official:[]};
const inventory=[];
for(const node of ast.body){
  if(node.type!=='FunctionDeclaration'||!node.id?.name)continue;
  const name=node.id.name;inventory.push(name);
  if(/interview/i.test(name))groups.interview.push(node);
  else if(['renderLegislation','renderLegalArticle','bindLegislation'].includes(name))groups.legislation.push(node);
  else if(name==='renderOfficial'||/^renderWritten/.test(name))groups.official.push(node);
}
const extracted=[...groups.interview,...groups.legislation,...groups.official].sort((a,b)=>a.start-b.start);
let core='',cursor=0;
for(const node of extracted){core+=appSource.slice(cursor,node.start);cursor=node.end}
core+=appSource.slice(cursor);
core=core.replace('const storedState=localStorage.getItem("evidenta-training");','const storedState=window.TRAINING_STATE_HYDRATED?JSON.stringify(window.TRAINING_STATE_HYDRATED):localStorage.getItem("evidenta-training");');
core=core.replace("if(id==='mistakes')renderMistakes();if(id==='legislation')renderLegislation();if(id==='interview')renderInterview()","if(id==='mistakes'&&typeof renderMistakes==='function')renderMistakes()")
  .replace('$("#interview-simulation-start").onclick=startInterviewSimulation;$("#interview-category").onchange=renderInterview;$("#interview-difficulty").onchange=renderInterview;$("#interview-search").oninput=renderInterview;', '$("#interview-simulation-start").onclick=()=>window.TRAINING_LAZY_LOADER?.ensureView("interview").then(()=>startInterviewSimulation());$("#interview-category").onchange=()=>window.TRAINING_LAZY_LOADER?.ensureView("interview").then(()=>renderInterview());$("#interview-difficulty").onchange=()=>window.TRAINING_LAZY_LOADER?.ensureView("interview").then(()=>renderInterview());$("#interview-search").oninput=()=>window.TRAINING_LAZY_LOADER?.ensureView("interview").then(()=>renderInterview());');
const persistencePattern='localStorage.setItem("evidenta-training",JSON.stringify(state))';
core=core.split(persistencePattern).join('window.TRAINING_PERSISTENCE?.queue(state)');
core=core.replace(
  "$$('[data-exam-answer]').forEach(b=>b.onclick=()=>{examAnswers[q.id]=Number(b.dataset.examAnswer);renderExam()});",
  () => "$$('[data-exam-answer]').forEach(b=>b.onclick=()=>{examAnswers[q.id]=Number(b.dataset.examAnswer);$$('[data-exam-answer]').forEach(x=>x.classList.toggle('selected',x===b))});"
);

function controllerSource(name,nodes){
  let source=nodes.map(node=>appSource.slice(node.start,node.end)).join('\n');
  source=source.split(persistencePattern).join('window.TRAINING_PERSISTENCE?.queue(state)');
  return `${source}\nwindow.TRAINING_CONTROLLER_${name.toUpperCase()}=true;`;
}
function minify(code){return transformSync(code,{loader:'js',target:'es2020',minifyWhitespace:true,minifySyntax:true,minifyIdentifiers:false,legalComments:'none'}).code.trim()}
function runtimeCode(file){
  let code=fs.readFileSync(file,'utf8');
  if(file==='fast-loader.js')code=code.replace('await script("omj2188-training.js")','await script("synthesis-session.js");await script("omj2188-training.js")');
  return code;
}
fs.mkdirSync('generated/controllers',{recursive:true});
fs.writeFileSync('generated/app-core.js',minify(core));
for(const [name,nodes] of Object.entries(groups))fs.writeFileSync(`generated/controllers/${name}.js`,minify(controllerSource(name,nodes)));
fs.writeFileSync('generated/function-inventory.json',JSON.stringify({core:inventory.filter(name=>!Object.values(groups).flat().some(node=>node.id.name===name)),controllers:Object.fromEntries(Object.entries(groups).map(([name,nodes])=>[name,nodes.map(node=>node.id.name)]))},null,2));
const runtimeSources=['generated/app-core.js','adaptive-index.js','list-windowing.js','perf-telemetry.js','runtime-performance.js','mobile-nav.js','fast-loader.js'];
const banner='/* GENERATED FILE — split/minified runtime; edit source files, not this bundle. */\n';
const runtime=banner+runtimeSources.map(file=>`/* ${file} */\n${minify(runtimeCode(file))}\n;`).join('\n');
fs.writeFileSync('generated/runtime-bundle.js',runtime);
console.log(`Generated split runtime. app.js=${appSource.length} bytes, core=${fs.statSync('generated/app-core.js').size} bytes, runtime=${fs.statSync('generated/runtime-bundle.js').size} bytes.`);
