import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const runtime = fs.readFileSync("generated/runtime-bundle.js", "utf8");
const sessions = ["synthesis-session.js", "omj2188-session.js"]
  .map(file => fs.readFileSync(file, "utf8"))
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
for (const view of ["quiz", "synthesis", "calculations", "mistakes", "exam", "bibliography", "legislation", "official", "interview"]) {
  if (!html.includes(`class="learning-module-card" type="button" data-go="${view}"`)) throw new Error(`Modul absent din dashboard: ${view}`);
}
if ((html.match(/class="learning-module-card"/g) || []).length !== 9) throw new Error("Dashboardul trebuie să afișeze exact 9 module de învățare.");
if (html.includes('class="stats-grid"')) throw new Error("Cardurile de progres general sunt încă prezente.");
if (html.includes('class="panel focus-panel"')) throw new Error("Panoul de gamificare al sesiunii este încă prezent.");
if (app.includes('class="module-progress"') || runtime.includes('class="module-progress"')) throw new Error("Barele de progres ale bibliografiei sunt încă generate.");
if (app.includes('<div class="progress">') || runtime.includes('<div class="progress">')) throw new Error("Bara de progres a grilelor este încă generată.");
if (sessions.includes('<div class="progress">')) throw new Error("Bara procentuală a sesiunii de sinteză este încă generată.");

console.log("Clean learning UI audit passed.");
