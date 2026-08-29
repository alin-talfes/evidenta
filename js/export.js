// ========== EXPORT / COPIERE / PAGINĂ REZULTATE ==========

function mapNonExecType(type) {
    switch (type) {
        case 'escape': return 'Evadare';
        case 'illness': return 'Boală';
        case 'interruption': return 'Întrerupere';
        default: return type;
    }
}

function buildNarrativeText() {
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
    return [
        'EVIDENȚĂ PPL — REZUMAT',
        `INPUT | Sex: ${calc.sex === 'M' ? 'Masculin' : 'Feminin'} | Naștere: ${fmtDate(calc.birthDate)} | Pedeapsă: ${duration} | Start: ${fmtDate(calc.startDate)}`,
        `INPUT | Articol LC: ${lc.article}${lc.sentenceBand ? ` · ${lc.sentenceBand}` : ''} | Deduceri: ${calc.ded} zile (${dedPeriods}) | Recurs compensatoriu: ${calc.recursDays || 0} zile | Adăugate: ${calc.non} zile (${nonPeriods})`,
        input.observations ? `INPUT | Observații: ${input.observations}` : null,
        `OUTPUT | Expirare teoretică: ${calc.theorExp ? fmtDate(calc.theorExp) : '—'} | Expirare reală: ${calc.realExp ? fmtDate(calc.realExp) : '—'}`,
        `OUTPUT | Minim LC: ${fmtDate(calc.mDate)} | Propozabilă: ${fmtDate(calc.tDate)}${calc.workDaysResult ? ` | După zile muncite: ${calc.workDaysResult}` : ''}`,
        `OUTPUT | ${calc.reanalysisLabel || 'Reanalizare'}: ${calc.fDate ? fmtDate(calc.fDate) : '—'}`,
        `REGULĂ LC | ${lc.age}`,
        `REGULĂ LC | Minim: ${lc.minimum} | Propozabilă: ${lc.proposed}`
    ].filter(Boolean).join('\n');
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Rezumatul input/output a fost copiat.');
    } catch (e) {
        alert('Copierea a eșuat: ' + e.message);
    }
    document.body.removeChild(textarea);
}

function copyResults() {
    const text = buildNarrativeText();
    if (!text) return;
    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Rezumatul input/output a fost copiat.'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function getInputData() {
    if (window.lastCalculation?.inputData) return JSON.parse(JSON.stringify(window.lastCalculation.inputData));
    const dedRows = Array.from(document.querySelectorAll('.deduction-row')).map(r => ({ start: r.querySelector('.ded-start')?.value.trim() || '', end: r.querySelector('.ded-end')?.value.trim() || '' })).filter(r => r.start || r.end);
    const nonRows = Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({ type: r.querySelector('.ne-type')?.value || '', start: r.querySelector('.ne-start')?.value.trim() || '', end: r.querySelector('.ne-end')?.value.trim() || '' })).filter(r => r.start || r.end);
    return {
        sex: currentSex === 'M' ? 'Masculin' : 'Feminin', birthDate: document.getElementById('birthDate').value.trim(), observations: document.getElementById('observations').value.trim(), life: document.getElementById('lifeSentence').checked, art: document.getElementById('liberationArticle').value,
        y: document.getElementById('durYears').value, m: document.getElementById('durMonths').value, d: document.getElementById('durDays').value, start: document.getElementById('startDate').value.trim(), condRelease: document.getElementById('conditionalReleaseDate').value.trim(), dedRows,
        manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value), nonRows
    };
}

function buildResultsPageHTML() {
    const calc = window.lastCalculation;
    if (!calc) { alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.'); return null; }
    const input = calc.inputData || getInputData();
    const lc = calc.lcDetails || { article: calc.articleInfo || calc.art || '—', sentenceBand: '', age: '—', minimum: '—', proposed: '—' };
    const duration = calc.life ? 'Detențiune pe viață' : `${calc.duration?.y || 0} ani, ${calc.duration?.m || 0} luni, ${calc.duration?.d || 0} zile`;
    const ded = (calc.dedIntervals || []).map(([a,b]) => `${fmtDate(a)}–${fmtDate(b)}`).join('; ') || '—';
    const non = (calc.nonRowsData || []).map(p => `${mapNonExecType(p.type)} ${p.start}–${p.end}`).join('; ') || '—';
    const row = (label, value, cls='') => `<div class="item ${cls}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value ?? '—'))}</strong></div>`;
    const inputHtml = [
        row('Sex', calc.sex === 'M' ? 'Masculin' : 'Feminin'), row('Data nașterii', fmtDate(calc.birthDate)), row('Pedeapsă', duration, 'wide'), row('Început executare', fmtDate(calc.startDate)),
        row('Articol LC', lc.article + (lc.sentenceBand ? ` · ${lc.sentenceBand}` : '')), row('Perioade deduse', `${calc.ded} zile · ${ded}`, 'wide'), row('Recurs compensatoriu', `${calc.recursDays || 0} zile`), row('Perioade adăugate', `${calc.non} zile · ${non}`, 'wide'), input.observations ? row('Observații', input.observations, 'wide') : ''
    ].join('');
    const outputHtml = [
        row('Expirare teoretică', calc.theorExp ? fmtDate(calc.theorExp) : '—'), row('Expirare reală', calc.realExp ? fmtDate(calc.realExp) : '—', 'em'), row('Fracție minimă / prag', `${fmtDate(calc.mDate)} · ${lc.minimum}`, 'wide'), row('Data propozabilă', `${fmtDate(calc.tDate)} · ${lc.proposed}`, 'wide'),
        calc.workDaysResult ? row('Propozabilă după zile muncite', `${calc.workDaysResult} (${calc.workDaysApplied || 0} zile aplicate)`, 'wide') : '', row(calc.reanalysisLabel || 'Reanalizare', calc.fDate ? fmtDate(calc.fDate) : '—'), row('Condiție vârstă LC', lc.age, 'wide')
    ].join('');
    return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8"><title>Evidență PPL — rezultat</title><style>@page{size:A4 portrait;margin:7mm}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#172033;margin:0;font-size:8.8pt;line-height:1.25}h1{font-size:14pt;text-align:center;margin:0 0 5mm}h2{font-size:9.5pt;margin:3mm 0 1.5mm;border-bottom:1px solid #b7c5d6;padding-bottom:1mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm}.item{border:1px solid #d5dfeb;border-radius:2mm;padding:1.7mm 2mm;break-inside:avoid}.item.wide{grid-column:1/-1}.item.em{border-width:1.5px;border-color:#2563eb}.item span{display:block;text-transform:uppercase;font-size:6.8pt;color:#5b6b7f;font-weight:700;letter-spacing:.03em;margin-bottom:.5mm}.item strong{font-size:8.5pt}.note{margin-top:2mm;padding:1.8mm 2mm;background:#f3f6fa;border-radius:2mm;font-size:7.4pt}.toolbar{text-align:center;margin-bottom:4mm}.toolbar button{padding:2mm 4mm;margin:0 1mm}.footer{text-align:center;margin-top:3mm;font-size:6.8pt;color:#6f8094}@media print{.toolbar{display:none}body{font-size:8.3pt}h1{margin-bottom:3mm}}</style></head><body><div class="toolbar"><button onclick="window.print()">Printează / Salvează PDF</button><button onclick="window.close()">Închide</button></div><h1>EVIDENȚĂ PEDEPSE ȘI LIBERARE CONDIȚIONATĂ</h1><h2>DATE INTRODUSE</h2><div class="grid">${inputHtml}</div><h2>REZULTATE</h2><div class="grid">${outputHtml}</div><div class="note"><strong>Regulă LC:</strong> ${escapeHtml(lc.article)} · ${escapeHtml(lc.sentenceBand || '')}<br>${escapeHtml(lc.age)}<br><strong>Minim:</strong> ${escapeHtml(lc.minimum)}<br><strong>Propozabilă:</strong> ${escapeHtml(lc.proposed)}</div><div class="footer">Date generate local · Evidență PPL · © Alin Talfeș</div></body></html>`;
}

function exportPDF() {
    let html;
    try { html = buildResultsPageHTML(); if (!html) return; }
    catch (e) { alert('Eroare la construirea paginii de rezultate: ' + e.message); return; }
    const resultWindow = window.open('', '_blank');
    if (resultWindow) {
        resultWindow.document.open(); resultWindow.document.write(html); resultWindow.document.close(); resultWindow.focus(); return;
    }
    try {
        const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
        link.href = url; link.download = 'rezultate-evidenta-ppl.html'; document.body.appendChild(link); link.click(); document.body.removeChild(link); setTimeout(() => URL.revokeObjectURL(url), 30000);
        alert('Fereastra nouă a fost blocată. Am descărcat pagina compactă de rezultate.');
    } catch (e) { alert('Eroare la deschiderea paginii de rezultate: ' + e.message); }
}
