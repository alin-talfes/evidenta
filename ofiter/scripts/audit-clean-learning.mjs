import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const app = read("app.js");
const runtime = read("generated/runtime-bundle.js");
const sessions = ["synthesis-session.js", "omj2188-session.js"]
  .map(read)
  .join("\n");

const forbiddenDashboardIds = [
  "progress-value",
  "progress-bar",
  "correct-value",
  "answered-value",
  "streak-value",
  "review-value",
  "accuracy-value",
  "exam-quiz-progress",
  "exam-synthesis-progress",
  "exam-calculation-progress"
];

for (const id of forbiddenDashboardIds) {
  if (html.includes(`id="${id}"`)) throw new Error(`Indicator inutil rămas în dashboard: ${id}`);
}

if (!html.includes('href="clean-learning.css"')) throw new Error("Lipsește stratul CSS pentru interfața simplificată.");
for (const asset of ['styles.css?v=2', 'data-core.js?v=2', 'bootstrap.js?v=3']) {
  if (!html.includes(asset)) throw new Error(`Resursa critică nu are versiune pentru invalidarea cache-ului: ${asset}`);
}
const moduleViews = ["quiz", "synthesis", "calculations", "mistakes", "exam", "legislation", "official", "interview"];
for (const view of moduleViews) {
  if (!html.includes(`class="learning-module-card" type="button" data-go="${view}"`)) throw new Error(`Modul absent din dashboard: ${view}`);
  if (!html.includes(`id="${view}" class="view`)) throw new Error(`Ecran absent pentru modulul: ${view}`);
  if (!html.includes(`class="nav-item" data-view="${view}"`)) throw new Error(`Navigare laterală absentă pentru modulul: ${view}`);
}
if ((html.match(/class="learning-module-card"/g) || []).length !== 8) throw new Error("Dashboardul trebuie să afișeze exact 8 module, cu bibliografia inclusă în Legislație.");
if (html.includes('data-view="bibliography"') || html.includes('data-go="bibliography"') || html.includes('id="bibliography"')) throw new Error("Modulul Bibliografie nu a fost eliminat sau redirecționat spre Legislație.");
if (!html.includes("Deschide forma oficială consolidată")) throw new Error("Instrucțiunea pentru accesarea formei oficiale lipsește din Legislație.");
for (const asset of ["clean-learning.css", "bootstrap.js", "access-gate.js", "generated/runtime-bundle.js"]) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Resursă obligatorie absentă: ${asset}`);
}
const sw = read("sw.js");
if (!sw.includes('fetch(request,{cache:"no-store"})')) throw new Error("Navigarea trebuie să folosească rețeaua înaintea cache-ului, pentru a evita dashboarduri vechi.");
if (!sw.includes('evidenta-ofiter-generated-v14')) throw new Error("Cache-ul dataseturilor legislative nu a fost invalidat.");
if (!sw.includes('./generated/controllers/legislation.js?v=3')) throw new Error("Service worker-ul trebuie să precache-uiască exact controllerul Legislație cerut de runtime.");
if (!sw.includes('./legislation-virtual.js?v=2')) throw new Error("Service worker-ul trebuie să precache-uiască exact rendererul virtual Legislație cerut de runtime.");
const bootstrap = read("bootstrap.js");
if (!bootstrap.includes("updateViaCache:'none'")) throw new Error("Actualizarea service worker-ului poate fi blocată de cache.");
if (!bootstrap.includes('generated/runtime-bundle.js?v=3')) throw new Error("Pachetul principal trebuie încărcat cu versiune explicită.");
const removedStudyModuleSources = [html, read("mobile-nav.js"), read("fast-loader.js"), runtime].join("\n");
for (const marker of ['data-view="learn"', 'data-go="learn"', 'id="learn"', 'view:"learn"', 'label:"Fișe"', 'label:"Fi\\u0219e"']) {
  if (removedStudyModuleSources.includes(marker)) throw new Error(`Traseu rezidual către modulul Fișe: ${marker}`);
}
const coreData = read("data-core.js");
const officialUrls = [...coreData.matchAll(/url:"(https:\/\/legislatie\.just\.ro\/Public\/DetaliiDocument(?:Afis)?\/\d+)"/g)].map(match => match[1]);
if (officialUrls.length !== 7) throw new Error("Fiecare dintre cele 7 acte trebuie să aibă link oficial către Portalul Legislativ.");
if (!officialUrls.includes("https://legislatie.just.ro/Public/DetaliiDocumentAfis/255745")) throw new Error("Linkul OMJ nr. 2188/C/2022 trebuie să deschidă Instrucțiunile oficiale.");
const legislationController = read("generated/controllers/legislation.js");
for (const marker of ["DELIMITARE DIN BIBLIOGRAFIE", "legal-scope", "Deschide forma oficială consolidată", "catalog=laws.map", "laws.forEach", "initLegislationController", "queueMicrotask(initLegislationController)"]) {
  if (!legislationController.includes(marker)) throw new Error(`Informație absentă din modulul combinat: ${marker}`);
}
if (!legislationController.includes('law.id==="omj2188"?"sinteza"')) throw new Error("OMJ nr. 2188/C/2022 nu este inclus explicit în catalogul Legislație.");
const legislationData = JSON.parse(read("generated/legislation-data.json"));
if (!Array.isArray(legislationData) || legislationData.length < 6) throw new Error("Datasetul Legislație este gol sau incomplet.");
for (const id of ["l254", "cp", "cpp", "hg157", "l145", "cod"]) {
  if (!legislationData.some(act => act.id === id && Array.isArray(act.articles))) throw new Error(`Datasetul Legislație nu conține actul integrat ${id}.`);
}
const virtualLegislation = read("legislation-virtual.js");
for (const marker of ["catalog=laws.map", "DELIMITARE DIN BIBLIOGRAFIE", "legal-scope", "Deschide forma oficială consolidată", 'law.id==="omj2188"?"sinteza"']) {
  if (!virtualLegislation.includes(marker)) throw new Error(`Afișarea virtualizată poate suprascrie modulul combinat: ${marker}`);
}
if (html.includes('class="stats-grid"')) throw new Error("Cardurile de progres general sunt încă prezente.");
if (html.includes('class="panel focus-panel"')) throw new Error("Panoul de gamificare al sesiunii este încă prezent.");
if (app.includes('class="module-progress"') || runtime.includes('class="module-progress"')) throw new Error("Barele de progres ale bibliografiei sunt încă generate.");
if (app.includes('<div class="progress">') || runtime.includes('<div class="progress">')) throw new Error("Bara de progres a grilelor este încă generată.");
if (sessions.includes('<div class="progress">')) throw new Error("Bara procentuală a sesiunii de sinteză este încă generată.");

console.log("Clean learning UI audit passed.");
