from pathlib import Path

# Transfer-only compliance alignment. Pedepse and shared calculation logic are intentionally untouched.

# 1) Correct permanent AP custody: 2026 profile lists young/adult males, not minors, for Rahova/Giurgiu.
p=Path('transfer/rules.js'); s=p.read_text(encoding='utf-8')
s=s.replace("// rules.js – conține datele complete din Anexa 1, 3, 5", "// rules.js – sursa operațională pentru profilarea din Decizia 360/2020, forma consolidată 30.03.2026")
# Scope replacements to named unit blocks.
def replace_in_unit(text, unit_marker, next_marker, old, new):
    a=text.index(unit_marker); b=text.index(next_marker,a)
    block=text[a:b]
    if old not in block: raise SystemExit(f'pattern missing in {unit_marker}')
    return text[:a]+block.replace(old,new,1)+text[b:]
s=replace_in_unit(s,'// ---------- 9. Penitenciarul București-Rahova ----------','// ---------- 10.',"minor: ['Ilfov', 'București'],","minor: [],")
s=replace_in_unit(s,'// ---------- 20. Penitenciarul Giurgiu ----------','// ---------- 21.',"minor: ['Giurgiu', 'Teleorman'],","minor: [],")
# Add legal metadata + explicit helper for permanent AP semantics.
append=r'''

// ============================================================
// METADATE DE CONFORMITATE – DECIZIA 360/2020
// Forma consolidată utilizată: 30.03.2026 (inclusiv Ordinul ANP nr. 105/2026).
// IMPORTANT: custodieArestati reprezintă profilarea pentru custodie permanentă A.P.
// și NU arondarea distinctă pentru primirea inițială de la organele de poliție (Anexa 3).
// ============================================================
const TRANSFER_PROFILE_META = Object.freeze({
    act: 'Decizia directorului general ANP nr. 360/2020',
    consolidatedAt: '30.03.2026',
    latestAmendment: 'Ordinul ANP nr. 105/2026',
    annexes: Object.freeze({
        profile: 1, sections: 2, policeReception: 3, provisionalRegime: 4,
        educationalMeasures: 5, transit: 6, forensic: 7, severeMentalDisorders: 8
    })
});
'''
if 'const TRANSFER_PROFILE_META' not in s: s += append
p.write_text(s,encoding='utf-8')

# 2) UI: make the legal scope explicit; do not mislabel AP permanent custody as police reception.
p=Path('transfer/index.html'); s=p.read_text(encoding='utf-8')
s=s.replace('SIMPLIFICAREA DECIZIEI DE PROFILARE (NR. 360/2020)', 'DECIZIA DE PROFILARE NR. 360/2020 — FORMĂ CONSOLIDATĂ 30.03.2026', 1)
s=s.replace('<button type="button" class="toggle-btn" data-mode="custodieArestati">Custodie A.P.</button>', '<button type="button" class="toggle-btn" data-mode="custodieArestati">Custodie A.P. permanentă</button>')
s=s.replace('Selectează situația juridică și criteriile persoanei. Sunt afișate numai destinațiile compatibile cu regulile modulului.', 'Selectează situația juridică și criteriile persoanei. Motorul principal folosește profilarea din Anexa 1; primirea de la poliție, regimul provizoriu și anexele speciale sunt operațiuni juridice distincte, prezentate separat în „Reguli transfer”.')
p.write_text(s,encoding='utf-8')

# 3) App copy: prevent semantic confusion and show consolidated source.
p=Path('transfer/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace("modeAdvice.textContent = 'Modul „Custodie A.P.” – unități cu secții de arestare preventivă în custodie permanentă.';", "modeAdvice.textContent = 'Modul „Custodie A.P. permanentă” – profilare Anexa 1. Nu reprezintă primirea inițială de la poliție din Anexa 3.';")
s=s.replace("extraMsg = ' Nu există unități cu secții de arestare preventivă pentru județul selectat.';", "extraMsg = ' Nu există unități profilate în Anexa 1 pentru custodie permanentă A.P. potrivit criteriilor selectate.';")
s=s.replace("note = ' Atenție: Sunt afișate doar unitățile care au secții de arestare preventivă în custodie permanentă pentru județul selectat.';", "note = ' Atenție: sunt afișate exclusiv destinațiile de custodie permanentă A.P. din profilarea Anexei 1; primirea de la poliție se verifică distinct potrivit Anexei 3.';")
s=s.replace("console.log('Aplicația de transfer – Decizia 360/2020 – încărcată cu succes.');", "console.log('Aplicația de transfer – Decizia 360/2020, formă consolidată 30.03.2026 – încărcată cu succes.');")
p.write_text(s,encoding='utf-8')

# 4) Rules page: expose all 8 annexes and clearly identify the two currently informational/operational distinctions.
p=Path('transfer/rules.html'); s=p.read_text(encoding='utf-8')
s=s.replace('Anexe și reguli operaționale utilizate – Decizia 360/2020', 'Anexele 1–8 – Decizia 360/2020, formă consolidată 30.03.2026')
anchor='    <!-- ========== ANEXA 3 ========== -->'
insert='''    <!-- ========== ANEXA 2 ========== -->\n    <div class="card" id="anexa2Card">\n        <h3>Anexa 2 – Secții interioare și exterioare</h3>\n        <p>Anexa 2 stabilește structurile interioare/exterioare și nu reprezintă o regulă autonomă de arondare după județ. Pentru stabilirea destinației se utilizează profilarea și anexele operaționale aplicabile.</p>\n    </div>\n\n'''
if 'id="anexa2Card"' not in s: s=s.replace(anchor,insert+anchor)
anchor5='    <!-- ========== ANEXA 5 ========== -->'
insert4='''    <!-- ========== ANEXA 4 ========== -->\n    <div class="card" id="anexa4Card">\n        <h3>Anexa 4 – Transfer după stabilirea regimului provizoriu</h3>\n        <p>Operațiune distinctă de profilarea generală: transferul se dispune de directorul locului de deținere conform arondării prevăzute în Anexa 4. Modul principal nu substituie această arondare cu rezultatele Anexei 1.</p>\n        <div class="anexa-box"><strong>Regulă:</strong> pentru o speță de regim provizoriu se verifică direct Anexa 4 în forma consolidată aplicabilă; nu se utilizează modul „Executare pedeapsă” ca echivalent automat.</div>\n    </div>\n\n'''
if 'id="anexa4Card"' not in s: s=s.replace(anchor5,insert4+anchor5)
p.write_text(s,encoding='utf-8')

# 5) Tests: permanent AP corrections, legal metadata, all annex cards, and explicit guarantee Pedepse core is untouched by this feature.
p=Path('tests/run-tests.js'); s=p.read_text(encoding='utf-8')
extra=r'''

// Transfer profile compliance – consolidated Decision 360/2020 at 30.03.2026.
const transferRulesSource=fs.readFileSync('transfer/rules.js','utf8');
const transferIndexSource=fs.readFileSync('transfer/index.html','utf8');
const transferRulesPage=fs.readFileSync('transfer/rules.html','utf8');
assert(transferRulesSource.includes("consolidatedAt: '30.03.2026'"),'transfer legal baseline metadata missing');
assert(transferRulesSource.includes("latestAmendment: 'Ordinul ANP nr. 105/2026'"),'latest profile amendment metadata missing');
for (const annex of [1,2,3,4,5,6,7,8]) assert(transferRulesPage.includes(`Anexa ${annex} –`),`rules page missing Annex ${annex}`);
assert(transferIndexSource.includes('Custodie A.P. permanentă'),'AP permanent-custody semantics not explicit');
const rahovaBlock=transferRulesSource.slice(transferRulesSource.indexOf('// ---------- 9. Penitenciarul București-Rahova ----------'),transferRulesSource.indexOf('// ---------- 10.'));
const giurgiuBlock=transferRulesSource.slice(transferRulesSource.indexOf('// ---------- 20. Penitenciarul Giurgiu ----------'),transferRulesSource.indexOf('// ---------- 21.'));
assert(/custodieArestati:[\s\S]*?masculin:[\s\S]*?minor: \[\]/.test(rahovaBlock),'Rahova incorrectly profiles male minors as permanent AP custody');
assert(/custodieArestati:[\s\S]*?masculin:[\s\S]*?minor: \[\]/.test(giurgiuBlock),'Giurgiu incorrectly profiles male minors as permanent AP custody');
'''
if 'Transfer profile compliance' not in s: s += extra
p.write_text(s,encoding='utf-8')
