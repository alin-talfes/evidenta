from pathlib import Path
import re

pages = {
    'index.html': ('EVIDENȚĂ PEDEPSE ȘI LIBERARE CONDIȚIONATĂ','Calculează durata pedepsei, expirarea, deducerile și termenele de liberare condiționată într-un singur flux.'),
    'contopiri.html': ('CALCULATOR PEDEAPSĂ REZULTANTĂ','Calculează pedeapsa rezultantă pentru concurs, recidivă și resturi de pedeapsă, cu explicația rezultatului.'),
    'transfer/index.html': ('DESTINAȚIE TRANSFER ȘI PROFILARE','Identifică rapid unitățile compatibile pe baza situației juridice și criteriilor de transfer.'),
    'termene.html': ('CALCULATOR TERMENE PROCEDURALE','Determină termenul-limită conform regulilor de calcul pentru termene procedurale și măsuri restrictive.'),
    'transfer/rules.html': ('REGULI ȘI CRITERII DE TRANSFER','Consultă regulile utilizate de modulul Transfer, organizate pentru verificare rapidă și transparentă.')
}
for path,(title,subtitle) in pages.items():
    p=Path(path); s=p.read_text(encoding='utf-8')
    s=s.replace('style.css?v=34','style.css?v=35')
    s=re.sub(r'(<(?:div|header) class="header"[^>]*>.*?<h1(?:\s+id="[^"]+")?>)(.*?)(</h1>)',lambda m:m.group(1)+title+m.group(3),s,count=1,flags=re.S)
    s=re.sub(r'(</h1>)(\s*<p[^>]*>.*?</p>)?',lambda m:m.group(1)+f'\n            <p class="module-intro">{subtitle}</p>',s,count=1,flags=re.S)
    p.write_text(s,encoding='utf-8')

helpers={
'index.html':[('DATE GENERALE PPL','Completează datele de identificare necesare pentru aplicarea corectă a regulilor de calcul.'),('DETALII PEDEAPSĂ PPL','Introdu durata și data de început a executării. Restul termenelor sunt calculate automat.')],
'contopiri.html':[('Adaugă pedepse','Adaugă fiecare pedeapsă și selectează tipul juridic. Rezultatul este calculat și explicat mai jos.')],
'termene.html':[('Calcul termen','Alege un termen predefinit sau completează manual durata și tipul termenului.')],
'transfer/index.html':[('Criterii de căutare','Selectează situația juridică și criteriile persoanei. Sunt afișate numai destinațiile compatibile cu regulile modulului.')]
}
for path,items in helpers.items():
    p=Path(path); s=p.read_text(encoding='utf-8')
    for heading,text in items:
        s=s.replace(f'<h3>{heading}</h3>',f'<h3>{heading}</h3>\n            <p class="section-help">{text}</p>',1)
    p.write_text(s,encoding='utf-8')

css=Path('css/style.css'); s=css.read_text(encoding='utf-8')
marker='/* ===== MODULE NAVIGATION & UX POLISH ===== */'
if marker in s: s=s.split(marker)[0].rstrip()+'\n'
s += '''\n\n/* ===== MODULE NAVIGATION & UX POLISH ===== */\n.app-nav{position:relative;justify-content:center!important;flex-wrap:wrap;overflow:visible!important;padding:34px 10px 10px!important;gap:8px!important}\n.app-nav::before{content:'M O D U L E';position:absolute;top:9px;left:50%;transform:translateX(-50%);color:var(--text-light);font-size:.68rem;font-weight:700;letter-spacing:.28em;line-height:1;white-space:nowrap}\n.app-nav__brand{display:none!important}\n.app-nav__link{font-size:.82rem!important;font-weight:800!important;letter-spacing:.02em!important;padding:0 16px!important}\n.module-intro{max-width:680px;margin:8px auto 0;color:var(--text-light);font-size:.88rem;line-height:1.55;text-align:center}\n.section-help{margin:-2px 0 14px;color:var(--text-light);font-size:.8rem;line-height:1.5}\n.form-group>label,.card label{line-height:1.35}\n.help-inline{display:block;margin-top:5px;color:var(--text-light);font-size:.74rem;font-weight:400;line-height:1.4}\n@media(max-width:640px){.app-nav{padding-top:32px!important;gap:5px!important}.app-nav__link{min-height:36px!important;padding:0 10px!important;font-size:.74rem!important}.module-intro{font-size:.82rem;padding:0 4px}}\n'''
css.write_text(s,encoding='utf-8')
