import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const theme = read('js/theme.js');
const shell = read('css/unified-shell.css');
const audit = read('css/visual-audit.css');
const version = read('js/version.js');

for (const marker of [
  'buildUniversalShell',
  'pruneEditorialNoise',
  'data-evidenta-shell',
  'ev-shell__bar',
  'ev-shell__nav',
  'ev-shell__module',
  'evidenta-theme-toggle',
  'unified-shell.css',
  'visual-audit.css',
  'version.js?v=39'
]) {
  assert.ok(theme.includes(marker), `Controllerul universal trebuie să conțină ${marker}`);
}

for (const moduleLabel of ['Pedepse', 'Contopiri', 'Transfer', 'Instructaj', 'Semnalmente']) {
  assert.ok(theme.includes(`'${moduleLabel}'`), `Meniul global trebuie să includă ${moduleLabel}`);
}

const publicModulesBlock = theme.match(/function publicModules\(\) \{([\s\S]*?)\n    \}/)?.[1] || '';
assert.ok(publicModulesBlock, 'Trebuie să existe lista comună de module publice');
assert.equal((publicModulesBlock.match(/\['/g) || []).length, 5, 'Meniul global trebuie să aibă exact 5 module publice');
assert.ok(!publicModulesBlock.toLowerCase().includes('termene'), 'Modulul Termene a fost retras și nu trebuie expus în meniul public');
assert.ok(!publicModulesBlock.toLowerCase().includes('ofiter'), 'Ofițer nu trebuie expus în meniul public');
assert.ok(!theme.includes('instrumente de evidență'), 'Shell-ul nu trebuie să conțină slogan redundant');
assert.ok(!theme.includes('ev-shell__kicker'), 'Shell-ul nu trebuie să dubleze titlul cu un kicker decorativ');
assert.ok(!theme.includes('context.subtitle'), 'Shell-ul nu trebuie să repete descrieri sub titlul modulului');

for (const marker of [
  '.ev-shell',
  '.ev-shell__bar',
  '.ev-shell__nav',
  '.ev-shell__module',
  '.ev-footer',
  '.ev-footer__inner',
  'font-family: var(--ev-font)',
  'body > .app-shell > .sidebar',
  '#themeToggle',
  '#theme-btn',
  '#btn-theme'
]) {
  assert.ok(shell.includes(marker), `Shell CSS trebuie să normalizeze ${marker}`);
}

for (const marker of [
  'body.ev-unified > .topbar',
  'max-width: var(--ev-shell-max)',
  'padding: 24px var(--ev-shell-pad) 40px',
  '.focus-panel',
  '.section-hub',
  '.rules-table',
  '@media (max-width: 760px)'
]) {
  assert.ok(audit.includes(marker), `Auditul vizual trebuie să conțină corecția ${marker}`);
}

for (const marker of [
  '__EVIDENTA_VERSION_FOOTER__',
  'data.evidentaFooter',
  'Versiune ${versionText}',
  '© Alin Talfeș'
]) {
  assert.ok(version.includes(marker), `Footer-ul central trebuie să conțină ${marker}`);
}
assert.ok(!version.includes('Toate datele sunt stocate exclusiv local'), 'Footer-ul nu trebuie să conțină explicații de confidențialitate');
assert.ok(!version.includes('footer-privacy'), 'Footer-ul trebuie să conțină numai versiunea și copyright-ul');

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

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk(root).filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(!/<footer\b/i.test(html), `${path.relative(root, file)} nu trebuie să definească un footer propriu`);
}

assert.ok(!fs.existsSync(path.join(root, 'termene.html')), 'termene.html trebuie eliminat');
assert.ok(!fs.existsSync(path.join(root, 'js/termene.js')), 'js/termene.js trebuie eliminat');
assert.ok(!fs.existsSync(path.join(root, 'js/termene-core.js')), 'js/termene-core.js trebuie eliminat');

console.log('Unified shell: 5 module publice și footer unic verificate.');
