import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('transfer/app.js', 'utf8');

assert(source.includes('function normalizeMatches(rawMatches)'), 'Transfer search must normalize engine results before sorting/rendering');
assert(source.includes("typeof gasesteUnitati !== 'function'"), 'Transfer search must validate that the rules engine is available');
assert(source.includes('function safeFindDestination()'), 'Transfer search must catch runtime failures instead of leaving the UI apparently frozen');
assert(source.includes("cautaBtn.addEventListener('click', safeFindDestination)"), 'Search button must use the hardened handler');
assert(!source.includes("cautaBtn.addEventListener('click', findDestination)"), 'Unsafe direct search handler must not be restored');
assert(source.includes("console.error('Eroare la căutarea destinației de transfer:'"), 'Runtime failures must remain diagnosable in the browser console');

console.log('Transfer search runtime hardening checks passed.');
