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
    # Footerul este construit centralizat de version.js; eliminăm orice copie statică existentă.
    s = re.sub(r'\s*<footer\b[^>]*class=["\']footer["\'][\s\S]*?</footer>\s*', '\n', s, count=1, flags=re.I)

    # Asigură încărcarea unică a version.js pe fiecare pagină.
    s = re.sub(r'\s*<script\s+src=["\'](?:\.\./)?js/version\.js\?v=\d+["\']\s+defer></script>', '', s, flags=re.I)
    version_src = '../js/version.js?v=38' if str(p).startswith('transfer/') else 'js/version.js?v=38'
    theme_pattern = r'(<script\s+src=["\'](?:\.\./)?js/theme\.js\?v=\d+["\']\s+defer></script>)'
    if re.search(theme_pattern, s, flags=re.I):
        s = re.sub(theme_pattern, r'\1\n    <script src="' + version_src + r'" defer></script>', s, count=1, flags=re.I)
    else:
        s = s.replace('</head>', f'    <script src="{version_src}" defer></script>\n</head>', 1)
    p.write_text(s, encoding='utf-8')

# version.js: singura implementare pentru footer; version.json rămâne singura sursă pentru numărul versiunii.
p = Path('js/version.js')
p.write_text(r'''(() => {
    const scriptUrl = document.currentScript?.src || new URL('js/version.js', document.baseURI).href;
    const versionUrl = new URL('../version.json', scriptUrl).href;

    function renderFooter(versionText) {
        const container = document.querySelector('.container') || document.body;
        let footer = document.querySelector('footer.footer');
        if (!footer) {
            footer = document.createElement('footer');
            footer.className = 'footer';
            footer.setAttribute('role', 'contentinfo');
            container.appendChild(footer);
        }

        footer.replaceChildren();
        const firstLine = document.createElement('div');
        const version = document.createElement('span');
        version.id = 'app-version';
        version.textContent = versionText;
        firstLine.append(version, document.createTextNode(' | © Alin Talfeș'));

        const privacy = document.createElement('div');
        privacy.className = 'footer-privacy';
        privacy.textContent = 'Toate datele sunt stocate exclusiv local, în browserul utilizatorului (localStorage) și nu sunt transmise către servere externe.';

        footer.append(firstLine, privacy);
    }

    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const response = await fetch(versionUrl, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!data || typeof data.version !== 'string' || !data.version.trim()) throw new Error('Versiune invalidă');
            renderFooter(`Versiune ${data.version.trim()}`);
        } catch (error) {
            console.error('Nu s-a putut încărca version.json:', error);
            renderFooter('Versiune indisponibilă');
        }
    });
})();
''', encoding='utf-8')

# Teste de integritate pentru footer/versionare.
p = Path('tests/run-tests.js')
s = p.read_text(encoding='utf-8')
marker = "console.log('All audit regression tests passed.');"
add = r'''
// Footer/versionare: toate paginile folosesc același version.js, iar numărul există numai în version.json.
const versionData=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(versionData.version,'0.168');
const versionSource=fs.readFileSync('js/version.js','utf8');
assert(versionSource.includes("new URL('../version.json', scriptUrl)"));
assert(versionSource.includes('© Alin Talfeș'));
assert(versionSource.includes('Toate datele sunt stocate exclusiv local'));
for(const f of ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']){
  const h=fs.readFileSync(f,'utf8');
  const expected=f.startsWith('transfer/')?'../js/version.js?v=38':'js/version.js?v=38';
  assert(h.includes(`src="${expected}"`),f+' missing centralized version.js');
  assert(!/Versiune\s+0\.168/.test(h),f+' hardcodes application version');
  assert(!/<footer\b/i.test(h),f+' contains duplicated static footer');
}
assert(!/0\.168/.test(versionSource),'version.js hardcodes the version number');

'''
assert marker in s
s = s.replace(marker, add + marker, 1)
p.write_text(s, encoding='utf-8')
