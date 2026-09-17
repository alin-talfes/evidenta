import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = relative => fs.readFileSync(path.join(repo, relative), 'utf8');

const modules = [
  { name: 'Pedepse', html: 'index.html', style: 'css/style.css', controller: 'operational-pedepse.js' },
  { name: 'AI', html: 'ai/index.html', style: 'ai/styles.css', controller: 'operational-ai.js' },
  { name: 'Contopiri', html: 'contopiri/index.html', style: 'css/style.css', controller: 'operational-contopiri.js' },
  { name: 'Transfer', html: 'transfer/index.html', style: 'css/style.css', controller: 'operational-transfer.js' },
  { name: 'Instructaj', html: 'instructaj/index.html', style: 'instructaj/styles.css', controller: 'operational-instructaj.js' },
  { name: 'Semnalmente', html: 'semnalmente/index.html', style: 'semnalmente/style.css', controller: 'operational-semnalmente.js' }
];

const includesAsset = (source, asset) => new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\?[^"\']*)?').test(source);

for (const module of modules) {
  const html = read(module.html);
  const style = read(module.style);
  const effectiveStyles = `${html}\n${style}`;

  for (const sharedScript of ['theme.js', 'operational-navigation.js', 'pwa-register.js', 'version.js']) {
    assert.ok(includesAsset(html, sharedScript), `${module.name} trebuie să declare ${sharedScript}.`);
  }
  assert.ok(includesAsset(html, module.controller), `${module.name} trebuie să declare controllerul ${module.controller}.`);

  assert.ok(effectiveStyles.includes('operational-upgrades.css'), `${module.name} trebuie să folosească operational-upgrades.css.`);
  assert.ok(effectiveStyles.includes('mobile.css'), `${module.name} trebuie să folosească politica canonică mobile.css.`);

  assert.doesNotMatch(html, /class=["'](?:app-nav|site-header)["']/, `${module.name} nu trebuie să aibă navigare legacy paralelă.`);
}

const navigation = read('js/operational-navigation.js');
assert.match(navigation, /className = 'ev-mobile-nav'/, 'Bottom-nav trebuie să fie construit numai de controllerul comun.');
assert.equal((navigation.match(/className = 'ev-mobile-nav'/g) || []).length, 1, 'Controllerul comun trebuie să aibă un singur constructor bottom-nav.');

const mobile = read('css/mobile.css');
const mobileModules = read('css/mobile-modules.css');
assert.equal((mobile.match(/position\s*:\s*fixed\s*!important/gi) || []).length, 1, 'Politica mobilă trebuie să aibă un singur element fixed: bottom-nav.');
assert.match(mobile, /\.ev-mobile-nav,[\s\S]*bottom:0\s*!important/i, 'Bottom-nav trebuie ancorat la marginea inferioară.');
assert.ok(!mobile.includes('ev-mobile-advanced-details'), 'Politica mobilă nu trebuie să păstreze wrapperul retras Opțiuni avansate.');
assert.ok(!mobileModules.includes('ev-mobile-advanced-details'), 'Layout-urile modulelor nu trebuie să păstreze wrapperul retras Opțiuni avansate.');

const version = read('js/version.js');
for (const routeController of modules.map(module => module.controller).concat('operational-navigation.js')) {
  assert.ok(!version.includes(routeController), `version.js nu trebuie să încarce ${routeController}.`);
}

console.log(`Public runtime ownership: ${modules.length} module folosesc theme/nav/PWA/version și bottom-nav-ul comun.`);
