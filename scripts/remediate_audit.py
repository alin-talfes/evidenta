from pathlib import Path
import re, json

# favicon: optically center EV as a group, remove decorative off-axis dot
p=Path('favicon-ev-2.svg'); s=p.read_text(encoding='utf-8')
s=s.replace('<path d="M142 151h125v42h-77v43h69v40h-69v44h80v42H142V151Z" fill="#f4f7fb"/>\n  <path d="M274 151h52l50 145 50-145h52l-78 211h-49l-77-211Z" fill="#f4f7fb"/>\n  <circle cx="415" cy="102" r="18" fill="#2dd4bf"/>', '<g transform="translate(-18 0)">\n    <path d="M142 151h125v42h-77v43h69v40h-69v44h80v42H142V151Z" fill="#f4f7fb"/>\n    <path d="M274 151h52l50 145 50-145h52l-78 211h-49l-77-211Z" fill="#f4f7fb"/>\n  </g>')
p.write_text(s,encoding='utf-8')

# Transfer buttons above title/header. Remove legacy version fetch blocks.
for f in ['transfer/index.html','transfer/rules.html']:
    p=Path(f); s=p.read_text(encoding='utf-8')
    action=re.search(r'\n\s*<div class="page-actions transfer-page-actions[^>]*>.*?</div>\n',s,re.S)
    if action:
        block=action.group(0)
        s=s[:action.start()]+s[action.end():]
        header=s.find('    <!-- ========== HEADER ========== -->')
        s=s[:header]+block+'\n'+s[header:]
    p.write_text(s,encoding='utf-8')
for f in ['transfer/app.js','transfer/rules-page.js']:
    p=Path(f); s=p.read_text(encoding='utf-8')
    s=re.sub(r'\n\s*// Încarcă versiunea.*?fetch\([^\n]+version\.json[^\n]*\).*?\n\s*\.catch\([^\n]+\);', '', s, flags=re.S)
    # broader known block fallback
    s=re.sub(r'\n\s*const versionDisplay = document\.getElementById\([\'\"]versionDisplay[\'\"]\);.*?\.catch\(.*?\);', '', s, flags=re.S)
    p.write_text(s,encoding='utf-8')

# theme color consistency
p=Path('js/theme.js'); s=p.read_text(encoding='utf-8').replace("'#061426'","'#0b1220'"); p.write_text(s,encoding='utf-8')

# Termene: don't truncate decimals; require explicit time for hour deadlines.
p=Path('js/termene.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const duration = parseInt(document.getElementById('durationInput').value);", "const duration = Number(document.getElementById('durationInput').value);")
needle="const timeValue = document.getElementById('startTime').value || '00:00';"
s=s.replace(needle,"const enteredTime = document.getElementById('startTime').value;\n    if (unit === 'hours' && !enteredTime) { alert('Pentru termenele calculate în ore, completează ora de început.'); return; }\n    const timeValue = enteredTime || '00:00';")
p.write_text(s,encoding='utf-8')

# Contopiri: abort entire calculation if any row is invalid.
p=Path('js/contopiri.js'); s=p.read_text(encoding='utf-8')
start=s.find('function calculateMergedPenalties()')
if start>=0:
    end=s.find('\nfunction ',start+10)
    if end<0: end=len(s)
    fn=s[start:end]
    if 'let hasInvalidRow = false;' not in fn:
        fn=fn.replace("const groups = { concurs: [], recidiva: [], revocare: [] };", "const groups = { concurs: [], recidiva: [], revocare: [] };\n    let hasInvalidRow = false;")
        fn=fn.replace("alert('Valorile trebuie să fie numere întregi pozitive sau zero.');\n            return;", "alert('Valorile trebuie să fie numere întregi pozitive sau zero.');\n            hasInvalidRow = true;\n            return;")
        marker='    });\n\n'
        pos=fn.find(marker)
        if pos>=0: fn=fn[:pos+len(marker)]+"    if (hasInvalidRow) return;\n\n"+fn[pos+len(marker):]
        s=s[:start]+fn+s[end:]
p.write_text(s,encoding='utf-8')

# Storage: restore life/article UI invariant and persist preventive-measure fields.
p=Path('js/storage.js'); s=p.read_text(encoding='utf-8')
s=s.replace("conditionalReleaseDate: document.getElementById('conditionalReleaseDate').value,", "conditionalReleaseDate: document.getElementById('conditionalReleaseDate').value,\n        masuriRefDate: document.getElementById('masuriRefDate')?.value || '',\n        masuriDays: document.getElementById('masuriDays')?.value || '',")
s=s.replace("document.getElementById('conditionalReleaseDate').value = data.conditionalReleaseDate || '';", "document.getElementById('conditionalReleaseDate').value = data.conditionalReleaseDate || '';\n    if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = data.masuriRefDate || '';\n    if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = data.masuriDays || '';\n    const articleSelect = document.getElementById('liberationArticle');\n    if (articleSelect) {\n        if (data.life) { articleSelect.value = 'NCP99'; articleSelect.disabled = true; }\n        else { articleSelect.disabled = false; }\n    }")
p.write_text(s,encoding='utf-8')

# App: richer ALTE DATE; life reanalysis 6y6m; VCP age text uses actual threshold.
p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace("const fifth = life ? null : addDays(start, Math.floor(totalDays / 5) - dedDays + nonExecDays);", "const fifth = life ? addCalendarSafe(start, 6, 6, 0) : addDays(start, Math.floor(totalDays / 5) - dedDays + nonExecDays);")
s=s.replace("if (!life && fifth) html +=", "if (fifth) html +=")
s=s.replace("1/5 pedeapsă", "${life ? 'Reanalizare regim (6 ani și 6 luni)' : '1/5 pedeapsă'}")
s=s.replace("La împlinirea vârstei de 60 ani fracțiile se schimbă", "La împlinirea pragului de vârstă aplicabil (${currentSex === 'F' && (art === 'VCP59' || art === 'VCP591') ? '55' : '60'} ani) fracțiile se schimbă")
# Replace terse article display where present with richer details.
s=s.replace("<div class=\"result-label\">ARTICOL LC</div><div class=\"result-value\">${schedule.articleInfo}", "<div class=\"result-label\">ARTICOL LC</div><div class=\"result-value\">${schedule.articleInfo}<br><span class=\"result-explanation\">Categorie pedeapsă: ${sentenceOver10 ? '&gt;10 ani' : '≤10 ani'}. Fracție minimă: ${formatFraction(schedule.mR)}. Fracție totală/propozabilă: ${formatFraction(schedule.tR)}. Regimul de vârstă este stabilit la data la care condiția poate deveni aplicabilă; zilele considerate executate pot reduce data propozabilă, fără a coborî sub minimul obligatoriu.</span>")
p.write_text(s,encoding='utf-8')

# Export: compact one-page summary + concise clipboard helper appended; replace copy function if found.
p=Path('js/export.js'); s=p.read_text(encoding='utf-8')
s=s.replace("@page { size: A4; margin: 10mm; }", "@page { size: A4 portrait; margin: 7mm; }")
s=s.replace("body { font-family: Arial, sans-serif; margin: 16px; font-size: 13px; line-height: 1.4; color: #222; }", "body { font-family: Arial, sans-serif; margin: 0; font-size: 9.5px; line-height: 1.2; color: #172033; }")
s=s.replace("h1 { text-align: center; font-size: 18px; margin-bottom: 16px; }", "h1 { text-align: center; font-size: 14px; margin-bottom: 7px; }")
s=s.replace(".result-section { margin-bottom: 14px; }", ".result-section { margin-bottom: 6px; break-inside: avoid; }")
s=s.replace(".result-section h4 { font-size: 13px; margin-bottom: 6px;", ".result-section h4 { font-size: 10px; margin-bottom: 3px;")
s=s.replace("minmax(140px, 1fr)); gap: 6px;", "minmax(115px, 1fr)); gap: 3px;")
s=s.replace("padding: 6px 8px;", "padding: 3px 5px;")
s=s.replace("font-size: 10px; text-transform", "font-size: 7.5px; text-transform")
s=s.replace("font-size: 13px; font-weight: bold", "font-size: 9.5px; font-weight: bold")
s=s.replace("${stepsHTML}", "")
s=s.replace("Calculator termene pedepse privative de libertate | BETA 0.01 | © Alin Talfeș", "Evidență PPL | Rezumat calcul | © Alin Talfeș")
# create concise clipboard function, overriding prior definition if one exists later only if named copyResults
idx=s.find('function copyResults')
if idx>=0:
    end=s.find('\nfunction ',idx+10)
    if end<0: end=len(s)
    s=s[:idx]+s[end:]
s += '''\n\nfunction copyResults() {\n    const content = document.getElementById('resultsContent');\n    if (!content || !content.innerText.trim()) { alert('Nu există rezultate. Apasă întâi „CALCULEAZĂ”.'); return; }\n    const d = getInputData();\n    const duration = d.life ? 'detențiune pe viață' : `${d.y || 0}a ${d.m || 0}l ${d.d || 0}z`;\n    const cleanOutput = content.innerText.replace(/\\n{3,}/g, '\\n\\n').trim();\n    const text = `EVIDENȚĂ PPL — REZUMAT\\nINPUT: ${d.sex}; n. ${d.birthDate || '—'}; ${duration}; început ${d.start || '—'}; art. ${d.art || '—'}; deduceri ${d.dedRows.length}; perioade adăugate ${d.nonRows.length}.\\n\\nOUTPUT:\\n${cleanOutput}`;\n    navigator.clipboard.writeText(text).then(() => alert('Rezumatul input/output a fost copiat.')).catch(() => alert('Nu s-a putut copia automat rezultatul.'));\n}\n'''
p.write_text(s,encoding='utf-8')

# CSS: explanation style, remove obsolete gold references by aliases, bump v40.
p=Path('css/style.css'); s=p.read_text(encoding='utf-8')
if '--gold:' not in s:
    s=s.replace('--secondary: #2dd4bf;', '--secondary: #2dd4bf;\n    --gold: var(--accent);\n    --gold-light: var(--accent-strong);')
if '.result-explanation' not in s:
    s += '\n.result-explanation { display:block; margin-top:5px; color:var(--text-light); font-size:.72rem; font-weight:500; line-height:1.45; }\n.transfer-page-actions { margin-top:0; margin-bottom:12px; }\n'
p.write_text(s,encoding='utf-8')
for f in ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']:
    p=Path(f); s=p.read_text(encoding='utf-8').replace('style.css?v=39','style.css?v=40'); p.write_text(s,encoding='utf-8')

# Tests: CSS version and version single-source improvement; add key regressions.
p=Path('tests/run-tests.js'); s=p.read_text(encoding='utf-8').replace('style\\.css\\?v=39','style\\.css\\?v=40')
s=s.replace("assert.equal(versionData.version,'0.168');", "assert.match(versionData.version,/^\\d+\\.\\d+(?:\\.\\d+)?$/);")
s += "\nassert(!fs.readFileSync('transfer/app.js','utf8').includes('versionDisplay'),'transfer app has stale versionDisplay');\nassert(!fs.readFileSync('transfer/rules-page.js','utf8').includes('versionDisplay'),'transfer rules has stale versionDisplay');\nassert(fs.readFileSync('js/theme.js','utf8').includes('#0b1220'),'theme color mismatch');\nassert(fs.readFileSync('js/termene.js','utf8').includes(\"Number(document.getElementById('durationInput').value)\"),'termene truncates decimals');\n"
p.write_text(s,encoding='utf-8')
