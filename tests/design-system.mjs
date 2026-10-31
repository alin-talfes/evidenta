import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(testDir);
const read = relative => fs.readFileSync(path.join(repoDir, relative), "utf8");

const design = read("css/design-system.css");
const finalLayer = read("css/final-layer.css");
const themeController = read("js/theme.js");

for (const token of [
  "--ev-bg:",
  "--ev-surface:",
  "--ev-text:",
  "--ev-accent:",
  "--ev-success:",
  "--ev-warning:",
  "--ev-danger:",
  "--ev-border:",
  "--ev-radius-lg:",
  "--ev-shadow-soft:"
]) {
  assert.ok(design.includes(token), `Design system-ul trebuie să definească ${token}`);
}

for (const compatibilityToken of [
  "--bg: var(--ev-bg)",
  "--bg-soft: var(--ev-bg-elevated)",
  "--surface: var(--ev-surface)",
  "--surface-strong: var(--ev-surface-2)",
  "--text: var(--ev-text)",
  "--accent: var(--ev-accent)",
  "--cyan: var(--ev-accent)",
  "--line: var(--ev-border)",
  "--gold: var(--ev-warning)",
  "--violet: var(--ev-accent)"
]) {
  assert.ok(design.includes(compatibilityToken), `Lipsește aliasul de compatibilitate: ${compatibilityToken}`);
}

for (const sharedComponent of [
  ".topbar,",
  ".sidebar,",
  ".workflow-card,",
  ".question-card,",
  ".learning-module-card,",
  ".access-card,",
  ".reference-grid > article,",
  ".btn-primary,"
]) {
  assert.ok(design.includes(sharedComponent), `Stratul vizual comun trebuie să normalizeze ${sharedComponent}`);
}

assert.ok(design.includes('html[data-theme="light"]'), "Design system-ul trebuie să suporte tema light folosită de Semnalmente");
assert.ok(design.includes("body.light"), "Design system-ul trebuie să suporte tema light folosită de nucleul aplicației");
assert.ok(design.includes("prefers-reduced-motion"), "Design system-ul trebuie să respecte reduced motion");

for (const marker of [
  "--ev-page-gap:",
  "--ev-panel-pad:",
  "body.ev-unified",
  ".upload-zone",
  ".benchmark-drop",
  ".access-card",
  ".ev-shell__menu",
  ".ev-optional-tools",
  ".ev-validation-summary",
  ".ev-result-overview",
  ".ev-match-why",
  ".ev-anexa-tabs",
  ".ev-verification-banner",
  ".learning-cockpit",
  ".ev-officer-mobile-nav"
]) {
  assert.ok(finalLayer.includes(marker), `Stratul structural consolidat trebuie să conțină ${marker}`);
}
assert.ok(finalLayer.includes("var(--ev-surface)"), "Stratul final trebuie să folosească suprafețele din design system");
assert.ok(finalLayer.includes("var(--ev-border)"), "Stratul final trebuie să folosească bordurile din design system");
assert.ok(finalLayer.includes("var(--ev-accent"), "Stratul final trebuie să folosească accentul comun");
assert.ok(!fs.existsSync(path.join(repoDir, "css/consistency.css")), "consistency.css trebuie eliminat după consolidarea în final-layer.css");
assert.ok(!fs.existsSync(path.join(repoDir, "css/hotfix.css")), "hotfix.css trebuie eliminat după consolidarea în final-layer.css");
assert.ok(!fs.existsSync(path.join(repoDir, "css/ux-upgrades.css")), "ux-upgrades.css trebuie eliminat după consolidarea în final-layer.css");

assert.ok(themeController.includes("const THEME_STORAGE_KEY = 'evidenta-theme'"), "Tema trebuie salvată într-o singură cheie universală");
assert.ok(themeController.includes("const THEME_MODE_STORAGE_KEY = 'evidenta-theme-mode'"), "Preferința sistem/luminos/întunecat trebuie păstrată separat de tema rezolvată");
assert.ok(themeController.includes("function validThemeMode(value)"), "Controllerul trebuie să valideze cele trei moduri de temă");
assert.ok(themeController.includes("function resolveTheme(mode = readThemeMode())"), "Tema sistemului trebuie rezolvată prin preferința OS");
assert.ok(themeController.includes("handleSystemThemeChange"), "Modul Sistem trebuie să urmărească schimbările de temă ale sistemului de operare");

assert.ok(themeController.includes("'anpTheme'"), "Controllerul trebuie să migreze cheia veche a nucleului");
assert.ok(themeController.includes("'descriere-semnalmente-theme'"), "Controllerul trebuie să migreze cheia veche Semnalmente");
assert.ok(themeController.includes("document.documentElement.dataset.theme"), "Tema universală trebuie aplicată pe elementul html");
assert.ok(themeController.includes("classList.toggle('light'"), "Tema universală trebuie să suporte clasele light existente");
assert.ok(themeController.includes("classList.toggle('dark'"), "Tema universală trebuie să suporte clasele dark existente");
assert.ok(themeController.includes("window.addEventListener('storage'"), "Tema trebuie sincronizată între filele deschise");

const visualEntries = {
  "nucleu și Transfer": read("css/style.css"),
  "Instructaj": read("instructaj/styles.css"),
  "Semnalmente și Benchmark": `${read("semnalmente/index.html")}\n${read("semnalmente/style.css")}`,
  "Ofițer": read("ofiter/styles.css")
};

for (const [module, source] of Object.entries(visualEntries)) {
  assert.ok(source.includes("design-system.css"), `${module} trebuie să încarce design-system.css`);
  assert.ok(source.includes("unified-shell.css"), `${module} trebuie să încarce unified-shell.css`);
  assert.ok(source.includes("visual-audit.css"), `${module} trebuie să încarce visual-audit.css`);
  assert.ok(source.includes("final-layer.css"), `${module} trebuie să încarce final-layer.css`);
  assert.ok(
    source.lastIndexOf("final-layer.css") > source.lastIndexOf("visual-audit.css"),
    `${module} trebuie să încarce final-layer.css după auditul vizual`
  );
  for (const legacy of ["consistency.css", "hotfix.css", "ux-upgrades.css"]) {
    assert.ok(!new RegExp(`@import\\s+url\\([^)]*${legacy.replace('.', '\\.')}[^)]*\\)`, 'i').test(source), `${module} nu trebuie să mai încarce activ ${legacy}`);
  }
}

const themeBridges = {
  "Instructaj": read("instructaj/app.js"),
  "Semnalmente": read("semnalmente/index.html"),
  "Semnalmente Benchmark": read("semnalmente/benchmark/index.html"),
  "Ofițer": read("ofiter/access-gate.js")
};
for (const [module, source] of Object.entries(themeBridges)) {
  assert.ok(source.includes("theme.js"), `${module} trebuie să încarce controllerul universal de temă`);
}
assert.ok(!read("semnalmente/enhancements.js").includes("const THEME_KEY"), "Semnalmente nu trebuie să dubleze cheia controllerului universal de temă");

function walk(directory) {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...walk(absolute));
    else found.push(absolute);
  }
  return found;
}

const htmlFiles = walk(repoDir)
  .filter(file => file.endsWith(".html"))
  .map(file => path.relative(repoDir, file).split(path.sep).join("/"))
  .sort();

assert.ok(htmlFiles.length >= 9, "Auditul trebuie să identifice toate paginile HTML actuale ale repo-ului");

function isCoveredByDesignSystem(relativePath, html) {
  if (html.includes("design-system.css")) return true;

  if (["index.html", "contopiri/index.html", "transfer/index.html", "transfer/rules/index.html", "transfer/comisie.html", "transfer/comisie/index.html"].includes(relativePath)) {
    return /(?:\.\.\/)?js\/theme\.js/.test(html);
  }

  if (relativePath === "instructaj/index.html") return html.includes("audit-enhancements.css");
  if (relativePath === "semnalmente/index.html") return html.includes("enhancements.js");
  if (relativePath === "semnalmente/benchmark/index.html") return html.includes("benchmark.css");
  if (relativePath === "ofiter/index.html") return html.includes("clean-learning.css");

  return false;
}

const uncoveredPages = htmlFiles.filter(relativePath => {
  const html = read(relativePath);
  return !isCoveredByDesignSystem(relativePath, html);
});

assert.deepEqual(
  uncoveredPages,
  [],
  `Orice pagină HTML trebuie conectată la design-system.css. Neacoperite: ${uncoveredPages.join(", ")}`
);

assert.ok(read("descriere-semnalmente/index.html").includes("design-system.css"), "Redirectul vechi Semnalmente trebuie să folosească direct design system-ul");
assert.ok(!fs.existsSync(path.join(repoDir, "termene.html")), "Pagina Termene trebuie eliminată din inventarul repo-ului");

const pedepseHtml = read("index.html");
assert.ok(pedepseHtml.includes('class="ev-page-intro"'), "Pedepse trebuie să aibă o introducere vizuală proprie");
assert.ok(pedepseHtml.includes('id="page-title"'), "Titlul principal Pedepse trebuie să fie semantic");
assert.ok(finalLayer.includes('.ev-page-intro__copy'), "Redesignul Pedepse trebuie să definească hero-ul");
assert.ok(finalLayer.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), "Modurile Pedepse trebuie să rămână într-o grilă adaptivă");
assert.ok(finalLayer.includes('@media (max-width: 640px)'), "Redesignul Pedepse trebuie să includă reguli mobile");

console.log(`Design system: ${htmlFiles.length} pagini HTML folosesc aceeași temă, același shell și stratul final consolidat.`);


const pedepseVisual = read("css/final-layer.css");
for (const marker of [
  "component refinement tranche",
  ".top-bar .btn-utility",
  "#deductionsContainer",
  ".ev-optional-tools__buttons",
  "#resultsCard .result-section",
  "@media (max-width: 760px)",
  "@media (prefers-reduced-motion: reduce)"
]) {
  assert.ok(pedepseVisual.includes(marker), `Redesignul operațional Pedepse trebuie să conțină ${marker}`);
}
assert.ok(pedepseHtml.includes('id="calcBtn"'), "Acțiunea principală de calcul trebuie păstrată");
assert.ok(pedepseHtml.includes('id="resultsCard"'), "Containerul rezultatelor trebuie păstrat");
assert.ok(pedepseHtml.includes('id="deductionsContainer"'), "Containerul deducerilor trebuie păstrat");


const contopiriHtml = read("contopiri/index.html");
assert.ok(contopiriHtml.includes('class="ev-module-intro"'), "Contopiri trebuie să aibă un titlu vizibil și semantic");
for (const marker of [
  'data-ev-page="contopiri"] .ev-module-intro',
  'data-ev-page="transfer"] .header',
  'data-ev-page="instructaj"] .hero',
  'data-ev-page^="semnalmente"] .workflow-step',
  'data-ev-page="ai"] #analyzeFilesBtn'
]) {
  assert.ok(finalLayer.includes(marker), `Stratul comun trebuie să includă rafinamentul vizual pentru ${marker}`);
}


const contopiriVisual = read("css/final-layer.css");
for (const marker of [
  "Contopiri — introducere pedeapsă",
  'data-ev-page="contopiri"] .penalty-row',
  'data-ev-page="contopiri"] .result-box',
  'data-ev-page="contopiri"] .legal-box h4',
  "@media (max-width: 380px)"
]) assert.ok(contopiriVisual.includes(marker), `Redesignul Contopiri trebuie să conțină ${marker}`);
assert.ok(read("contopiri/index.html").includes('id="penaltyRowsContainer"'), "Containerul pedepselor Contopiri trebuie păstrat");
assert.ok(read("contopiri/index.html").includes('id="mergeResult"'), "Containerul rezultantei Contopiri trebuie păstrat");


const transferVisual = read("css/final-layer.css");
for (const marker of [
  "Transfer — criterii de profilare",
  'data-ev-page="transfer"] .header',
  'data-ev-page="transfer"] .radio-btn:has(input:checked)',
  'data-ev-page="transfer"] #resultArea .empty-state',
  "@media (max-width: 380px)"
]) assert.ok(transferVisual.includes(marker), `Redesignul Transfer trebuie să conțină ${marker}`);
assert.ok(read("transfer/index.html").includes('id="transferForm"'), "Formularul Transfer trebuie păstrat");
assert.ok(read("transfer/index.html").includes('id="resultArea"'), "Zona de rezultate Transfer trebuie păstrată");


const moduleVisuals = read("css/final-layer.css");
for (const marker of [
  "Instructaj — traseu de învățare",
  'data-ev-page="instructaj"] .hero',
  "Semnalmente — upload states",
  'data-ev-page^="semnalmente"] .upload-zone',
  "AI Documente — secure local processing",
  'data-ev-page="ai"] .ai-review-grid',
  "@media (max-width: 760px)"
]) assert.ok(moduleVisuals.includes(marker), `Redesignul modulelor auxiliare trebuie să conțină ${marker}`);
assert.ok(read("instructaj/index.html").includes('id="learning-progress"'), "Progresul local din Instructaj trebuie păstrat");
assert.ok(read("semnalmente/index.html").includes('id="drop-frontal"'), "Zona de încărcare frontală trebuie păstrată");
assert.ok(read("ai/index.html").includes('id="analyzeFilesBtn"'), "Acțiunea de analiză AI trebuie păstrată");


for (const marker of [
  "Accesibilitate transversală",
  ":focus-visible",
  "[aria-disabled=\"true\"]",
  "@media (forced-colors: active)",
  "prefers-reduced-motion"
]) assert.ok(finalLayer.includes(marker), `Stratul final trebuie să includă suportul de accesibilitate ${marker}`);
