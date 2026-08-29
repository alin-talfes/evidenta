from pathlib import Path
import re

pages = [
    Path('index.html'),
    Path('termene.html'),
    Path('contopiri.html'),
    Path('transfer/index.html'),
    Path('transfer/rules.html'),
]

for p in pages:
    s = p.read_text(encoding='utf-8')
    s2, n = re.subn(r'href="((?:\.\./|\./)?favicon\.svg)(?:\?v=\d+)?"', r'href="\1?v=2"', s, count=1)
    if n != 1:
        raise SystemExit(f'favicon link not found exactly once in {p}')
    p.write_text(s2, encoding='utf-8')

manifest = Path('manifest.json')
s = manifest.read_text(encoding='utf-8')
s = re.sub(r'"src"\s*:\s*"favicon\.svg(?:\?v=\d+)?"', '"src": "favicon.svg?v=2"', s, count=1)
manifest.write_text(s, encoding='utf-8')

# Integrity checks.
for p in pages:
    s = p.read_text(encoding='utf-8')
    expected = '../favicon.svg?v=2' if str(p).startswith('transfer/') else './favicon.svg?v=2'
    if expected not in s:
        raise SystemExit(f'wrong favicon path in {p}')
