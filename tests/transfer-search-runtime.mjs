import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('transfer/app.js', 'utf8');
const html = fs.readFileSync('transfer/index.html', 'utf8');

assert(source.includes('function normalizeMatches(rawMatches)'), 'Transfer search must normalize engine results before sorting/rendering');
assert(source.includes("typeof gasesteUnitati !== 'function'"), 'Transfer search must validate that the rules engine is available');
assert(source.includes('function safeFindDestination()'), 'Transfer search must catch runtime failures instead of leaving the UI apparently frozen');
assert(source.includes("cautaBtn.addEventListener('click', safeFindDestination)"), 'Search button must use the hardened handler');
assert(!source.includes("cautaBtn.addEventListener('click', findDestination)"), 'Unsafe direct search handler must not be restored');
assert(source.includes("console.error('Eroare la căutarea destinației de transfer:'"), 'Runtime failures must remain diagnosable in the browser console');
assert(source.includes('function enableLazyInstanteList()'), 'Large court list must be detached from the active DOM until explicitly opened');
assert(source.includes('panel.remove()'), 'Court-list panel must leave the active DOM after initialization');
assert(source.includes("details.addEventListener('toggle'"), 'Court list must be mounted only when its details element is toggled');
assert(!source.includes('cautaBtn.disabled = true'), 'Search must not rely on disabled-state toggling that can appear stuck on mobile Safari');
assert(html.includes('app.js?v=20260910-2'), 'Transfer app cache key must be bumped after runtime optimization');

console.log('Transfer search runtime hardening checks passed.');
