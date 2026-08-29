from pathlib import Path
import re

pages = [
    Path('index.html'), Path('termene.html'), Path('contopiri.html'),
    Path('transfer/index.html'), Path('transfer/rules.html')
]

for p in pages:
    s = p.read_text(encoding='utf-8')
    is_transfer = str(p).startswith('transfer/')
    icon = '../favicon-ev.svg' if is_transfer else './favicon-ev.svg'

    # Replace existing favicon declaration with Safari-compatible clean URL.
    s, n = re.subn(
        r'<link\s+rel="icon"\s+type="image/svg\+xml"\s+href="[^"]+"\s*/?>',
        f'<link rel="icon" href="{icon}" sizes="any" type="image/svg+xml">\n    <link rel="mask-icon" href="{icon}" color="#4f8cff">',
        s,
        count=1,
        flags=re.I,
    )
    if n != 1:
        raise SystemExit(f'favicon declaration not found in {p}')

    # Add stable metadata used by Safari when preparing share previews.
    if '<meta name="description"' not in s:
        title_match = re.search(r'<title>(.*?)</title>', s, flags=re.I | re.S)
        title = re.sub(r'\s+', ' ', title_match.group(1)).strip() if title_match else 'Evidență PPL'
        desc = 'Instrument local pentru evidența pedepselor, liberare condiționată, contopiri, transfer și termene procedurale.'
        meta = f'    <meta name="description" content="{desc}">\n    <meta property="og:title" content="{title}">\n    <meta property="og:description" content="{desc}">\n    <meta property="og:type" content="website">\n'
        s = s.replace('</head>', meta + '</head>', 1)

    p.write_text(s, encoding='utf-8')

# Basic regression checks.
for p in pages:
    s = p.read_text(encoding='utf-8')
    icon = '../favicon-ev.svg' if str(p).startswith('transfer/') else './favicon-ev.svg'
    assert f'href="{icon}" sizes="any" type="image/svg+xml"' in s
    assert f'rel="mask-icon" href="{icon}" color="#4f8cff"' in s
    assert 'favicon.svg?v=' not in s
    assert '<meta name="description"' in s
