from pathlib import Path
import re

# 1. Make Transfer theme controls part of the module action row, not the centered header.
for p in [Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'\s*<div class="header-actions">\s*<button id="themeToggle" aria-label="Schimbă tema">🌙</button>\s*</div>', '', s, count=1)
    if p.name == 'index.html':
        old = '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n        </div>'
        new = '<div class="page-actions transfer-page-actions">\n            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>\n            <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n        </div>'
    else:
        marker = '    <!-- ========== CARD FILTRARE ========== -->'
        new = '    <div class="page-actions transfer-page-actions">\n        <button id="themeToggle" aria-label="Schimbă tema">🌙</button>\n    </div>\n\n'
        s = s.replace(marker, new + marker, 1)
        p.write_text(s, encoding='utf-8')
        continue
    if old not in s:
        raise SystemExit(f'action marker missing in {p}')
    p.write_text(s.replace(old, new, 1), encoding='utf-8')

# 2. Add focused Transfer action positioning and bump CSS asset version globally.
css = Path('css/style.css')
s = css.read_text(encoding='utf-8')
addition = '''\n/* Transfer module action alignment */\n.transfer-page-actions {\n    align-items: center;\n}\n.transfer-page-actions #themeToggle {\n    margin-left: auto;\n}\n@media (max-width: 600px) {\n    .transfer-page-actions { justify-content: space-between; }\n}\n'''
if '/* Transfer module action alignment */' not in s:
    s += addition
css.write_text(s, encoding='utf-8')

for p in [Path('index.html'), Path('termene.html'), Path('contopiri.html'), Path('transfer/index.html'), Path('transfer/rules.html')]:
    s = p.read_text(encoding='utf-8')
    s = re.sub(r'css/style\.css\?v=\d+', 'css/style.css?v=39', s) if not str(p).startswith('transfer/') else re.sub(r'\.\./css/style\.css\?v=\d+', '../css/style.css?v=39', s)
    p.write_text(s, encoding='utf-8')
