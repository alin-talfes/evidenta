from pathlib import Path
import json
import re

pages = [Path('index.html'), Path('termene.html'), Path('contopiri.html'), Path('transfer/index.html'), Path('transfer/rules.html')]

# 1. Transfer: theme control belongs to the actions row, aligned to the right.
for p in [Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'\s*<div class="header-actions">\s*<button id="themeToggle" aria-label="Schimbă tema">🌙</button>\s*</div>', '', s, count=1)

    if p.name == 'index.html':
        old = '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n        </div>'
        new = '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n            <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n        </div>'
        if old not in s:
            raise SystemExit('transfer/index.html action row not found')
        s = s.replace(old, new, 1)
    else:
        marker = '    <!-- ========== CARD FILTRARE ========== -->'
        if marker not in s:
            raise SystemExit('transfer/rules.html filter marker not found')
        new = '    <div class="page-actions transfer-page-actions transfer-page-actions--theme-only">\n        <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n    </div>\n\n'
        s = s.replace(marker, new + marker, 1)

    p.write_text(s, encoding='utf-8')

# 2. CSS alignment + cache busting.
css = Path('css/style.css')
s = css.read_text(encoding='utf-8')
block = '''\n/* Transfer module action alignment */\n.transfer-page-actions {\n    display: flex;\n    align-items: center;\n    justify-content: flex-start;\n    gap: 10px;\n}\n.transfer-page-actions #themeToggle {\n    margin-left: auto;\n}\n.transfer-page-actions--theme-only {\n    justify-content: flex-end;\n}\n.transfer-page-actions--theme-only #themeToggle {\n    margin-left: 0;\n}\n@media (max-width: 600px) {\n    .transfer-page-actions {\n        justify-content: space-between;\n    }\n    .transfer-page-actions--theme-only {\n        justify-content: flex-end;\n    }\n}\n'''
s = re.sub(r'\n?/\* Transfer module action alignment \*/[\s\S]*?(?=\n/\*|\Z)', '\n', s)
s += block
css.write_text(s, encoding='utf-8')

for p in pages:
    s = p.read_text(encoding='utf-8')
    if str(p).startswith('transfer/'):
        s = re.sub(r'\.\./css/style\.css\?v=\d+', '../css/style.css?v=39', s)
    else:
        s = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=39', s)
    p.write_text(s, encoding='utf-8')

# 3. Rewrite manifest as a clean PWA manifest using the single EV vector icon.
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
    'icons': [
        {
            'src': 'favicon-ev.svg',
            'sizes': 'any',
            'type': 'image/svg+xml',
            'purpose': 'any maskable'
        }
    ],
    'shortcuts': [
        {'name': 'Pedepse', 'short_name': 'Pedepse', 'url': './'},
        {'name': 'Contopiri', 'short_name': 'Contopiri', 'url': './contopiri.html'},
        {'name': 'Transfer', 'short_name': 'Transfer', 'url': './transfer/'},
        {'name': 'Termene', 'short_name': 'Termene', 'url': './termene.html'}
    ]
}
Path('manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# 4. Keep regression test aligned with the new CSS release asset version.
tests = Path('tests/run-tests.js')
s = tests.read_text(encoding='utf-8')
s = s.replace("assert(/style\\.css\\?v=38/.test(h),f+' stale css cache version')", "assert(/style\\.css\\?v=39/.test(h),f+' stale css cache version')")
tests.write_text(s, encoding='utf-8')

# 5. Integrity assertions.
for p in pages:
    s = p.read_text(encoding='utf-8')
    assert 'style.css?v=39' in s, f'stale CSS version in {p}'

for p in [Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    assert s.count('id="themeToggle"') == 1, f'duplicate theme toggle in {p}'
    assert 'header-actions' not in s, f'theme toggle still in header in {p}'

m = json.loads(Path('manifest.json').read_text(encoding='utf-8'))
assert m['name'] == 'Evidență PPL'
assert m['icons'][0]['src'] == 'favicon-ev.svg'
assert m['icons'][0]['purpose'] == 'any maskable'
