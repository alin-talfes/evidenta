from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, content):
    Path(path).write_text(content, encoding='utf-8')


def require_change(before, after, label):
    if before == after:
        raise RuntimeError(f'Curățarea nu a modificat zona așteptată: {label}')
    return after


# Instructaj: elimină navigația/hero-ul legacy, textele de progres și footer-ul local.
p = Path('instructaj/index.html')
s = p.read_text(encoding='utf-8')
old = s
s = re.sub(r'\n\s*<header class="site-header">.*?</header>\n', '\n', s, count=1, flags=re.S)
s = re.sub(
    r'\n\s*<section class="hero">.*?</section>\n\n\s*<section class="notice"',
    '\n  <section class="hero" aria-hidden="true"></section>\n\n  <section class="notice"',
    s,
    count=1,
    flags=re.S,
)
s = re.sub(r'\n\s*<footer>.*?</footer>\n', '\n', s, count=1, flags=re.S)
s = s.replace(
    'Alege o situație, parcurge pașii în ordine și bifează doar operațiunile efectiv realizate. Progresul rămâne salvat local.',
    'Alege o situație și parcurge pașii în ordinea indicată.'
)
s = s.replace(
    '<li><strong>Lucrează în ordinea din fișă</strong> și bifează doar operațiunile efectiv realizate.</li>',
    '<li><strong>Lucrează în ordinea din fișă</strong> și verifică fiecare operațiune efectiv realizată.</li>'
)
for text in ['Fundamente juridice', 'Aplică noțiunile', 'Conexiuni legislative', 'Fără jargon inutil', 'Metoda de lucru']:
    s = s.replace(f'<p class="eyebrow">{text}</p>', '')
p.write_text(require_change(old, s, 'instructaj/index.html'), encoding='utf-8')


# Contopiri: scoate shell-ul vechi și copy-ul descriptiv redundant; păstrează baza legală integrală.
p = Path('contopiri.html')
s = p.read_text(encoding='utf-8')
old = s
s = s.replace('js/version.js?v=38', 'js/version.js?v=39')
s = s.replace(
    'Instrument local pentru evidența pedepselor, liberare condiționată, contopiri, transfer și termene procedurale.',
    'Calculul pedepsei rezultante pentru situații deja calificate juridic.'
)
s = re.sub(r'\n\s*<nav class="app-nav".*?</nav>\n', '\n', s, count=1, flags=re.S)
s = s.replace('<button id="themeToggle" aria-label="Activează tema luminoasă">🌙</button>', '')
s = re.sub(r'\n\s*<div class="header">.*?</div>\n\n\s*<div class="card">', '\n\n        <div class="card">', s, count=1, flags=re.S)
s = re.sub(r'\n\s*<p class="section-help">Adaugă fiecare pedeapsă.*?</p>', '', s, count=1, flags=re.S)
p.write_text(require_change(old, s, 'contopiri.html'), encoding='utf-8')


# Transfer: scoate navigația/antetul vechi și descrierea retrasă a modulului Termene.
p = Path('transfer/index.html')
s = p.read_text(encoding='utf-8')
old = s
s = s.replace('<title>INSTRUMENT DE AJUTOR PENTRU LUCRAREA DE TRANSFER – DECIZIA DE PROFILARE NR. 360/2020 — FORMĂ CONSOLIDATĂ 30.03.2026</title>', '<title>Transfer și profilare — Evidență PPL</title>')
s = s.replace('..\/js/version.js?v=38', '..\/js/version.js?v=39') if '..\/js/version.js?v=38' in s else s
s = s.replace('../js/version.js?v=38', '../js/version.js?v=39')
s = s.replace(
    'Instrument local pentru evidența pedepselor, liberare condiționată, contopiri, transfer și termene procedurale.',
    'Filtrarea destinațiilor potrivit criteriilor de transfer și profilare.'
)
s = s.replace('INSTRUMENT DE AJUTOR PENTRU LUCRAREA DE TRANSFER – SIMPLIFICAREA DECIZIEI DE PROFILARE (NR. 360/2020)', 'Transfer și profilare — Evidență PPL')
s = re.sub(r'\n\s*<!-- ========== BARĂ DE SUS ========== -->\s*<nav class="app-nav".*?</nav>\s*', '\n', s, count=1, flags=re.S)
s = s.replace('<button id="themeToggle" aria-label="Schimbă tema">🌙</button>', '')
s = re.sub(r'\n\s*<!-- ========== HEADER ========== -->\s*<header class="header">.*?</header>\s*', '\n', s, count=1, flags=re.S)
p.write_text(require_change(old, s, 'transfer/index.html'), encoding='utf-8')


# Pagina Pedepse: modalul Informații păstrează doar informația factuală și regulile de calcul.
p = Path('js/ui.js')
s = p.read_text(encoding='utf-8')
old = s
s = s.replace('INFORMAȚII ȘI GHID DE UTILIZARE', 'INFORMAȚII')
s = s.replace('<p><strong>Scopul aplicației</strong><br>', '<p><strong>Ce calculează</strong><br>')
s = re.sub(r'\n\s*<p><strong>Instrumente disponibile</strong><br>.*?</p>', '', s, count=1, flags=re.S)
s = re.sub(r'\n\s*<p><strong>Mod de utilizare</strong><br>.*?</p>', '', s, count=1, flags=re.S)
p.write_text(require_change(old, s, 'js/ui.js'), encoding='utf-8')


# Mecanismul este one-off: nu rămâne în repo după aplicare.
Path('scripts/editorial_cleanup.py').unlink(missing_ok=True)
Path('.github/workflows/editorial-cleanup.yml').unlink(missing_ok=True)
