import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.dirname(testDir);
const read = relative => fs.readFileSync(path.join(repoDir, relative), "utf8");

const design = read("css/design-system.css");

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

const bridges = {
  "nucleu aplicație": read("js/theme.js"),
  "Instructaj": read("instructaj/audit-enhancements.css"),
  "Semnalmente": read("semnalmente/enhancements.js"),
  "Semnalmente Benchmark": read("semnalmente/benchmark.css"),
  "Ofițer": read("ofiter/clean-learning.css")
};

for (const [module, source] of Object.entries(bridges)) {
  assert.ok(source.includes("design-system.css"), `${module} trebuie să încarce design-system.css`);
}

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

assert.ok(htmlFiles.length >= 10, "Auditul trebuie să identifice toate paginile HTML actuale ale repo-ului");

function isCoveredByDesignSystem(relativePath, html) {
  if (html.includes("design-system.css")) return true;

  if (["index.html", "contopiri.html", "termene.html", "transfer/index.html", "transfer/rules.html"].includes(relativePath)) {
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

console.log(`Design system: ${htmlFiles.length} pagini HTML sunt acoperite de aceeași bază vizuală.`);
