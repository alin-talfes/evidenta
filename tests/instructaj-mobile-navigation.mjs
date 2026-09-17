import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const html = read('instructaj/index.html');
const styles = read('instructaj/styles.css');
const version = read('js/version.js');
const navigation = read('js/operational-navigation.js');
const mobile = read('css/mobile.css');
const serviceWorker = read('sw.js');

assert.doesNotMatch(html, /class=["']site-header["']/, 'Instructaj must not keep the retired top navigation markup.');
assert.doesNotMatch(html, /class=["']app-nav["']/, 'Instructaj must not own a parallel suite navigation implementation.');
assert.match(html, /styles\.css\?v=6/, 'Instructaj must bust the module stylesheet after the navigation cleanup.');

assert.match(styles, /operational-upgrades\.css/, 'Instructaj must load the shared operational mobile styles.');
assert.match(styles, /mobile\.css/, 'Instructaj must load the canonical mobile positioning policy.');
assert.doesNotMatch(styles, /site-header\s*\{[\s\S]*position:\s*fixed/i, 'Instructaj must not own a second custom fixed navigation bar.');
assert.doesNotMatch(styles, /body\s*>\s*\.site-header/, 'Instructaj must not retain CSS for removed legacy navigation markup.');

assert.match(version, /ensureInstructajNavigationRuntime/, 'The shared runtime loader must explicitly support Instructaj.');
assert.match(version, /operational-navigation\.js/, 'Instructaj must load the shared operational navigation controller.');
assert.match(version, /__EVIDENTA_OPERATIONAL_NAVIGATION__/, 'The loader must guard against duplicate navigation initialization.');

assert.match(navigation, /p\.startsWith\('instructaj'\)/, 'The shared navigation controller must identify the Instructaj route.');
assert.match(navigation, /className = 'ev-mobile-nav'/, 'The shared controller must own the mobile bottom navigation.');
assert.match(mobile, /\.ev-mobile-nav,[\s\S]*position:fixed\s*!important/i, 'The canonical mobile policy must keep bottom navigation fixed.');
assert.match(mobile, /bottom:0\s*!important/i, 'The canonical mobile navigation must be anchored to the bottom edge.');

assert.match(serviceWorker, /const VERSION = 'v48'/, 'PWA cache must be invalidated after removing the legacy Instructaj navigation markup.');
assert.match(serviceWorker, /'\.\/instructaj\/'/, 'Instructaj must remain precached for offline navigation.');
assert.match(serviceWorker, /operational-navigation\.js/, 'The shared navigation runtime must remain in the PWA core cache.');
assert.match(serviceWorker, /instructaj\/styles\.css/, 'The Instructaj mobile style entry point must remain a critical runtime resource.');

console.log('Instructaj mobile navigation policy: OK');
