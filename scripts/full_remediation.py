from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')

def write(path, text):
    Path(path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing marker: {label}')
    return text.replace(old, new, 1)

# -----------------------------------------------------------------------------
# Favicon: geometric EV, optically centered around x=256 and robust at 16-32px.
# -----------------------------------------------------------------------------
write('favicon-ev-2.svg', '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="EV">
  <defs>
    <linearGradient id="bg" x1="72" y1="56" x2="440" y2="456" gradientUnits="userSpaceOnUse">
      <stop stop-color="#182844"/>
      <stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="ring" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
      <stop stop-color="#4f8cff"/>
      <stop offset="1" stop-color="#2dd4bf"/>
    </linearGradient>
  </defs>
  <rect x="28" y="28" width="456" height="456" rx="112" fill="url(#bg)"/>
  <rect x="49" y="49" width="414" height="414" rx="93" fill="none" stroke="url(#ring)" stroke-width="14"/>
  <g fill="#f4f7fb" aria-hidden="true">
    <path d="M126 150h132v44h-82v40h72v42h-72v42h84v44H126V150Z"/>
    <path d="M270 150h52l54 148 54-148h52l-81 212h-50L270 150Z"/>
  </g>
  <circle cx="418" cy="101" r="14" fill="#2dd4bf"/>
</svg>
''')

# -----------------------------------------------------------------------------
# Transfer pages: actions ABOVE title/header, shared manifest, remove legacy gold.
# -----------------------------------------------------------------------------
for path in ['transfer/index.html', 'transfer/rules.html']:
    s = read(path)
    if '<link rel="manifest"' not in s:
        marker = '<link rel="mask-icon" href="../favicon-ev-2.svg" color="#4f8cff">'
        s = replace_once(s, marker, marker + '\n    <link rel="manifest" href="../manifest.json">', f'{path} manifest')
    s = s.replace('var(--gold-light)', 'var(--accent-strong)').replace('var(--gold)', 'var(--accent)')
    write(path, s)

s = read('transfer/index.html')
actions = '''        <div class="page-actions transfer-page-actions">
            <a class="btn btn-outline" href="rules.html">REGULI TRANSFER</a>
            <button id="themeToggle" aria-label="Schimbă tema">🌙</button>
        </div>

'''
s = s.replace(actions, '', 1)
marker = '        <!-- ========== HEADER ========== -->\n'
s = replace_once(s, marker, actions + marker, 'transfer actions before header')
write('transfer/index.html', s)

s = read('transfer/rules.html')
actions_rules = '''    <div class="page-actions transfer-page-actions transfer-page-actions--theme-only">
        <button id="themeToggle" aria-label="Schimbă tema">🌙</button>
    </div>

'''
s = s.replace(actions_rules, '', 1)
new_rules_actions = '''    <div class="page-actions transfer-page-actions">
        <a class="btn btn-outline" href="./">ÎNAPOI LA TRANSFER</a>
        <button id="themeToggle" aria-label="Schimbă tema">🌙</button>
    </div>

'''
marker = '    <!-- ========== HEADER ========== -->\n'
s = replace_once(s, marker, new_rules_actions + marker, 'rules actions before header')
s = s.replace('<div class="subtitle">Toate anexele – Decizia 360/2020</div>', '<div class="subtitle">Anexe și reguli operaționale utilizate – Decizia 360/2020</div>')
write('transfer/rules.html', s)

# Legacy version loader in Transfer conflicts with centralized version.js.
for path in ['transfer/app.js', 'transfer/rules-page.js']:
    s = read(path)
    s = re.sub(
        r'\s*// =+\n\s*// 0\. ÎNCĂRCARE VERSIUNE DIN version\.json\n\s*// =+\n\s*const versionDisplay[\s\S]*?\n\s*// =+\n\s*// 1\.',
        '\n            // ============================================================\n            // 1.',
        s,
        count=1
    )
    # Avoid claiming legal recommendation based only on sorting heuristic.
    if path.endswith('app.js'):
        s = s.replace("const reason = isBest ? 'Cea mai bună potrivire' : 'Alternativă';", "const reason = isBest ? 'Potrivire prioritară după criteriile tehnice' : 'Alternativă compatibilă';")
        s = s.replace("const tag = isBest ? 'Recomandat' : 'Posibil';", "const tag = isBest ? 'Prioritar' : 'Compatibil';")
        s = s.replace('Cea mai bună potrivire este evidențiată.', 'Prima potrivire după criteriile tehnice de sortare este evidențiată; aceasta nu reprezintă o prioritate juridică autonomă.')
    write(path, s)

# -----------------------------------------------------------------------------
# Theme and common HTML/PWA consistency.
# -----------------------------------------------------------------------------
s = read('js/theme.js').replace("meta.content = isLight ? '#ffffff' : '#061426';", "meta.content = isLight ? '#ffffff' : '#0b1220';")
write('js/theme.js', s)

for path in ['termene.html', 'contopiri.html']:
    s = read(path)
    if '<link rel="manifest"' not in s:
        marker = '<link rel="mask-icon" href="./favicon-ev-2.svg" color="#4f8cff">'
        s = replace_once(s, marker, marker + '\n    <link rel="manifest" href="manifest.json">', f'{path} manifest')
    write(path, s)

# Main page already has manifest. Replace remaining legacy color token.
s = read('index.html').replace('style="color:var(--gold);"', 'style="color:var(--accent-strong);"')
write('index.html', s)

# -----------------------------------------------------------------------------
# rules.js: expose structured metadata without changing fractions/dates.
# -----------------------------------------------------------------------------
s = read('js/rules.js')
s = s.replace("lifeThreshold: true, ageTransitionApplied: false", "lifeThreshold: true, ageTransitionApplied: false, ageRegime: 'life', ageThresholdYears: null")
s = s.replace("birthday60,\n            ageTransitionApplied: m.transitionApplied || t.transitionApplied,", "birthday60,\n            ageRegime: usedElder ? 'elderly' : 'young', ageThresholdYears: 60,\n            ageTransitionApplied: m.transitionApplied || t.transitionApplied,")
s = s.replace("elderlyBirthday: birthday,\n            ageTransitionApplied: m.transitionApplied || t.transitionApplied,", "elderlyBirthday: birthday,\n            ageRegime: usedElder ? 'elderly' : 'young', ageThresholdYears: currentSex === 'F' ? 55 : 60,\n            ageTransitionApplied: m.transitionApplied || t.transitionApplied,")
write('js/rules.js', s)

# -----------------------------------------------------------------------------
# app.js: detailed LC explanation + life reanalysis + correct VCP age wording.
# -----------------------------------------------------------------------------
s = read('js/app.js')
helper = r'''
function buildLcDetails({ life, art, schedule, sentenceOver10, sex }) {
    const labels = {
        NCP100: 'NCP art. 100', NCP99: 'NCP art. 99', NCP124: 'NCP art. 124', NCP125: 'NCP art. 125',
        VCP59: 'VCP art. 59', VCP591: 'VCP art. 59¹', VCP602: 'VCP art. 60 alin. (2)', VCP603: 'VCP art. 60 alin. (3)'
    };
    if (life) return {
        article: 'NCP art. 99', sentenceBand: 'Detențiune pe viață',
        age: 'Condiția de vârstă este verificată potrivit art. 99; pragul temporal utilizat de aplicație este executarea efectivă a 20 de ani (7.305 zile).',
        minimum: `Prag efectiv: ${schedule.mDays} zile. Zilele muncite nu reduc acest prag.`,
        proposed: `Data de împlinire a pragului: ${fmtDate(schedule.tDate)}.`
    };
    const threshold = schedule.ageThresholdYears;
    let age;
    if (art === 'NCP100') {
        age = schedule.ageRegime === 'elderly'
            ? 'Se aplică fracțiile pentru persoana care a împlinit 60 de ani. Regimul favorabil produce efecte cel mai devreme din ziua împlinirii vârstei.'
            : 'Se aplică fracțiile pentru persoana sub 60 de ani. Dacă împlinește 60 de ani înainte de termen, motorul recalculează de la data aniversării.';
    } else if (art === 'VCP59' || art === 'VCP591') {
        age = schedule.ageRegime === 'elderly'
            ? `Articolul VCP rămâne neschimbat; sunt aplicate condițiile aferente pragului de ${threshold} ani (${sex === 'F' ? 'femei' : 'bărbați'}) de la data împlinirii acestuia.`
            : `Articolul VCP rămâne neschimbat; sunt aplicate condițiile anterioare pragului de ${threshold} ani (${sex === 'F' ? 'femei' : 'bărbați'}).`;
    } else {
        age = `Categoria de vârstă este determinată la data de referință prevăzută de motorul articolului ${labels[art] || art}.`;
    }
    return {
        article: labels[art] || art,
        sentenceBand: sentenceOver10 ? '>10 ani' : '≤10 ani',
        age,
        minimum: `${fracStr(schedule.mR)} → ${schedule.mDays} zile. Fracția minimă este limita efectivă și nu poate fi redusă prin zile muncite.`,
        proposed: `${fracStr(schedule.tR)} → ${schedule.tDays} zile. Zilele considerate executate pot reduce data propozabilă numai până la fracția minimă.`
    };
}
'''
marker = '/**\n * Calculează toate datele și afișează rezultatele.\n */'
if helper.strip() not in s:
    s = replace_once(s, marker, helper + '\n' + marker, 'insert LC details helper')

old = """    const { mR, tR, mDays, tDays, mDate, tDate, articleInfo } = schedule;
    steps.push(`Articolul aplicabil: ${articleInfo}.`);"""
new = """    const { mR, tR, mDays, tDays, mDate, tDate, articleInfo } = schedule;
    const lcDetails = buildLcDetails({ life, art, schedule, sentenceOver10, sex: currentSex });
    steps.push(`Articolul aplicabil: ${articleInfo}.`);"""
s = replace_once(s, old, new, 'lc details assignment')
s = s.replace("if (schedule.ageTransitionApplied) steps.push(`La împlinirea vârstei de 60 ani fracțiile se schimbă; noua fracție produce efecte cel mai devreme din chiar ziua împlinirii vârstei.`);", "if (schedule.ageTransitionApplied) steps.push(`La împlinirea pragului de vârstă de ${schedule.ageThresholdYears || 60} ani condițiile se schimbă; noile condiții produc efecte cel mai devreme din chiar ziua împlinirii pragului.`);")

# Reanalysis: 1/5 for fixed term, 6y6m for life.
old = """    // 1/5 se calculează numai pentru un mandat cu durată determinată.
    const fifth = life ? null : Math.floor(totalDays / 5);
    let fDate = null;
    if (!life) fDate = thresholdDate(startDate, fifth, ded, non);"""
new = """    // Reanalizare regim: 1/5 pentru pedeapsa determinată; 6 ani și 6 luni pentru detențiunea pe viață.
    const fifth = life ? null : Math.floor(totalDays / 5);
    let fDate = null;
    let reanalysisLabel = 'Reanalizare 1/5';
    if (!life) {
        fDate = thresholdDate(startDate, fifth, ded, non);
    } else {
        const baseReanalysis = addCalendarSafe(startDate, 6, 6, 0);
        baseReanalysis.setDate(baseReanalysis.getDate() - 1);
        fDate = new Date(baseReanalysis);
        fDate.setDate(fDate.getDate() - ded + non);
        reanalysisLabel = 'Reanalizare 6 ani și 6 luni';
    }"""
s = replace_once(s, old, new, 'reanalysis calculation')
s = s.replace("{ label: 'Termen 1/5', date: fDate },", "{ label: reanalysisLabel, date: fDate },")
s = s.replace("{ label: '1/5 mandat', date: fDate },", "{ label: reanalysisLabel, date: fDate },")

# Replace separate 1/5 section with generic reanalysis section.
pattern = re.compile(r"\s*if \(!life\) html \+= `<div class=\"result-section\"><h4>REANALIZARE 1/5</h4>[\s\S]*?</div></div>`;", re.M)
replacement = """
    html += `<div class="result-section"><h4>REANALIZARE REGIM</h4><div class="result-grid">
        <div class="result-item"><div class="result-label">${reanalysisLabel}</div>
            <div class="result-value">${life ? 'Prag temporal: 6 ani și 6 luni de la începerea executării, ajustat cu perioadele deduse/adăugate.' : `(fără deduceri: ${fifth}z / după deduceri și perioade adăugate: ${daysBetween(startDate, fDate) + 1}z)`}</div>
            <div class="result-label" style="margin-top:4px;">Data împlinirii</div><div class="result-value">${formatDateWithWarning(fDate)}</div>
        </div>
    </div></div>`;"""
s, n = pattern.subn(replacement, s, count=1)
if n != 1:
    raise SystemExit('Could not replace reanalysis result section')

# Rich ALTE DATE.
old_start = """    html += `<div class="result-section"><h4>ALTE DATE</h4><div class="result-grid">
        <div class="result-item"><div class="result-label">Articol LC</div><div class="result-value">${articleInfo}</div></div>
        <div class="result-item"><div class="result-label">${life ? 'Prag LC' : 'Mandat total'}</div><div class="result-value">${life ? `20 ani / ${LC_TWENTY_YEAR_CAP_DAYS} zile` : `${totalDays} zile`}</div></div>
        <div class="result-item"><div class="result-label">Carantină expiră</div><div class="result-value">${formatDateWithWarning(quarantineEnd)}</div></div>
    </div></div>`;"""
new_start = """    html += `<div class="result-section"><h4>ALTE DATE ȘI EXPLICAȚII LC</h4><div class="result-grid">
        <div class="result-item important"><div class="result-label">Articol LC</div><div class="result-value">${lcDetails.article}</div><div class="result-note">${lcDetails.sentenceBand}</div></div>
        <div class="result-item"><div class="result-label">Condiția de vârstă aplicată</div><div class="result-value result-value-small">${lcDetails.age}</div></div>
        <div class="result-item"><div class="result-label">Fracția / pragul minim</div><div class="result-value result-value-small">${lcDetails.minimum}</div></div>
        <div class="result-item"><div class="result-label">Fracția / data propozabilă</div><div class="result-value result-value-small">${lcDetails.proposed}</div></div>
        <div class="result-item"><div class="result-label">${life ? 'Prag LC' : 'Mandat total'}</div><div class="result-value">${life ? `20 ani / ${LC_TWENTY_YEAR_CAP_DAYS} zile` : `${totalDays} zile`}</div></div>
        <div class="result-item"><div class="result-label">${reanalysisLabel}</div><div class="result-value">${formatDateWithWarning(fDate)}</div></div>
        <div class="result-item"><div class="result-label">Carantină expiră</div><div class="result-value">${formatDateWithWarning(quarantineEnd)}</div></div>
    </div></div>`;"""
s = replace_once(s, old_start, new_start, 'other data rich section')

# Persist new structured output for export.
s = s.replace("        articleInfo,\n        fifth,", "        articleInfo,\n        lcDetails,\n        reanalysisLabel,\n        fifth,")
write('js/app.js', s)

# -----------------------------------------------------------------------------
# storage.js: preserve full form state and life article lock.
# -----------------------------------------------------------------------------
s = read('js/storage.js')
# Add preventive fields to save/autosave objects (occurs twice).
s = s.replace("        condRelease: document.getElementById('conditionalReleaseDate').value,\n        dedRows:", "        condRelease: document.getElementById('conditionalReleaseDate').value,\n        masuriRefDate: document.getElementById('masuriRefDate')?.value || '',\n        masuriDays: document.getElementById('masuriDays')?.value || '0',\n        dedRows:")
# Restore fields in both load paths.
s = s.replace("    document.getElementById('conditionalReleaseDate').value = d.condRelease || '';", "    document.getElementById('conditionalReleaseDate').value = d.condRelease || '';\n    if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = d.masuriRefDate || '';\n    if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = d.masuriDays || 0;\n    const articleSelect = document.getElementById('liberationArticle');\n    if (articleSelect) articleSelect.disabled = Boolean(d.life);", 1)
s = s.replace("        document.getElementById('conditionalReleaseDate').value = d.condRelease || '';", "        document.getElementById('conditionalReleaseDate').value = d.condRelease || '';\n        if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = d.masuriRefDate || '';\n        if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = d.masuriDays || 0;\n        const articleSelect = document.getElementById('liberationArticle');\n        if (articleSelect) articleSelect.disabled = Boolean(d.life);", 1)
write('js/storage.js', s)

# -----------------------------------------------------------------------------
# export.js: compact INPUT/OUTPUT copy and one-page-oriented A4 export.
# -----------------------------------------------------------------------------
s = read('js/export.js')
start = s.index('function buildNarrativeText() {')
end = s.index('/**\n * Copiază textul narativ în clipboard.', start)
compact_fn = r'''function buildNarrativeText() {
    const calc = window.lastCalculation;
    if (!calc) {
        alert('Nu există rezultate de calcul. Apasă întâi „CALCULEAZĂ”.');
        return '';
    }
    const input = calc.inputData || {};
    const duration = calc.life ? 'detențiune pe viață' : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;
    const dedPeriods = (calc.dedIntervals || []).map(([a,b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ') || '—';
    const nonPeriods = (calc.nonRowsData || []).map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ') || '—';
    const lc = calc.lcDetails || { article: calc.articleInfo || calc.art || '—', age: '—', minimum: '—', proposed: '—' };
    const lines = [
        'EVIDENȚĂ PPL — REZUMAT',
        `INPUT | Sex: ${calc.sex === 'M' ? 'Masculin' : 'Feminin'} | Naștere: ${fmtDate(calc.birthDate)} | Pedeapsă: ${duration} | Start: ${fmtDate(calc.startDate)}`,
        `INPUT | Articol LC: ${lc.article} | Deduceri: ${calc.ded} zile (${dedPeriods}) | Recurs compensatoriu: ${calc.recursDays || 0} zile | Adăugate: ${calc.non} zile (${nonPeriods})`,
        input.observations ? `INPUT | Observații: ${input.observations}` : null,
        `OUTPUT | Expirare teoretică: ${calc.theorExp ? fmtDate(calc.theorExp) : '—'} | Expirare reală: ${calc.realExp ? fmtDate(calc.realExp) : '—'}`,
        `OUTPUT | Minim LC: ${fmtDate(calc.mDate)} | Propozabilă: ${fmtDate(calc.tDate)}${calc.workDaysResult ? ` | După zile muncite: ${calc.workDaysResult}` : ''}`,
        `OUTPUT | ${calc.reanalysisLabel || 'Reanalizare'}: ${calc.fDate ? fmtDate(calc.fDate) : '—'}`,
        `REGULĂ LC | ${lc.article} | ${lc.sentenceBand || ''} | ${lc.age}`,
        `REGULĂ LC | Minim: ${lc.minimum} | Propozabilă: ${lc.proposed}`
    ].filter(Boolean);
    return lines.join('\n');
}

'''
s = s[:start] + compact_fn + s[end:]

start = s.index('function buildResultsPageHTML() {')
end = s.index('/**\n * Deschide rezultatele într-o pagină nouă', start)
pdf_fn = r'''function buildResultsPageHTML() {
    const calc = window.lastCalculation;
    if (!calc) {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return null;
    }
    const input = calc.inputData || getInputData();
    const lc = calc.lcDetails || { article: calc.articleInfo || calc.art || '—', sentenceBand: '', age: '—', minimum: '—', proposed: '—' };
    const duration = calc.life ? 'Detențiune pe viață' : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;
    const ded = (calc.dedIntervals || []).map(([a,b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ') || '—';
    const non = (calc.nonRowsData || []).map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ') || '—';
    const row = (label, value, cls='') => `<div class="item ${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? '—'))}</strong></div>`;
    const inputHtml = [
        row('Sex', calc.sex === 'M' ? 'Masculin' : 'Feminin'), row('Data nașterii', fmtDate(calc.birthDate)),
        row('Pedeapsă', duration, 'wide'), row('Început executare', fmtDate(calc.startDate)),
        row('Articol LC', lc.article + (lc.sentenceBand ? ` · ${lc.sentenceBand}` : '')),
        row('Perioade deduse', `${calc.ded} zile · ${ded}`, 'wide'),
        row('Recurs compensatoriu', `${calc.recursDays || 0} zile`), row('Perioade adăugate', `${calc.non} zile · ${non}`, 'wide'),
        input.observations ? row('Observații', input.observations, 'wide') : ''
    ].join('');
    const outputHtml = [
        row('Expirare teoretică', calc.theorExp ? fmtDate(calc.theorExp) : '—'), row('Expirare reală', calc.realExp ? fmtDate(calc.realExp) : '—', 'em'),
        row('Fracție minimă / prag', `${fmtDate(calc.mDate)} · ${lc.minimum}`, 'wide'),
        row('Data propozabilă', `${fmtDate(calc.tDate)} · ${lc.proposed}`, 'wide'),
        calc.workDaysResult ? row('Propozabilă după zile muncite', `${calc.workDaysResult} (${calc.workDaysApplied || 0} zile aplicate)`, 'wide') : '',
        row(calc.reanalysisLabel || 'Reanalizare', calc.fDate ? fmtDate(calc.fDate) : '—'),
        row('Condiție vârstă LC', lc.age, 'wide')
    ].join('');
    return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>Evidență PPL — rezultat</title><style>
        @page{size:A4 portrait;margin:7mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#172033;margin:0;font-size:8.8pt;line-height:1.25}h1{font-size:14pt;text-align:center;margin:0 0 5mm}h2{font-size:9.5pt;margin:3mm 0 1.5mm;border-bottom:1px solid #b7c5d6;padding-bottom:1mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm}.item{border:1px solid #d5dfeb;border-radius:2mm;padding:1.7mm 2mm;break-inside:avoid}.item.wide{grid-column:1/-1}.item.em{border-width:1.5px;border-color:#2563eb}.item span{display:block;text-transform:uppercase;font-size:6.8pt;color:#5b6b7f;font-weight:700;letter-spacing:.03em;margin-bottom:.5mm}.item strong{font-size:8.5pt}.note{margin-top:2mm;padding:1.8mm 2mm;background:#f3f6fa;border-radius:2mm;font-size:7.4pt}.toolbar{text-align:center;margin-bottom:4mm}.toolbar button{padding:2mm 4mm;margin:0 1mm}.footer{text-align:center;margin-top:3mm;font-size:6.8pt;color:#6f8094}@media print{.toolbar{display:none}body{font-size:8.3pt}h1{margin-bottom:3mm}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Printează / Salvează PDF</button><button onclick="window.close()">Închide</button></div><h1>EVIDENȚĂ PEDEPSE ȘI LIBERARE CONDIȚIONATĂ</h1><h2>DATE INTRODUSE</h2><div class="grid">${inputHtml}</div><h2>REZULTATE</h2><div class="grid">${outputHtml}</div><div class="note"><strong>Regulă LC:</strong> ${escapeHtml(lc.article)} · ${escapeHtml(lc.sentenceBand || '')}<br>${escapeHtml(lc.age)}<br><strong>Minim:</strong> ${escapeHtml(lc.minimum)}<br><strong>Propozabilă:</strong> ${escapeHtml(lc.proposed)}</div><div class="footer">Date generate local în browser · © Alin Talfeș</div></body></html>`;
}

'''
s = s[:start] + pdf_fn + s[end:]
write('js/export.js', s)

# -----------------------------------------------------------------------------
# Contopiri: invalid row aborts whole calculation; clarify arithmetic scope.
# -----------------------------------------------------------------------------
s = read('js/contopiri.js')
s = s.replace("            rows.forEach(row => {", "            let hasInvalidRow = false;\n            rows.forEach(row => {")
s = s.replace("if (![years, months, days].every(v => Number.isSafeInteger(v) && v >= 0)) { alert('Duratele trebuie să fie numere întregi pozitive sau zero.'); return; }", "if (![years, months, days].every(v => Number.isSafeInteger(v) && v >= 0)) { hasInvalidRow = true; return; }")
s = s.replace("            if (concursPenalties.length === 0 && recidivaPenalties.length === 0 && revocarePenalties.length === 0) {", "            if (hasInvalidRow) { alert('Duratele trebuie să fie numere întregi pozitive sau zero. Calculul a fost oprit.'); return; }\n\n            if (concursPenalties.length === 0 && recidivaPenalties.length === 0 && revocarePenalties.length === 0) {")
write('js/contopiri.js', s)
s = read('contopiri.html').replace('Calculează pedeapsa rezultantă pentru concurs, recidivă și resturi de pedeapsă, cu explicația rezultatului.', 'Instrument aritmetic pentru cuantumuri deja calificate juridic de utilizator: concurs, recidivă și resturi. Nu stabilește singur încadrarea juridică a situației.')
write('contopiri.html', s)

# -----------------------------------------------------------------------------
# Termene: do not truncate decimal durations; do not infer time for hourly term.
# Remove misleading "definitive" label and generic recurs preset wording.
# -----------------------------------------------------------------------------
s = read('termene.js')
s = s.replace("const duration = parseInt(document.getElementById('durationInput').value);", "const duration = Number(document.getElementById('durationInput').value);")
s = s.replace("if (isNaN(duration) || duration <= 0) {", "if (!Number.isSafeInteger(duration) || duration <= 0) {")
s = s.replace("            const start = combineRoDateTime(startDateStr, startTimeStr || '00:00');", "            if (unit === 'hours' && !startTimeStr) { alert('Pentru termenele calculate pe ore, completează ora de început.'); return; }\n            const start = combineRoDateTime(startDateStr, startTimeStr || '00:00');")
s = re.sub(r"\s*if \(preset === 'contestatie'\) \{[\s\S]*?\} else \{\s*resultDiv\.innerHTML = `<div class=\"big-result\">TERMEN-LIMITĂ EFECTIV:<br>\$\{displayStr\}</div>`;\s*\}", "\n                resultDiv.innerHTML = `<div class=\"big-result\">TERMEN-LIMITĂ EFECTIV:<br>${displayStr}</div>`;", s, count=1)
write('js/termene.js', s)
s = read('termene.html').replace('<option value="recurs">Recurs – 30 zile</option>', '<option value="recurs">Termen de 30 zile – verifică baza legală concretă</option>')
write('termene.html', s)

# -----------------------------------------------------------------------------
# CSS: explanatory result copy + Transfer action order/spacing. bump v40.
# -----------------------------------------------------------------------------
s = read('css/style.css')
if '.result-note {' not in s:
    s += '''\n/* Detailed calculation explanations */\n.result-note { margin-top: 6px; color: var(--text-light); font-size: .75rem; line-height: 1.45; font-weight: 500; }\n.result-value-small { font-size: .82rem; line-height: 1.48; font-weight: 620; }\n.transfer-page-actions { margin-bottom: 10px; }\n'''
write('css/style.css', s)
for path in ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']:
    s = read(path).replace('style.css?v=39','style.css?v=40')
    write(path, s)

# -----------------------------------------------------------------------------
# README: current module count and HTTP requirement.
# -----------------------------------------------------------------------------
s = read('README.md')
s = s.replace('Proiectul integrează trei module principale:', 'Proiectul integrează patru module principale:')
if '- **Transfer și profilare**' not in s:
    s = s.replace('- **Calculator pedeapsă rezultantă** – calculul contopirilor de pedepse, al recidivei postcondamnatorii și al revocării restului rămas neexecutat.', '- **Calculator pedeapsă rezultantă** – instrument aritmetic pentru cuantumuri deja calificate juridic de utilizator.\n- **Transfer și profilare** – filtrare a unităților compatibile pe baza regulilor și anexelor configurate pentru Decizia nr. 360/2020.')
s = s.replace('2. Deschide fișierul `index.html` într-un browser modern.', '2. Servește directorul prin HTTP/HTTPS (de exemplu GitHub Pages sau un server static local) și deschide pagina principală. `version.json` este încărcat prin `fetch`, deci deschiderea directă prin `file://` nu oferă experiența completă.')
write('README.md', s)

# -----------------------------------------------------------------------------
# Tests: cache v40 and regression assertions for remediations.
# -----------------------------------------------------------------------------
s = read('tests/run-tests.js').replace('style\\.css\\?v=39', 'style\\.css\\?v=40')
extra = r'''

// Remediere audit 2026-08: Transfer, theme, export, reanalizare, validări.
const transferApp=fs.readFileSync('transfer/app.js','utf8');
const transferRulesPage=fs.readFileSync('transfer/rules-page.js','utf8');
assert(!transferApp.includes('versionDisplay'),'Transfer app must use centralized version.js only');
assert(!transferRulesPage.includes('versionDisplay'),'Transfer rules page must use centralized version.js only');
assert(transferApp.includes('Potrivire prioritară după criteriile tehnice'));
assert(fs.readFileSync('js/theme.js','utf8').includes("'#0b1220'"),'theme-color must match palette');
assert(fs.readFileSync('js/export.js','utf8').includes('EVIDENȚĂ PPL — REZUMAT'));
assert(fs.readFileSync('js/export.js','utf8').includes('DATE INTRODUSE'));
assert(fs.readFileSync('js/app.js','utf8').includes('Reanalizare 6 ani și 6 luni'));
assert(fs.readFileSync('js/app.js','utf8').includes('ALTE DATE ȘI EXPLICAȚII LC'));
assert(fs.readFileSync('js/contopiri.js','utf8').includes('hasInvalidRow'));
assert(fs.readFileSync('js/termene.js','utf8').includes('Number.isSafeInteger(duration)'));
assert(fs.readFileSync('js/termene.js','utf8').includes('Pentru termenele calculate pe ore'));
for(const f of ['termene.html','contopiri.html','transfer/index.html','transfer/rules.html']) assert(fs.readFileSync(f,'utf8').includes('rel="manifest"'),f+' missing manifest');
'''
if 'Remediere audit 2026-08' not in s:
    s = s.replace("console.log('All audit regression tests passed.');", extra + "\nconsole.log('All audit regression tests passed.');")
write('tests/run-tests.js', s)

print('Full remediation patch applied successfully.')
