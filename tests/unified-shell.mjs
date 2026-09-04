import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const theme = read('js/theme.js');
const shell = read('css/unified-shell.css');

for (const marker of [
  'buildUniversalShell',
  'data-evidenta-shell',
  'ev-shell__bar',
  'ev-shell__nav',
  'ev-shell__module',
  'evidenta-theme-toggle',
  'unified-shell.css'
]) {
  assert.ok(theme.includes(marker), `Controllerul universal trebuie să conțină ${marker}`);
}

for (const moduleLabel of ['Pedepse', 'Contopiri', 'Transfer', 'Termene', 'Instructaj', 'Semnalmente']) {
  assert.ok(theme.includes(`'${moduleLabel}'`), `Meniul global trebuie să includă ${moduleLabel}`);
}

const publicModulesBlock = theme.match(/function publicModules\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';
assert.ok(publicModulesBlock, 'Trebuie să existe lista comună de module publice');
assert.equal((publicModulesBlock.match(/\['/g) || []).length, 6, 'Meniul global trebuie să aibă exact 6 module publice');
assert.ok(!publicModulesBlock.toLowerCase().includes('ofiter'), 'Ofițer nu trebuie expus în meniul public');

for (const marker of [
  '.ev-shell',
  '.ev-shell__bar',
  '.ev-shell__nav',
  '.ev-shell__module',
  'font-family: var(--ev-font)',
  'body > .app-shell > .sidebar',
  '#themeToggle',
  '#theme-btn',
  '#btn-theme'
]) {
  assert.ok(shell.includes(marker), `Shell CSS trebuie să normalizeze ${marker}`);
}

assert.ok(shell.includes('display: none !important'), 'Antetele și meniurile globale vechi trebuie neutralizate vizual');
assert.ok(shell.includes('@media (max-width: 680px)'), 'Shell-ul universal trebuie să aibă tratament mobil');

const loaders = {
  'nucleu': read('index.html'),
  'transfer': read('transfer/index.html'),
  'instructaj': read('instructaj/app.js'),
  'semnalmente': read('semnalmente/enhancements.js'),
  'benchmark': read('semnalmente/benchmark.html'),
  'ofiter': read('ofiter/access-gate.js')
};

for (const [name, source] of Object.entries(loaders)) {
  assert.ok(source.includes('theme.js'), `${name} trebuie să încarce controllerul comun theme.js`);
}

console.log('Unified shell: meniu, antet, temă și structură vizuală comună verificate.');
