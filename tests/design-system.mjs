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
  "--surface: var(--ev-surface)",
  "--text: var(--ev-text)",
  "--accent: var(--ev-accent)",
  "--line: var(--ev-border)",
  "--navy: var(--ev-text)",
  "--violet: var(--ev-accent)"
]) {
  assert.ok(design.includes(compatibilityToken), `Lipsește aliasul de compatibilitate: ${compatibilityToken}`);
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

const instructajCss = read("instructaj/audit-enhancements.css");
assert.ok(instructajCss.includes('.section-hub-card[data-view="glosar"]'), "Glosarul trebuie eliminat din meniul principal de categorii");
assert.ok(instructajCss.includes('content: "Fundamente juridice și glosar"'), "Categoria Fundamente trebuie să includă explicit glosarul");
assert.ok(instructajCss.includes(".course-nav"), "Navigarea duplicată din hero trebuie dezactivată");
assert.ok(instructajCss.includes(".hero-panel .hero-actions"), "Butoanele duplicate din hero trebuie dezactivate");
assert.ok(instructajCss.includes('aria-labelledby="glosar-heading"'), "Glosarul trebuie afișat împreună cu Fundamentele juridice");

const corePages = [
  "index.html",
  "contopiri.html",
  "termene.html",
  "transfer/index.html",
  "transfer/rules.html"
];
for (const page of corePages) {
  const html = read(page);
  assert.ok(/(?:\.\.\/)?js\/theme\.js/.test(html), `${page} trebuie să folosească js/theme.js pentru design system și temă`);
}

assert.ok(read("instructaj/index.html").includes("audit-enhancements.css"), "Instructaj trebuie să păstreze bridge-ul CSS comun");
assert.ok(read("semnalmente/index.html").includes("enhancements.js"), "Semnalmente trebuie să încarce bridge-ul comun din enhancements.js");
assert.ok(read("semnalmente/benchmark.html").includes("benchmark.css"), "Benchmark trebuie să încarce bridge-ul comun din benchmark.css");
assert.ok(read("ofiter/index.html").includes("clean-learning.css"), "Ofițer trebuie să încarce ultimul strat CSS comun");

console.log("Design system și navigare Instructaj: verificări trecute.");
