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
const moduleViews = ["quiz", "synthesis", "calculations", "mistakes", "exam", "bibliography", "legislation", "official", "interview"];
for (const view of moduleViews) {
  if (!html.includes(`class="learning-module-card" type="button" data-go="${view}"`)) throw new Error(`Modul absent din dashboard: ${view}`);
  if (!html.includes(`id="${view}" class="view`)) throw new Error(`Ecran absent pentru modulul: ${view}`);
  if (!html.includes(`class="nav-item" data-view="${view}"`)) throw new Error(`Navigare laterală absentă pentru modulul: ${view}`);
}
if ((html.match(/class="learning-module-card"/g) || []).length !== 9) throw new Error("Dashboardul trebuie să afișeze exact 9 module de învățare.");
for (const asset of ["clean-learning.css", "bootstrap.js", "access-gate.js", "generated/runtime-bundle.js"]) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Resursă obligatorie absentă: ${asset}`);
}
const sw = read("sw.js");
if (!sw.includes('fetch(request,{cache:"no-store"})')) throw new Error("Navigarea trebuie să folosească rețeaua înaintea cache-ului, pentru a evita dashboarduri vechi.");
if (!read("bootstrap.js").includes("updateViaCache:'none'")) throw new Error("Actualizarea service worker-ului poate fi blocată de cache.");
if (html.includes('class="stats-grid"')) throw new Error("Cardurile de progres general sunt încă prezente.");
if (html.includes('class="panel focus-panel"')) throw new Error("Panoul de gamificare al sesiunii este încă prezent.");
if (app.includes('class="module-progress"') || runtime.includes('class="module-progress"')) throw new Error("Barele de progres ale bibliografiei sunt încă generate.");
if (app.includes('<div class="progress">') || runtime.includes('<div class="progress">')) throw new Error("Bara de progres a grilelor este încă generată.");
if (sessions.includes('<div class="progress">')) throw new Error("Bara procentuală a sesiunii de sinteză este încă generată.");

console.log("Clean learning UI audit passed.");
