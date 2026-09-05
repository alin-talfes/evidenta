import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(moduleDir);
const source = fs.readFileSync(path.join(moduleDir, "data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const data = context.window.INSTRUCTAJ_DATA;

assert.ok(data, "Setul de date trebuie să existe");
assert.equal(data.verifiedAt, "03.09.2026");
assert.equal(data.workflows.length, 23, "Sunt necesare toate cele 23 de fișe operaționale");
assert.equal(new Set(data.workflows.map(item => item.id)).size, data.workflows.length, "ID-urile trebuie să fie unice");

const dataSources = { omj: "255745", l254: "269415", hg157: "269789", cp: "109855", cpp: "120609" };
const canonicalPageSources = { omj: "255630", l254: "150699", hg157: "177386", cp: "109855", cpp: "120609" };
assert.deepEqual([...data.sources.map(item => item.id)].sort(), Object.keys(dataSources).sort(), "Trebuie publicate toate cele cinci surse normative");
for (const item of data.sources) {
  assert.equal(item.verifiedAt, data.verifiedAt, `Data verificării pentru ${item.id}`);
  assert.ok(item.url.startsWith("https://legislatie.just.ro/"), `Sursă oficială pentru ${item.id}`);
  assert.ok(item.url.includes(dataSources[item.id]), `Document oficial corect pentru ${item.id}`);
}

for (const workflow of data.workflows) {
  assert.ok(data.categories.includes(workflow.category), `Categorie validă pentru ${workflow.id}`);
  assert.ok(workflow.legal.some(item => item.includes("OMJ nr. 2.188/C/2022")), `Temei OMJ pentru ${workflow.id}`);
  assert.ok(workflow.steps.length >= 5, `Minimum 5 pași pentru ${workflow.id}`);
  assert.ok(workflow.checks.length >= 3, `Minimum 3 verificări pentru ${workflow.id}`);
  assert.ok(workflow.pitfalls.length >= 2, `Minimum 2 erori frecvente pentru ${workflow.id}`);
  assert.ok(workflow.responsible.length > 20, `Responsabil explicat pentru ${workflow.id}`);
  assert.ok(workflow.documents.length >= 3, `Documente necesare pentru ${workflow.id}`);
  assert.ok(workflow.deadline.length > 15, `Moment-limită pentru ${workflow.id}`);
  assert.ok(workflow.result.length > 20, `Rezultat verificabil pentru ${workflow.id}`);
  assert.ok(workflow.legalRules.length >= 1, `Regula legală separată pentru ${workflow.id}`);
  assert.ok(workflow.stop.length > 20, `Condiție de oprire pentru ${workflow.id}`);
  assert.ok(workflow.practice.length > 15, `Recomandare practică separată pentru ${workflow.id}`);
}

const mustContain = {
  "primire-condamnat": ["Legea nr. 254/2013: art. 43", "HG nr. 157/2016: art. 97"],
  "liberare-conditionata": ["Legea nr. 254/2013: art. 95–97", "HG nr. 157/2016: art. 204–207", "CPP: art. 587"],
  "stabilire-regim": ["Legea nr. 254/2013: art. 30–39", "HG nr. 157/2016:"],
  "schimbare-regim": ["Legea nr. 254/2013: art. 32 și 40–42", "HG nr. 157/2016: art. 91–93"],
  "transfer-anp": ["Legea nr. 254/2013: art. 45", "HG nr. 157/2016: art. 108"],
  "punere-libertate": ["Legea nr. 254/2013: art. 53", "HG nr. 157/2016: art. 116"],
  "intrerupere": ["CPP: art. 592–594"],
  "primire-arest-preventiv": ["Legea nr. 254/2013: art. 115 și 120–123", "CPP: art. 230"],
  "primire-minor": ["Legea nr. 254/2013: art. 135–136 și 156", "CPP: art. 514–515"],
  "comisie-minor": ["CPP: art. 516–517", "HG nr. 157/2016: art. 337"],
  "schimbari-minor": ["CPP: art. 346 alin. (3) și 516–519", "HG nr. 157/2016: art. 301, 304 și 337–340"],
  "dosar-consultare": ["Legea nr. 254/2013: art. 60", "HG nr. 157/2016: art. 127"]
};
for (const [id, refs] of Object.entries(mustContain)) {
  const legal = data.workflows.find(item => item.id === id).legal.join(" | ");
  for (const ref of refs) assert.ok(legal.includes(ref), `${id} trebuie să includă ${ref}`);
}

assert.ok(data.glossary.length >= 45, "Glosarul trebuie să acopere amplu termenii juridici de lucru");
for (const term of [
  "Act executoriu",
  "Citație",
  "Contestație la executare",
  "Contopirea pedepselor",
  "Hotărâre definitivă",
  "Liberare condiționată",
  "Mandat de executare a pedepsei închisorii (MEPI)",
  "Pedeapsă accesorie",
  "Pedeapsă complementară",
  "Recidivă",
  "Temei de deținere"
]) {
  assert.ok(data.glossary.some(item => item.term === term && item.meaning.length > 60), `Glosarul trebuie să explice: ${term}`);
}
const transferSupplement = fs.readFileSync(path.join(moduleDir, "verificare-dosar-transfer.js"), "utf8");
assert.ok(transferSupplement.includes('title: "Verificarea dosarului sosit prin transfer"'), "Fișa transfer trebuie să aibă titlul curat");
assert.ok(!transferSupplement.includes('MĂSURĂ — Verificarea dosarului sosit prin transfer'), "Prefixul MĂSURĂ trebuie eliminat din titlu");

const html = fs.readFileSync(path.join(moduleDir, "index.html"), "utf8");
const app = fs.readFileSync(path.join(moduleDir, "app.js"), "utf8");
const styles = fs.readFileSync(path.join(moduleDir, "styles.css"), "utf8");
const stylesLegacy = fs.readFileSync(path.join(moduleDir, "styles-legacy.css"), "utf8");
const enhancements = fs.readFileSync(path.join(moduleDir, "audit-enhancements.css"), "utf8");

for (const file of ["styles.css", "audit-enhancements.css", "data.js", "app.js"]) {
  assert.ok(html.includes(file), `${file} este încărcat`);
}

for (const documentId of Object.values(canonicalPageSources)) {
  assert.ok(html.includes(documentId), `Pagina trebuie să publice sursa canonică oficială ${documentId}`);
}
for (const staleDocumentId of ["269415", "269789", "120611"]) {
  assert.ok(!html.includes(staleDocumentId), `Pagina nu trebuie să păstreze linkul vechi/intermediar ${staleDocumentId}`);
}
assert.ok(html.includes("forma consolidată la zi"), "Pagina trebuie să indice explicit că trimiterile sunt către forma consolidată la zi");

assert.ok(html.includes('id="fundamente"'), "Pagina principală trebuie să conțină secțiunea de fundamente juridice");
for (const term of [
  "Sentință penală, decizie penală și încheiere",
  "Când rămâne definitivă o sentință penală?",
  "mandatul de executare a pedepsei închisorii",
  "Ce este o citație?",
  "Zile deduse",
  "Liberarea la termen",
  "Liberarea condiționată",
  "Legea nr. 169/2017"
]) {
  assert.ok(html.includes(term), `Fundamentele juridice trebuie să includă: ${term}`);
}
for (const historicalDocumentId of ["191305", "221138"]) {
  assert.ok(html.includes(historicalDocumentId), `Sursa istorică oficială ${historicalDocumentId} trebuie publicată`);
}

/* Regresii juridice rezultate din auditul din 04.09.2026. */
for (const legalCorrection of [
  "sentința poate deveni definitivă direct",
  "Contestația există numai acolo unde legea o prevede expres",
  "art. 259 alin. (7) CPP",
  "pentru aceeași infracțiune",
  "art. 100 alin. (3)–(4)",
  "minim de pedeapsă efectiv executată",
  "fostul art. 55¹ alin. (1), (3) și (8)",
  "orice altă dată stabilită de organul judiciar competent"
]) {
  assert.ok(html.includes(legalCorrection), `Corecția juridică trebuie păstrată: ${legalCorrection}`);
}

/* UI learning fără checklist și fără progres. */
for (const jsFeature of ["normalizeLearningUi", "study-steps", "step-number", "Material de studiu · fără bifare", "Deschide fișa"]) {
  assert.ok(app.includes(jsFeature), `Aplicația trebuie să includă prezentarea statică de studiu: ${jsFeature}`);
}
for (const forbiddenJs of ["localStorage", "renderLearningProgress", "card-progress", "detail-progress", "data-step", "type=\"checkbox\""]) {
  assert.ok(!app.includes(forbiddenJs), `JS nu trebuie să păstreze logică de checklist/progres: ${forbiddenJs}`);
}
for (const cssFeature of [".fraction-grid", "@media (max-width: 650px)", "prefers-reduced-motion"]) {
  assert.ok(stylesLegacy.includes(cssFeature), `CSS learning trebuie să includă ${cssFeature}`);
}
for (const removedLegacySelector of [".course-nav", ".hero-panel", ".progress-summary"]) {
  assert.ok(!stylesLegacy.includes(removedLegacySelector), `CSS legacy nu trebuie să reintroducă ${removedLegacySelector}`);
}
for (const enhancement of ["#learning-progress", "#reset-progress", ".study-guide", ".study-sequence", ".study-steps"]) {
  assert.ok(enhancements.includes(enhancement), `Stratul CSS fără checklist trebuie să includă ${enhancement}`);
}
assert.ok(enhancements.includes("display: none !important"), "UI-ul vechi de progres trebuie ascuns înainte de inițializarea JS");

const linkExtensions = new Set([".html", ".htm", ".md", ".js", ".json", ".xml"]);
const forbiddenLink = /(?:href|src|content\s*=|location\.(?:href|replace)|Response\.redirect)[^\n>]*(?:\/ofiter\/?|\.\.\/ofiter\/|evidenta\/ofiter)/i;
function inspectPublicFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "ofiter" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) inspectPublicFiles(full);
    else if (linkExtensions.has(path.extname(entry.name))) {
      assert.ok(!forbiddenLink.test(fs.readFileSync(full, "utf8")), `Nu este permis un link spre /ofiter în ${path.relative(repoDir, full)}`);
    }
  }
}
inspectPublicFiles(repoDir);
assert.ok(!fs.existsSync(path.join(repoDir, "training", "index.html")), "Ruta veche /training nu trebuie să redirecționeze spre /ofiter");

console.log("Instructaj: conținut juridic, UI learning fără checklist/progres, surse canonice și izolare /ofiter validate.");
