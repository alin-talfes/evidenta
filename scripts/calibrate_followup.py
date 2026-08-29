from pathlib import Path

p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
old="    if (!life && !art) err.push('Selectați articolul de liberare condiționată.');"
new="""    if (!life && !art) err.push('Selectați articolul de liberare condiționată.');
    if (life && art !== 'NCP99') err.push('Pentru detențiunea pe viață se aplică NCP art. 99.');
    if (!life && art === 'NCP99') err.push('NCP art. 99 se utilizează numai pentru detențiunea pe viață.');"""
assert old in s
s=s.replace(old,new,1)
old="""    // Secțiunea nouă: scădere zile muncite din data propozabilă
    html += `<div class="result-section">
        <h4>SCĂDERE ZILE MUNCITE DIN DATA PROPOZABILĂ</h4>"""
new="""    // Zilele muncite pot reduce numai fracția propozabilă a pedepselor determinate.
    if (!life) html += `<div class="result-section">
        <h4>SCĂDERE ZILE MUNCITE DIN DATA PROPOZABILĂ</h4>"""
assert old in s
s=s.replace(old,new,1)
old="""    // Inițializare scădere zile muncite
    updateProposedDateWithWorkDays();"""
new="""    // Inițializare scădere zile muncite doar pentru pedepsele determinate.
    if (!life) updateProposedDateWithWorkDays();"""
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('js/ui.js'); s=p.read_text(encoding='utf-8')
old="""    document.getElementById('lifeSentence').addEventListener('change', function() {
        document.getElementById('sentenceDuration').classList.toggle('hidden', this.checked);
    });"""
new="""    document.getElementById('lifeSentence').addEventListener('change', function() {
        document.getElementById('sentenceDuration').classList.toggle('hidden', this.checked);
        const article = document.getElementById('liberationArticle');
        if (this.checked) {
            article.value = 'NCP99';
            article.disabled = true;
        } else {
            article.disabled = false;
            if (article.value === 'NCP99') article.value = '';
        }
        updAgeTag();
    });"""
assert old in s
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p=Path('tests/run-tests.js'); s=p.read_text(encoding='utf-8')
marker="console.log('All audit regression tests passed.');"
add="""
// Integritate UI pentru detențiunea pe viață: art. 99 este unic și zilele muncite nu se afișează pentru viață.
const appSource=fs.readFileSync('js/app.js','utf8'), uiSource=fs.readFileSync('js/ui.js','utf8');
assert(appSource.includes("life && art !== 'NCP99'"));
assert(appSource.includes("!life && art === 'NCP99'"));
assert(appSource.includes('if (!life) html += `<div class="result-section">'));
assert(uiSource.includes("article.value = 'NCP99'")); assert(uiSource.includes('article.disabled = true'));

"""
assert marker in s
s=s.replace(marker,add+marker,1)
p.write_text(s,encoding='utf-8')

p=Path('version.json'); s=p.read_text(encoding='utf-8').replace('0.166','0.167'); p.write_text(s,encoding='utf-8')
