import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const styles = read('instructaj/styles.css');
const version = read('js/version.js');
const navigation = read('js/operational-navigation.js');
const mobile = read('css/mobile.css');

assert.match(styles, /operational-upgrades\.css/, 'Instructaj must load the shared operational mobile styles.');
assert.match(styles, /mobile\.css/, 'Instructaj must load the canonical mobile positioning policy.');
assert.doesNotMatch(styles, /site-header\s*\{[\s\S]*position:\s*fixed/i, 'Instructaj must not own a second custom fixed navigation bar.');

assert.match(version, /ensureInstructajNavigationRuntime/, 'The shared runtime loader must explicitly support Instructaj.');
assert.match(version, /operational-navigation\.js/, 'Instructaj must load the shared operational navigation controller.');
assert.match(version, /__EVIDENTA_OPERATIONAL_NAVIGATION__/, 'The loader must guard against duplicate navigation initialization.');

assert.match(navigation, /p\.startsWith\('instructaj'\)/, 'The shared navigation controller must identify the Instructaj route.');
assert.match(navigation, /className = 'ev-mobile-nav'/, 'The shared controller must own the mobile bottom navigation.');
assert.match(mobile, /\.ev-mobile-nav,[\s\S]*position:fixed\s*!important/i, 'The canonical mobile policy must keep bottom navigation fixed.');
assert.match(mobile, /bottom:0\s*!important/i, 'The canonical mobile navigation must be anchored to the bottom edge.');

console.log('Instructaj mobile navigation policy: OK');
