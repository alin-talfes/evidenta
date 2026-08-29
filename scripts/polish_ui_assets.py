from pathlib import Path
import json
import re

pages = [Path('index.html'), Path('termene.html'), Path('contopiri.html'), Path('transfer/index.html'), Path('transfer/rules.html')]

# Transfer: keep exactly one theme control in the actions row, aligned right.
for p in [Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'\s*<div class="header-actions">\s*<button id="themeToggle" aria-label="Schimbă tema">🌙</button>\s*</div>', '', s, count=1)

    if p.name == 'index.html':
        if 'class="page-actions transfer-page-actions"' in s and 'id="themeToggle"' not in s:
            s = s.replace(
                '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n        </div>',
                '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n            <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n        </div>',
                1,
            )
    else:
        if 'id="themeToggle"' not in s:
            marker = '    <!-- ========== CARD FILTRARE ========== -->'
            s = s.replace(marker, '    <div class="page-actions transfer-page-actions transfer-page-actions--theme-only">\n        <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n    </div>\n\n' + marker, 1)

    p.write_text(s, encoding='utf-8')

# CSS alignment + cache busting.
css = Path('css/style.css')
s = css.read_text(encoding='utf-8')
block = '''\n/* Transfer module action alignment */\n.transfer-page-actions {\n    display: flex;\n    align-items: center;\n    justify-content: flex-start;\n    gap: 10px;\n}\n.transfer-page-actions #themeToggle { margin-left: auto; }\n.transfer-page-actions--theme-only { justify-content: flex-end; }\n.transfer-page-actions--theme-only #themeToggle { margin-left: 0; }\n@media (max-width: 600px) {\n    .transfer-page-actions { justify-content: space-between; }\n    .transfer-page-actions--theme-only { justify-content: flex-end; }\n}\n'''
s = re.sub(r'\n?/\* Transfer module action alignment \*/[\s\S]*?(?=\n/\*|\Z)', '\n', s)
s += block
css.write_text(s, encoding='utf-8')

for p in pages:
    s = p.read_text(encoding='utf-8')
    if str(p).startswith('transfer/'):
        s = re.sub(r'\.\./css/style\.css\?v=\d+', '../css/style.css?v=39', s)
        s = s.replace('../favicon-ev.svg', '../favicon-ev-2.svg')
    else:
        s = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=39', s)
        s = s.replace('./favicon-ev.svg', './favicon-ev-2.svg')
    p.write_text(s, encoding='utf-8')

# PWA manifest.
manifest = {
    'id': './',
    'name': 'Evidență PPL',
    'short_name': 'Evidență',
    'description': 'Instrument local pentru evidența pedepselor, liberare condiționată, contopiri, transfer și termene procedurale.',
    'lang': 'ro-RO',
    'dir': 'ltr',
    'start_url': './',
    'scope': './',
    'display': 'standalone',
    'orientation': 'any',
    'background_color': '#0b1220',
    'theme_color': '#0b1220',
    'categories': ['productivity', 'utilities'],
    'icons': [{
        'src': 'favicon-ev-2.svg',
        'sizes': 'any',
        'type': 'image/svg+xml',
        'purpose': 'any maskable'
    }],
    'shortcuts': [
        {'name': 'Pedepse', 'short_name': 'Pedepse', 'url': './'},
        {'name': 'Contopiri', 'short_name': 'Contopiri', 'url': './contopiri.html'},
        {'name': 'Transfer', 'short_name': 'Transfer', 'url': './transfer/'},
        {'name': 'Termene', 'short_name': 'Termene', 'url': './termene.html'}
    ]
}
Path('manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Regression test cache version.
tests = Path('tests/run-tests.js')
s = tests.read_text(encoding='utf-8').replace('style\\.css\\?v=38', 'style\\.css\\?v=39')
tests.write_text(s, encoding='utf-8')

# Integrity checks.
for p in pages:
    s = p.read_text(encoding='utf-8')
    assert 'style.css?v=39' in s
    assert 'favicon-ev-2.svg' in s
for p in [Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    assert s.count('id="themeToggle"') == 1
    assert 'header-actions' not in s
m = json.loads(Path('manifest.json').read_text(encoding='utf-8'))
assert m['icons'][0]['src'] == 'favicon-ev-2.svg'
assert m['icons'][0]['purpose'] == 'any maskable'
