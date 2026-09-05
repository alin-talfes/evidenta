import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const health=read("data-health.js");
const sw=read("sw.js");
const core=read("generated/app-core.js");
const fast=read("fast-loader.js");
const official=JSON.parse(read("generated/official-data.json"));
const interview=JSON.parse(read("generated/interview-data.json"));
const legislation=JSON.parse(read("generated/legislation-data.json"));

for(const marker of [
  'const DIRECT_VIEWS=new Set(["interview","official","synthesis","calculations"])',
  "ensureInterviewDirect","ensureOfficialDirect","ensureSynthesisDirect","ensureCalculationsDirect",
  'generated/controllers/interview.js?v=2','generated/controllers/official.js?v=2',
  'exam-training.js?v=2','calculation-engine.js?v=2','calculation-age-cases.js?v=2',
  'lazy.ensureView=id=>DIRECT_VIEWS.has(id)?openDirectView(id):originalEnsureView(id)',
  'event.stopImmediatePropagation()','data-retry-direct'
]) if(!health.includes(marker)) throw new Error(`Ruta directă pentru modulele de conținut este incompletă: ${marker}`);

if(!health.includes('document.getElementById("synthesis-list")?.children.length')) throw new Error("Sinteza nu este verificată după randare.");
if(!health.includes('document.getElementById("calculation-list")?.children.length')) throw new Error("Spețele oficiale de calcul nu sunt verificate după randare.");
if(!health.includes('document.getElementById("official-sets")?.children.length')) throw new Error("Subiectele ANP nu sunt verificate după randare.");
if(!health.includes('document.getElementById("interview-list")?.children.length')) throw new Error("Spețele de interviu nu sunt verificate după randare.");

for(const marker of [
  'evidenta-ofiter-v113','./data-health.js?v=4','./generated/controllers/official.js?v=2','./generated/controllers/interview.js?v=2',
  './exam-training.js?v=2','./calculation-engine.js?v=2','./calculation-age-cases.js?v=2',
  '["2","3"].includes(url.searchParams.get("v"))','fetch("./data-health.js?v=4"'
]) if(!sw.includes(marker)) throw new Error(`Service worker-ul nu invalidează/precache-uiește corect modulele: ${marker}`);

for(const marker of ["function startQuiz(","function renderMistakes(","function startTimer(",'$("#exam-start").onclick=()=>startQuiz(null,!0)']) {
  if(!core.includes(marker)) throw new Error(`Motorul de bază Grile/Repetare/Simulare nu este disponibil direct în runtime: ${marker}`);
}

if(!fast.includes('if(id==="official")')||!fast.includes('if(id==="interview")')||!fast.includes('if(id==="synthesis")')||!fast.includes('if(id==="calculations")')) {
  throw new Error("Inventarul loaderului lazy nu mai corespunde modulelor auditate.");
}

if(!Array.isArray(interview)||!interview.length)throw new Error("Datasetul Interviu este gol.");
if(!official?.sets?.length||!official?.written?.length)throw new Error("Datasetul Subiecte ANP este gol.");
if(!Array.isArray(legislation)||!legislation.length)throw new Error("Datasetul Legislație este gol.");

console.log("Module loading audit passed: direct routes for Interview, Official, Synthesis and Calculations; Quiz/Review/Quick Exam remain core-runtime.");
