from pathlib import Path

# CSS: anchor saved-case badge to LOAD button and size correctly for multiple digits.
p=Path('css/style.css'); s=p.read_text(encoding='utf-8')
old='.badge { position: absolute; transform: translate(10px,-15px); min-width: 20px; height: 20px; padding: 0 5px; display: inline-flex; align-items: center; justify-content: center; color: #fff; background: var(--accent); border-radius: 999px; font-size: .65rem; font-weight: 800; }'
new='''#loadBtn { position: relative; overflow: visible; }\n.badge {\n    position: absolute;\n    top: -8px;\n    right: -8px;\n    min-width: 20px;\n    height: 20px;\n    padding: 0 5px;\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    color: #fff;\n    background: var(--accent);\n    border: 2px solid var(--card-bg);\n    border-radius: 999px;\n    box-shadow: 0 2px 7px rgba(0,0,0,.28);\n    font-size: .62rem;\n    font-weight: 850;\n    line-height: 1;\n    letter-spacing: 0;\n    z-index: 2;\n    pointer-events: none;\n}'''
if old not in s: raise SystemExit('badge rule not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# App snapshot: preserve raw fraction-day thresholds without deductions.
p=Path('js/app.js'); s=p.read_text(encoding='utf-8')
s=s.replace('        tDays,\n        tDate,', '        mDays,\n        tDays,\n        tDate,', 1)
p.write_text(s,encoding='utf-8')

# Copy summary: strict INPUT / OUTPUT only. Keep the PDF/export implementation untouched.
p=Path('js/export.js'); s=p.read_text(encoding='utf-8')
start=s.find('function buildNarrativeText() {')
end=s.find('\nfunction fallbackCopy', start)
if start < 0 or end < 0: raise SystemExit('buildNarrativeText block not found')
new_fn=r'''function buildNarrativeText() {
    const calc = window.lastCalculation;
    if (!calc) {
        alert('Nu există rezultate de calcul. Apasă întâi „CALCULEAZĂ”.');
        return '';
    }

    const input = calc.inputData || {};
    const dedPeriodDays = Array.isArray(calc.dedIntervals) ? sumIntervals(calc.dedIntervals) : 0;
    const dedPeriods = Array.isArray(calc.dedIntervals) && calc.dedIntervals.length
        ? calc.dedIntervals.map(([a, b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ')
        : '—';
    const recursDays = Number(calc.recursDays || 0);
    const nonPeriods = Array.isArray(calc.nonRowsData) && calc.nonRowsData.length
        ? calc.nonRowsData.map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ')
        : '—';
    const duration = calc.life
        ? 'Detențiune pe viață'
        : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;

    const fractionText = (ratio) => {
        if (!Number.isFinite(ratio)) return '—';
        const known = [[1/100,'1/100'],[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
        const found = known.find(([value]) => Math.abs(value - ratio) < 1e-9);
        return found ? found[1] : String(ratio);
    };

    const inputLines = [
        'INPUT',
        `DATA NAȘTERII: ${input.birthDate || fmtDate(calc.birthDate) || '—'}`,
        `ARTICOL LIBERARE: ${calc.art || input.art || '—'}`,
        `DATA ÎNCEPERII PEDEPSEI: ${input.start || fmtDate(calc.startDate) || '—'}`,
        `PERIOADA: ${duration}`,
        `ZILE DEDUSE: ${dedPeriodDays} zile | PERIOADE: ${dedPeriods}`,
        `ZILE LEGEA 169/2017: ${recursDays} zile`,
        `ZILE ADĂUGATE: ${calc.non || 0} zile | PERIOADE: ${nonPeriods}`
    ];

    const outputLines = [
        'OUTPUT',
        `EXPIRARE REALĂ: ${calc.realExp ? fmtDate(calc.realExp) : '—'}`,
        `FRACȚIE MINIMĂ: ${calc.life ? 'prag 20 ani' : fractionText(calc.mR)} = ${calc.mDays ?? '—'} zile fără deduceri | DATA: ${calc.mDate ? fmtDate(calc.mDate) : '—'}`,
        `FRACȚIE PROPOZABILĂ: ${calc.life ? 'prag 20 ani' : fractionText(calc.tR)} = ${calc.tDays ?? '—'} zile fără deduceri | DATA: ${calc.tDate ? fmtDate(calc.tDate) : '—'}`,
        `PROPOZABILĂ DUPĂ ZILE MUNCITE: ${calc.life ? '—' : (calc.workDaysResult || fmtDate(calc.tDate) || '—')}${calc.life ? '' : ` | ZILE MUNCITE APLICATE: ${calc.workDaysApplied || 0}`}`,
        `1/5: ${calc.life ? '—' : `${calc.fifth ?? '—'} zile fără deduceri | DATA: ${calc.fDate ? fmtDate(calc.fDate) : '—'}`}`
    ];

    return inputLines.join('\n') + '\n\n' + outputLines.join('\n');
}
'''
s=s[:start]+new_fn+s[end:]
p.write_text(s,encoding='utf-8')

# Badge count display.
p=Path('js/storage.js'); s=p.read_text(encoding='utf-8')
s=s.replace('        badge.textContent = count;', "        badge.textContent = count > 999 ? '999+' : String(count);\n        badge.setAttribute('aria-label', `${count} spețe salvate`);",1)
s=s.replace("        badge.classList.add('hidden');", "        badge.classList.add('hidden');\n        badge.removeAttribute('aria-label');",1)
p.write_text(s,encoding='utf-8')

# Cache bump CSS.
for f in ['index.html','termene.html','contopiri.html','transfer/index.html','transfer/rules.html']:
    p=Path(f); x=p.read_text(encoding='utf-8').replace('style.css?v=40','style.css?v=41'); p.write_text(x,encoding='utf-8')

# Tests: retire the old narrative heading and assert the new strict copy contract.
p=Path('tests/run-tests.js'); s=p.read_text(encoding='utf-8').replace('style\\.css\\?v=40','style\\.css\\?v=41')
s=s.replace("assert(fs.readFileSync('js/export.js','utf8').includes('EVIDENȚĂ PPL — REZUMAT'));\n", '')
extra=r'''
const exportSource=fs.readFileSync('js/export.js','utf8');
assert(exportSource.includes('DATE INTRODUSE'),'PDF input section disappeared');
assert(exportSource.includes('ZILE LEGEA 169/2017'),'copy input missing Law 169 days');
assert(exportSource.includes('zile fără deduceri'),'copy output missing raw fraction days');
assert(exportSource.includes('EXPIRARE REALĂ'),'copy output missing real expiry');
assert(exportSource.includes('PROPOZABILĂ DUPĂ ZILE MUNCITE'),'copy output missing work-day result');
assert(!/cleanOutput\s*=\s*content\.innerText/.test(exportSource),'copy still copies full visible results');
const appAfter=fs.readFileSync('js/app.js','utf8'); assert(/\bmDays,\s*\n\s*tDays,/.test(appAfter),'calculation snapshot missing mDays');
const cssAfter=fs.readFileSync('css/style.css','utf8'); assert(cssAfter.includes('#loadBtn { position: relative; overflow: visible; }'),'saved-case badge is not anchored to load button');
'''
if 'copy input missing Law 169 days' not in s: s += extra
p.write_text(s,encoding='utf-8')
