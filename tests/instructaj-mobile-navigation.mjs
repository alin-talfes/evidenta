import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const html = read('instructaj/index.html');
const styles = read('instructaj/styles.css');
const version = read('js/version.js');
const navigation = read('js/operational-navigation.js');
const operational = read('js/operational-instructaj.js');
const mobile = read('css/mobile.css');
const serviceWorker = read('sw.js');

assert.doesNotMatch(html, /class=["']site-header["']/, 'Instructaj must not keep the retired top navigation markup.');
assert.doesNotMatch(html, /class=["']app-nav["']/, 'Instructaj must not own a parallel suite navigation implementation.');
assert.match(html, /styles\.css\?v=6/, 'Instructaj must load the current module stylesheet.');
assert.match(html, /\.\.\/js\/theme\.js\?v=40/, 'Instructaj must declare the shared theme controller.');
assert.match(html, /\.\.\/js\/operational-navigation\.js\?v=4/, 'Instructaj must declare the shared navigation controller.');
assert.match(html, /\.\.\/js\/operational-instructaj\.js\?v=1/, 'Instructaj must declare its operational controller.');
assert.match(html, /\.\.\/js\/pwa-register\.js\?v=3/, 'Instructaj must declare the shared PWA lifecycle.');
assert.match(html, /\.\.\/js\/version\.js\?v=43/, 'Instructaj must declare the shared version controller.');

assert.match(styles, /operational-upgrades\.css/, 'Instructaj must load the shared operational mobile styles.');
assert.match(styles, /mobile\.css/, 'Instructaj must load the canonical mobile positioning policy.');
assert.doesNotMatch(styles, /site-header\s*\{[\s\S]*position:\s*fixed/i, 'Instructaj must not own a second custom fixed navigation bar.');
assert.doesNotMatch(styles, /body\s*>\s*\.site-header/, 'Instructaj must not retain CSS for removed legacy navigation markup.');

assert.doesNotMatch(version, /ensureInstructajNavigationRuntime/, 'version.js must not load route-specific navigation.');
assert.doesNotMatch(version, /operational-navigation\.js/, 'version.js must remain navigation-free.');
assert.match(navigation, /p\.startsWith\('instructaj'\)/, 'The shared navigation controller must identify the Instructaj route.');
assert.match(navigation, /className = 'ev-mobile-nav'/, 'The shared controller must own the mobile bottom navigation.');
assert.match(operational, /CĂUTARE OPERATIVĂ/, 'The Instructaj operational controller must remain available.');
assert.match(mobile, /\.ev-mobile-nav,[\s\S]*position:fixed\s*!important/i, 'The canonical mobile policy must keep bottom navigation fixed.');
assert.match(mobile, /bottom:0\s*!important/i, 'The canonical mobile navigation must be anchored to the bottom edge.');

const cacheVersion = serviceWorker.match(/const VERSION = ['"](v\d+)['"]/);
assert.ok(cacheVersion, 'PWA service worker must expose a numeric cache version.');
assert.match(serviceWorker, /const STATIC_CACHE = `evidenta-static-\$\{VERSION\}`/, 'Static cache must derive from the shared PWA version.');
assert.match(serviceWorker, /const RUNTIME_CACHE = `evidenta-runtime-\$\{VERSION\}`/, 'Runtime cache must derive from the shared PWA version.');
assert.match(serviceWorker, /['"]\.\/instructaj\/['"]/, 'Instructaj must remain precached for offline navigation.');
assert.match(serviceWorker, /operational-navigation\.js/, 'The shared navigation runtime must remain in the PWA core cache.');
assert.match(serviceWorker, /operational-instructaj\.js/, 'The Instructaj operational runtime must remain in the PWA core cache.');
assert.match(serviceWorker, /instructaj\/styles\.css/, 'The Instructaj mobile style entry point must remain a critical runtime resource.');

console.log(`Instructaj mobile navigation policy: OK (${cacheVersion[1]})`);
