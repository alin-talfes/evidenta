import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const responsive = read('css/responsive.css');

for (const marker of [
  '@media (min-width: 900px) and (max-width: 1100px)',
  '@media (min-width: 641px) and (max-width: 899px)',
  '@media (max-width: 640px)',
  '@media (max-width: 410px)',
  '@media (hover: none), (pointer: coarse)',
  'env(safe-area-inset-left)',
  'env(safe-area-inset-bottom)',
  'font-size: 16px !important',
  'overflow-x: clip',
  'overflow-x: auto !important',
  'grid-template-columns: repeat(3, minmax(0, 1fr))',
  'grid-template-columns: repeat(2, minmax(0, 1fr))',
  'grid-template-columns: 1fr !important'
]) {
  assert.ok(responsive.includes(marker), `Responsive comun trebuie să conțină: ${marker}`);
}

assert.ok(
  responsive.includes('body.ev-unified[data-ev-page^="ofiter"] .ev-shell__nav') &&
  responsive.includes('display: none !important'),
  'Ofițer trebuie să ascundă navigarea publică a suitei'
);

assert.ok(
  responsive.includes('.ev-shell__nav') &&
  responsive.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'),
  'Pe mobil meniul public trebuie să afișeze toate modulele fără scroll ascuns'
);

assert.ok(
  responsive.includes('body.ev-unified[data-ev-page="contopiri.html"] .legal-box') &&
  responsive.includes('max-height: none !important'),
  'Contopiri nu trebuie să folosească nested-scroll pentru baza legală pe telefon'
);

assert.ok(
  responsive.includes('body.ev-unified[data-ev-page="pedepse"] .top-bar') &&
  responsive.includes('#resetBtn'),
  'Toolbar-ul Pedepse trebuie să aibă fallback pentru telefoane foarte înguste'
);

const wrappers = {
  'nucleu/Transfer': read('css/style.css'),
  'Instructaj': read('instructaj/styles.css'),
  'Semnalmente': read('semnalmente/style.css'),
  'Ofițer': read('ofiter/styles.css')
};

for (const [module, source] of Object.entries(wrappers)) {
  assert.ok(source.includes('responsive.css?v=1'), `${module} trebuie să încarce responsive.css`);
  assert.ok(
    source.indexOf('responsive.css?v=1') > source.indexOf('consistency.css?v=1'),
    `${module}: responsive.css trebuie să fie după consistency.css`
  );
}

const officerAudit = read('ofiter/scripts/audit-css.mjs');
assert.ok(officerAudit.includes("../css/responsive.css"), 'Auditul CSS Ofițer trebuie să permită responsive.css');

console.log('Responsive: desktop, tabletă, mobil, safe-area, overflow și Ofițer ascuns verificate.');
