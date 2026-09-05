import fs from 'node:fs';
import postcss from 'postcss';

const targets = new Map([
  ['css/design-system.css', ['stat-card','study-card','status-chip','focus-number']],
  ['css/unified-shell.css', ['study-card']],
  ['css/visual-audit.css', ['study-card']],
  ['css/style-legacy.css', [
    'app-nav','app-nav__brand','app-nav__link','header','header-inner','header-actions','module-intro','themeToggle',
    'mt-3','help-inline','top-link','back-btn','back-link','result-area','regim-label','section-title','versionDisplay',
    'transfer-page-actions--theme-only','result-explanation'
  ]],
  ['instructaj/styles-legacy.css', [
    'site-header','app-nav','brand-mark','hero','hero-copy','lead','course-nav','hero-panel','hero-panel-head','status-dot',
    'learning-progress','progress-summary','progress-track','card-progress','hero-actions','button','detail-progress'
  ]],
  ['semnalmente/style-legacy.css', ['topbar','brand-block','brand-mark','header-actions','status-chip','status-dot','icon-btn']],
  ['semnalmente/benchmark.css', ['benchmark-back']],
  ['ofiter/styles-legacy.css', [
    'topbar','brand','brand-mark','top-actions','legal-date','icon-btn','stats-grid','stat-card','focus-panel','focus-number',
    'accuracy','study-grid','study-card','learn-summary','card-toggle','module-progress','module-status','stat-progress','stat-correct',
    'stat-streak','stat-review','follow-up'
  ]],
  ['ofiter/mobile.css', ['stat-card','focus-number','learn-summary','study-grid','study-card']],
  ['ofiter/mobile-study.css', ['study-card','card-toggle']],
  ['ofiter/mobile-polish.css', ['stat-card','study-card','focus-number']],
  ['ofiter/runtime-performance.css', ['stat-card','study-grid']],
  ['ofiter/dashboard-shell.css', ['exam-path-head','exam-path-grid','exam-path-card']],
  ['ofiter/exam-training.css', ['exam-path-head','exam-path-grid','exam-path-card']],
  ['ofiter/clean-learning.css', ['exam-path-card']],
  ['ofiter/omj2188-session.css', ['omj-session-progress']]
]);

const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function splitSelectors(selector) {
  const out=[];
  let current='', depth=0, quote='', escaped=false;
  for (const ch of selector) {
    if (quote) {
      current += ch;
      if (escaped) { escaped=false; continue; }
      if (ch === '\\') { escaped=true; continue; }
      if (ch === quote) quote='';
      continue;
    }
    if (ch === '"' || ch === "'") { quote=ch; current+=ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth=Math.max(0,depth-1);
    if (ch === ',' && depth === 0) { if(current.trim()) out.push(current.trim()); current=''; }
    else current += ch;
  }
  if(current.trim()) out.push(current.trim());
  return out;
}

function selectorUsesToken(selector, token) {
  const esc=escapeRe(token);
  return new RegExp(`(?:\\.|#)${esc}(?![A-Za-z0-9_-])`).test(selector);
}

let removedRules=0, removedSelectors=0;
for (const [file, deadTokens] of targets) {
  if (!fs.existsSync(file)) continue;
  const root = postcss.parse(fs.readFileSync(file,'utf8'), { from:file });
  root.walkRules(rule => {
    if (!rule.selector) return;
    const selectors=splitSelectors(rule.selector);
    const keep=selectors.filter(selector => !deadTokens.some(token => selectorUsesToken(selector,token)));
    if (keep.length === selectors.length) return;
    removedSelectors += selectors.length - keep.length;
    if (!keep.length) { removedRules++; rule.remove(); }
    else rule.selector=keep.join(', ');
  });
  root.walkAtRules(at => { if (Array.isArray(at.nodes) && at.nodes.length === 0) at.remove(); });
  fs.writeFileSync(file, root.toString().replace(/\n{3,}/g,'\n\n').trimEnd()+'\n');
}

// Wrapper-ele nu mai păstrează reguli sau comentarii introduse doar pentru audit.
fs.writeFileSync('css/style.css', [
  '@import url("./style-legacy.css?v=41");',
  '@import url("./design-system.css?v=4");',
  '@import url("./unified-shell.css?v=2");',
  '@import url("./visual-audit.css?v=3");',
  '@import url("./consistency.css?v=1");',
  '@import url("./responsive.css?v=2");',
  ''
].join('\n'));
fs.writeFileSync('instructaj/styles.css', [
  '@import url("./styles-legacy.css?v=3");',
  '@import url("../css/design-system.css?v=4");',
  '@import url("../css/unified-shell.css?v=2");',
  '@import url("../css/visual-audit.css?v=3");',
  '@import url("../css/consistency.css?v=1");',
  '@import url("../css/responsive.css?v=2");',
  ''
].join('\n'));

// Testul Instructaj verifică acum implementarea reală, nu markerii din wrapper.
const testFile='instructaj/tests.mjs';
let tests=fs.readFileSync(testFile,'utf8');
if (!tests.includes('const stylesLegacy = fs.readFileSync(path.join(moduleDir, "styles-legacy.css"), "utf8");')) {
  tests=tests.replace(
    'const styles = fs.readFileSync(path.join(moduleDir, "styles.css"), "utf8");',
    'const styles = fs.readFileSync(path.join(moduleDir, "styles.css"), "utf8");\nconst stylesLegacy = fs.readFileSync(path.join(moduleDir, "styles-legacy.css"), "utf8");'
  );
}
tests=tests.replace(
  'for (const cssFeature of [".course-nav", ".fraction-grid", "@media (max-width: 650px)", "prefers-reduced-motion"]) {\n  assert.ok(styles.includes(cssFeature), `CSS learning trebuie să includă ${cssFeature}`);\n}',
  'for (const cssFeature of [".fraction-grid", "@media (max-width: 650px)", "prefers-reduced-motion"]) {\n  assert.ok(stylesLegacy.includes(cssFeature), `CSS learning trebuie să includă ${cssFeature}`);\n}\nfor (const removedLegacySelector of [".course-nav", ".hero-panel", ".progress-summary"]) {\n  assert.ok(!stylesLegacy.includes(removedLegacySelector), `CSS legacy nu trebuie să reintroducă ${removedLegacySelector}`);\n}'
);
fs.writeFileSync(testFile,tests);

console.log(`Ghost CSS prune: ${removedRules} reguli și ${removedSelectors} selectori eliminați.`);
