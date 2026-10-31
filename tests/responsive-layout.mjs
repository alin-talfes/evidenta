import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const responsive = `${read('css/desktop.css')}\n${read('css/mobile.css')}`;

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
  responsive.includes('/* NAVIGAȚIE PUBLICĂ CENTRATĂ — mobil și tabletă */') &&
  responsive.includes('body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav') &&
  responsive.includes('flex-wrap: wrap') &&
  responsive.includes('justify-content: center'),
  'Meniul public trebuie să fie centrat și uniform pe mobil/tabletă'
);

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
  responsive.includes('body.ev-unified[data-ev-page="contopiri"] .legal-box') &&
  responsive.includes('max-height: none !important'),
  'Contopiri nu trebuie să folosească nested-scroll pentru baza legală pe telefon'
);

assert.ok(
  responsive.includes('body.ev-unified[data-ev-page="pedepse"] .top-bar') &&
  responsive.includes('#resetBtn'),
  'Toolbar-ul Pedepse trebuie să aibă fallback pentru telefoane foarte înguste'
);

const wrappers = {
  'Pedepse': read('index.html'),
  'Transfer': read('transfer/index.html'),
  'Instructaj': read('instructaj/index.html'),
  'Semnalmente': read('semnalmente/index.html')
};

for (const [module, source] of Object.entries(wrappers)) {
  const desktopRef = source.match(/desktop\.css\?v=\d+/)?.[0];
  const mobileRef = source.match(/mobile\.css\?v=\d+/)?.[0];
  assert.ok(desktopRef, `${module} trebuie să încarce desktop.css`);
  assert.ok(mobileRef, `${module} trebuie să încarce mobile.css`);
  assert.ok(source.indexOf(mobileRef) > source.indexOf(desktopRef), `${module}: mobile.css trebuie să fie după desktop.css`);
}
assert.ok(read('ofiter/styles.css').includes('responsive.css'), 'Ofițer trebuie să păstreze stratul său responsive dedicat');

const officerAudit = read('ofiter/scripts/audit-css.mjs');
assert.ok(officerAudit.includes("../css/responsive.css"), 'Auditul CSS Ofițer trebuie să permită responsive.css');


assert.ok(
  responsive.includes('/* Pe telefoane, navigarea principală este bara inferioară; evităm un al doilea meniu în antet. */') &&
  responsive.includes('@media (max-width: 760px)') &&
  responsive.includes('body.ev-unified:not([data-ev-page^="ofiter"]) .ev-shell__nav') &&
  responsive.includes('display: none !important'),
  'Pe telefoane trebuie să existe o singură navigare principală, fără meniu duplicat în antet.'
);

console.log('Responsive: desktop, tabletă, mobil, safe-area, overflow și Ofițer ascuns verificate.');
