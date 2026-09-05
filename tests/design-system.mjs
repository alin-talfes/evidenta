import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(testDir);
const read = relative => fs.readFileSync(path.join(repoDir, relative), "utf8");

const design = read("css/design-system.css");
const consistency = read("css/consistency.css");
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
  ".page-heading",
  ".section-heading",
  ".learning-module-card",
  ".section-hub-card",
  ".upload-zone",
  ".benchmark-drop",
  ".access-card",
  "@media (max-width: 620px)"
]) {
  assert.ok(consistency.includes(marker), `Stratul de consistență trebuie să conțină ${marker}`);
}
assert.ok(consistency.includes("var(--ev-surface)"), "Consistența trebuie să folosească suprafețele din design system");
assert.ok(consistency.includes("var(--ev-border)"), "Consistența trebuie să folosească bordurile din design system");
assert.ok(consistency.includes("var(--ev-accent)"), "Consistența trebuie să folosească accentul comun");

assert.ok(themeController.includes("const THEME_STORAGE_KEY = 'evidenta-theme'"), "Tema trebuie salvată într-o singură cheie universală");
assert.ok(themeController.includes("'anpTheme'"), "Controllerul trebuie să migreze cheia veche a nucleului");
assert.ok(themeController.includes("'descriere-semnalmente-theme'"), "Controllerul trebuie să migreze cheia veche Semnalmente");
assert.ok(themeController.includes("document.documentElement.dataset.theme"), "Tema universală trebuie aplicată pe elementul html");
assert.ok(themeController.includes("classList.toggle('light'"), "Tema universală trebuie să suporte clasele light existente");
assert.ok(themeController.includes("classList.toggle('dark'"), "Tema universală trebuie să suporte clasele dark existente");
assert.ok(themeController.includes("window.addEventListener('storage'"), "Tema trebuie sincronizată între filele deschise");

const visualEntries = {
  "nucleu și Transfer": read("css/style.css"),
  "Instructaj": read("instructaj/styles.css"),
  "Semnalmente și Benchmark": read("semnalmente/style.css"),
  "Ofițer": read("ofiter/styles.css")
};

for (const [module, source] of Object.entries(visualEntries)) {
  assert.ok(source.includes("design-system.css"), `${module} trebuie să încarce design-system.css`);
  assert.ok(source.includes("unified-shell.css"), `${module} trebuie să încarce unified-shell.css`);
  assert.ok(source.includes("visual-audit.css"), `${module} trebuie să încarce visual-audit.css`);
  assert.ok(source.includes("consistency.css"), `${module} trebuie să încarce consistency.css`);
  assert.ok(
    source.lastIndexOf("consistency.css") > source.lastIndexOf("visual-audit.css"),
    `${module} trebuie să încarce consistency.css după auditul vizual`
  );
}

const themeBridges = {
  "Instructaj": read("instructaj/app.js"),
  "Semnalmente": read("semnalmente/enhancements.js"),
  "Semnalmente Benchmark": read("semnalmente/benchmark.html"),
  "Ofițer": read("ofiter/access-gate.js")
};
for (const [module, source] of Object.entries(themeBridges)) {
  assert.ok(source.includes("theme.js"), `${module} trebuie să încarce controllerul universal de temă`);
}
assert.ok(read("semnalmente/enhancements.js").includes("const THEME_KEY = 'evidenta-theme'"), "Semnalmente trebuie să folosească direct cheia universală");

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

  if (["index.html", "contopiri.html", "transfer/index.html", "transfer/rules.html"].includes(relativePath)) {
    return /(?:\.\.\/)?js\/theme\.js/.test(html);
  }

  if (relativePath === "instructaj/index.html") return html.includes("audit-enhancements.css");
  if (relativePath === "semnalmente/index.html") return html.includes("enhancements.js");
  if (relativePath === "semnalmente/benchmark.html") return html.includes("benchmark.css");
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

console.log(`Design system: ${htmlFiles.length} pagini HTML folosesc aceeași temă, același shell și același strat structural.`);
