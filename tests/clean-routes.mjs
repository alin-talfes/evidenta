import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');

for (const file of [
  'contopiri/index.html',
  'transfer/rules/index.html',
  'semnalmente/benchmark/index.html'
]) {
  assert.ok(fs.existsSync(file), `Lipsește ruta canonică ${file}`);
}

for (const [legacy, target] of [
  ['contopiri.html', './contopiri/'],
  ['transfer/rules.html', './rules/'],
  ['semnalmente/benchmark.html', './benchmark/']
]) {
  const html = read(legacy);
  assert.ok(/http-equiv=["']refresh/i.test(html), `${legacy} trebuie să fie doar redirect de compatibilitate`);
  assert.ok(html.includes(target), `${legacy} trebuie să redirecționeze către ${target}`);
}

const theme = read('js/theme.js');
assert.ok(theme.includes("new URL('contopiri/', rootUrl)"), 'Meniul universal trebuie să folosească /contopiri/');
for (const route of ["'contopiri':", "'transfer/rules':", "'semnalmente/benchmark':"]) {
  assert.ok(theme.includes(route), `Theme controller trebuie să recunoască ruta ${route}`);
}

const instructaj = read('instructaj/index.html');
assert.ok(!/<details class="basic-card"\s+open>/i.test(instructaj), 'Cardurile Fundamente juridice trebuie să pornească toate închise');

const publicHtml = [
  'index.html',
  'contopiri/index.html',
  'transfer/index.html',
  'transfer/rules/index.html',
  'instructaj/index.html',
  'semnalmente/index.html',
  'semnalmente/benchmark/index.html',
  'ofiter/index.html'
];
const internalHtmlHref = /href\s*=\s*["'](?!https?:|mailto:|tel:|#|javascript:)[^"']*\.html(?:[?#][^"']*)?["']/ig;
for (const file of publicHtml) {
  const html = read(file);
  const matches = [...html.matchAll(internalHtmlHref)].map(match => match[0]);
  assert.deepEqual(matches, [], `${file} nu trebuie să mai genereze linkuri interne cu .html: ${matches.join(', ')}`);
}

console.log('Rute curate și Fundamente juridice închise implicit: OK');
