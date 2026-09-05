from pathlib import Path
import json
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')


def add_base(html, href):
    if '<base ' in html:
        return html
    return html.replace('<head>', f'<head>\n    <base href="{href}">', 1)


def remove_termene_links(html):
    return re.sub(
        r'\s*<a\b[^>]*href=["\'][^"\']*termene\.html["\'][^>]*>.*?</a>',
        '',
        html,
        flags=re.I | re.S,
    )


def redirect_page(target, css_href):
    return f'''<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0; url={target}">
  <link rel="canonical" href="{target}">
  <link rel="stylesheet" href="{css_href}">
  <title>Redirecționare — Evidență PPL</title>
  <script>location.replace('{target}' + location.search + location.hash);</script>
</head>
<body><p>Redirecționare… <a href="{target}">Continuă</a></p></body>
</html>
'''


# 1) Canonicalizează Contopiri ca rută /contopiri/
contopiri = read('contopiri.html')
contopiri = add_base(contopiri, '../')
contopiri = remove_termene_links(contopiri)
contopiri = contopiri.replace('contopiri.html', 'contopiri/')
contopiri = contopiri.replace(
    'Instrument local pentru evidența pedepselor, liberare condiționată, contopiri, transfer și termene procedurale.',
    'Calculul pedepsei rezultante pentru situații deja calificate juridic.'
)
write('contopiri/index.html', contopiri)
write('contopiri.html', redirect_page('./contopiri/', 'css/design-system.css?v=4'))


# 2) Canonicalizează Reguli transfer ca /transfer/rules/
rules = read('transfer/rules.html')
rules = add_base(rules, '../')
rules = remove_termene_links(rules)
rules = rules.replace('../contopiri.html', '../contopiri/')
write('transfer/rules/index.html', rules)
write('transfer/rules.html', redirect_page('./rules/', '../css/design-system.css?v=4'))


# 3) Canonicalizează Benchmark ca /semnalmente/benchmark/
benchmark = read('semnalmente/benchmark.html')
benchmark = add_base(benchmark, '../')
benchmark = benchmark.replace('href="index.html"', 'href="./"')
benchmark = benchmark.replace("href='index.html'", "href='./'")
write('semnalmente/benchmark/index.html', benchmark)
write('semnalmente/benchmark.html', redirect_page('./benchmark/', '../css/design-system.css?v=4'))


# 4) Fundamente juridice: toate cardurile pornesc închise.
instructaj = read('instructaj/index.html')
open_cards = instructaj.count('<details class="basic-card" open>')
if open_cards < 2:
    raise RuntimeError(f'Erau așteptate cel puțin 2 carduri basic-card deschise, găsite: {open_cards}')
instructaj = instructaj.replace('<details class="basic-card" open>', '<details class="basic-card">')
instructaj = instructaj.replace('../contopiri.html', '../contopiri/')
instructaj = remove_termene_links(instructaj)
write('instructaj/index.html', instructaj)


# 5) Curăță legăturile interne către rutele canonice.
for path in ['index.html', 'transfer/index.html', 'semnalmente/index.html', 'README.md']:
    p = Path(path)
    if not p.exists():
        continue
    s = p.read_text(encoding='utf-8')
    s = s.replace('contopiri.html', 'contopiri/')
    if path == 'transfer/index.html':
        s = s.replace('href="rules.html"', 'href="rules/"').replace("href='rules.html'", "href='rules/'")
        s = remove_termene_links(s)
    if path == 'semnalmente/index.html':
        s = s.replace('benchmark.html', 'benchmark/')
    p.write_text(s, encoding='utf-8')

p = Path('semnalmente/enhancements.js')
if p.exists():
    s = p.read_text(encoding='utf-8').replace('benchmark.html', 'benchmark/')
    p.write_text(s, encoding='utf-8')


# 6) Shell-ul comun recunoaște rutele curate și nu mai generează .html.
theme = read('js/theme.js')
for old_key, clean_key in [
    ('contopiri.html', 'contopiri'),
    ('transfer/rules.html', 'transfer/rules'),
    ('semnalmente/benchmark.html', 'semnalmente/benchmark'),
]:
    pattern = re.compile(rf"^(\s*)'{re.escape(old_key)}': (\[.*\]),$", re.M)
    match = pattern.search(theme)
    if not match:
        raise RuntimeError(f'Nu am găsit contextul pentru {old_key} în js/theme.js')
    indent, value = match.groups()
    index_key = clean_key + '/index.html'
    replacement = f"{indent}'{old_key}': {value},\n{indent}'{clean_key}': {value},\n{indent}'{index_key}': {value},"
    theme = pattern.sub(replacement, theme, count=1)

theme = theme.replace("new URL('contopiri.html', rootUrl)", "new URL('contopiri/', rootUrl)")
write('js/theme.js', theme)


# 7) PWA shortcut + CSS care depinde de data-ev-page.
manifest = json.loads(read('manifest.json'))
for shortcut in manifest.get('shortcuts', []):
    if shortcut.get('name') == 'Contopiri':
        shortcut['url'] = './contopiri/'
write('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

for path in ['css/visual-audit.css', 'css/responsive.css']:
    p = Path(path)
    s = p.read_text(encoding='utf-8').replace('data-ev-page="contopiri.html"', 'data-ev-page="contopiri"')
    p.write_text(s, encoding='utf-8')


# 8) Actualizează testele existente către paginile canonice.
for path in ['tests/design-system.mjs', 'tests/unified-shell.mjs']:
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    s = s.replace('contopiri.html', 'contopiri/index.html')
    s = s.replace('transfer/rules.html', 'transfer/rules/index.html')
    s = s.replace('semnalmente/benchmark.html', 'semnalmente/benchmark/index.html')
    p.write_text(s, encoding='utf-8')

p = Path('tests/responsive-layout.mjs')
s = p.read_text(encoding='utf-8').replace('data-ev-page="contopiri.html"', 'data-ev-page="contopiri"')
p.write_text(s, encoding='utf-8')


# 9) Test dedicat rutelor curate + stării inițiale a cardurilor Fundamente.
clean_test = r'''import fs from 'node:fs';
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
  assert.ok(html.includes('location.replace'), `${legacy} trebuie să fie doar redirect de compatibilitate`);
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
'''
write('tests/clean-routes.mjs', clean_test)

package = json.loads(read('package.json'))
if 'node tests/clean-routes.mjs' not in package['scripts']['test']:
    package['scripts']['test'] = package['scripts']['test'].replace(
        'node tests/responsive-layout.mjs',
        'node tests/responsive-layout.mjs && node tests/clean-routes.mjs'
    )
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')


# 10) One-off: elimină infrastructura temporară după aplicare.
Path('scripts/editorial_cleanup.py').unlink(missing_ok=True)
Path('.github/workflows/editorial-cleanup.yml').unlink(missing_ok=True)
