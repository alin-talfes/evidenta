import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('transfer/app.js', 'utf8');
const html = fs.readFileSync('transfer/index.html', 'utf8');
const css = fs.readFileSync('css/style.css', 'utf8');

assert(source.includes('function normalizeMatches(rawMatches)'), 'Transfer search must normalize engine results before sorting/rendering');
assert(source.includes("typeof gasesteUnitati !== 'function'"), 'Transfer search must validate that the rules engine is available');
assert(source.includes('function safeFindDestination()'), 'Transfer search must catch runtime failures instead of leaving the UI apparently frozen');
assert(source.includes("cautaBtn.addEventListener('click', safeFindDestination)"), 'Search button must use the hardened handler');
assert(!source.includes("cautaBtn.addEventListener('click', findDestination)"), 'Unsafe direct search handler must not be restored');
assert(source.includes("console.error('Eroare la căutarea destinației de transfer:'"), 'Runtime failures must remain diagnosable in the browser console');
assert(!html.includes('instanteCard'), 'Removed court list must not be restored in the Transfer page');
assert(!source.includes('enableLazyInstanteList'), 'Removed court-list runtime code must not be restored');
assert(!source.includes('cautaBtn.disabled = true'), 'Search must not rely on disabled-state toggling that can appear stuck on mobile Safari');
assert(source.includes('class="match-name"'), 'Transfer result name must use a dedicated class');
assert(!source.includes('class="primary"'), 'Transfer result name must not reuse the global .primary button class');
assert(css.includes('[data-ev-page="transfer"] #resultArea .match-name'), 'Transfer result name needs scoped presentation rules');
assert(css.includes('[data-ev-page="transfer"] #resultArea .ev-match-why > summary'), 'Transfer explainability disclosure needs scoped presentation rules');
assert(html.includes('style.css?v=43'), 'Transfer stylesheet cache key must be bumped after the visual fix');
assert(html.includes('app.js?v=20260910-4'), 'Transfer app cache key must be bumped after the result class fix');

console.log('Transfer search and result UI regression checks passed.');
