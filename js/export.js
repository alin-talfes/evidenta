// ========== EXPORT / COPIERE / PAGINĂ REZULTATE ==========

/**
 * Traduce tipul perioadei adăugate.
 */
function mapNonExecType(type) {
    switch (type) {
        case 'escape': return 'Evadare';
        case 'illness': return 'Boală';
        case 'interruption': return 'Întrerupere';
        default: return type;
    }
}

/**
 * Construiește textul narativ pentru copiere, fără referire la zilele muncite.
 * Folosește datele stocate în window.lastCalculation (setat în app.js).
 *
 * Notă: pentru a evita neconcordanța între durata afișată în text și durata
 * curentă din formular (dacă utilizatorul o modifică după calcul, fără să
 * apese din nou „CALCULEAZĂ”), se preferă calc.duration dacă există în
 * window.lastCalculation. Ideal, app.js ar trebui să seteze:
 *   calc.duration = { y, m, d } la momentul calculului.
 */
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

/**
 * Copiază textul narativ în clipboard.
 */
function copyResults() {
    const text = buildNarrativeText();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Rezultatul a fost copiat în clipboard.');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

/**
 * Metodă de rezervă pentru copiere.
 */
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Rezultatul a fost copiat în clipboard.');
    } catch (e) {
        alert('Copierea a eșuat: ' + e.message);
    }
    document.body.removeChild(textarea);
}

/**
 * Colectează datele introduse pentru pagina de rezultate.
 * Rândurile complet goale (fără dată de început/sfârșit) sunt eliminate.
 */
function getInputData() {
    if (window.lastCalculation?.inputData) return JSON.parse(JSON.stringify(window.lastCalculation.inputData));
    const dedRows = Array.from(document.querySelectorAll('.deduction-row'))
        .map(r => ({
            start: r.querySelector('.ded-start')?.value.trim() || '',
            end: r.querySelector('.ded-end')?.value.trim() || ''
        }))
        .filter(r => r.start || r.end);

    const nonRows = Array.from(document.querySelectorAll('.non-exec-row'))
        .map(r => ({
            type: r.querySelector('.ne-type')?.value || '',
            start: r.querySelector('.ne-start')?.value.trim() || '',
            end: r.querySelector('.ne-end')?.value.trim() || ''
        }))
        .filter(r => r.start || r.end);

    return {
        sex: currentSex === 'M' ? 'Masculin' : 'Feminin',
        birthDate: document.getElementById('birthDate').value.trim(),
        observations: document.getElementById('observations').value.trim(),
        life: document.getElementById('lifeSentence').checked,
        art: document.getElementById('liberationArticle').value,
        y: document.getElementById('durYears').value,
        m: document.getElementById('durMonths').value,
        d: document.getElementById('durDays').value,
        start: document.getElementById('startDate').value.trim(),
        condRelease: document.getElementById('conditionalReleaseDate').value.trim(),
        dedRows,
        manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
        nonRows
    };
}

/**
 * Elimină blocul de Observații pe care app.js îl inserează la începutul
 * #resultsContent (înaintea oricărei .result-section), pentru a evita
 * dublarea lui în pagina de export — Observațiile rămân doar în secțiunea
 * "DATE INTRODUSE" construită de buildInputDataHTML.
 */
function removeObservationsBlock(contentClone) {
    const firstChild = contentClone.firstElementChild;
    if (
        firstChild &&
        firstChild.classList.contains('result-item') &&
        !firstChild.classList.contains('result-section') &&
        firstChild.querySelector('.result-label')?.textContent.trim() === 'Observații'
    ) {
        firstChild.remove();
    }
}

/**
 * Construiește HTML pentru datele introduse. Toate valorile provenite din
 * câmpuri libere (observații, date etc.) sunt escapate înainte de inserare.
 */
function buildInputDataHTML(data) {
    let html = '<div class="result-section"><h4>DATE INTRODUSE</h4><div class="result-grid">';
    html += `<div class="result-item"><div class="result-label">Sex</div><div class="result-value">${escapeHtml(data.sex)}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data nașterii</div><div class="result-value">${escapeHtml(data.birthDate) || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Observații</div><div class="result-value">${escapeHtml(data.observations) || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Articol LC</div><div class="result-value">${escapeHtml(data.art) || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Detențiune pe viață</div><div class="result-value">${data.life ? 'Da' : 'Nu'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Durată</div><div class="result-value">${escapeHtml(String(data.y))} ani, ${escapeHtml(String(data.m))} luni, ${escapeHtml(String(data.d))} zile</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data începerii</div><div class="result-value">${escapeHtml(data.start) || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data liberării condiționate</div><div class="result-value">${escapeHtml(data.condRelease) || '—'}</div></div>`;

    if (data.dedRows.length > 0) {
        html += '<div class="result-item" style="grid-column:span 2;"><div class="result-label">Perioade deduse</div><div class="result-value">';
        data.dedRows.forEach((r, i) => html += `${i + 1}. ${escapeHtml(r.start)} - ${escapeHtml(r.end)}<br>`);
        html += '</div></div>';
    }
    if (data.manDed.length > 0) {
        html += '<div class="result-item"><div class="result-label">Recurs compensatoriu</div><div class="result-value">';
        data.manDed.forEach((v, i) => { if (parseInt(v) > 0) html += `${i + 1}. ${escapeHtml(String(v))} zile<br>`; });
        html += '</div></div>';
    }
    if (data.nonRows.length > 0) {
        html += '<div class="result-item" style="grid-column:span 2;"><div class="result-label">Perioade adăugate</div><div class="result-value">';
        data.nonRows.forEach((r, i) => html += `${i + 1}. ${escapeHtml(mapNonExecType(r.type))} (${escapeHtml(r.start)} - ${escapeHtml(r.end)})<br>`);
        html += '</div></div>';
    }

    html += '</div></div>';
    return html;
}

/**
 * Construiește HTML-ul pașilor de calcul.
 */
function buildStepsHTML() {
    const stepsList = document.getElementById('stepsList');
    if (!stepsList || stepsList.children.length === 0) return '';
    return `<div class="result-section"><h4>PAȘII CALCULULUI</h4><ol>${stepsList.innerHTML}</ol></div>`;
}

/**
 * Construiește documentul HTML complet al paginii de rezultate.
 */
function buildResultsPageHTML() {
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

/**
 * Deschide rezultatele într-o pagină nouă (tab nou).
 *
 * Notă tehnică: NU se folosește un Blob URL deschis via <a target="_blank">.
 * Chrome deschide adesea tab-urile noi într-un proces de renderare separat
 * de cel care a creat Blob-ul, iar acesta rămâne inaccesibil în noul context
 * — tab-ul apare gol, fără eroare vizibilă. E o limitare specifică Chrome,
 * nu are legătură cu găzduirea pe GitHub Pages (care e oricum statică).
 *
 * În schimb: window.open('', '_blank') se apelează SINCRON, direct din
 * click-ul utilizatorului (păstrează "user activation", deci nu e blocat de
 * popup blocker), iar conținutul se scrie cu document.write în fereastra
 * respectivă — funcționează identic pe orice hosting static, GitHub Pages
 * inclusiv, fără server.
 *
 * Dacă totuși fereastra e blocată (ex: alt blocker de extensie), se oferă
 * un fallback: descărcarea rezultatelor ca fișier .html, pe care
 * utilizatorul îl poate deschide manual.
 */
function exportPDF() {
    let html;
    try {
        html = buildResultsPageHTML();
        if (!html) return;
    } catch (e) {
        alert('Eroare la construirea paginii de rezultate: ' + e.message);
        return;
    }

    const resultWindow = window.open('', '_blank');
    if (resultWindow) {
        resultWindow.document.open();
        resultWindow.document.write(html);
        resultWindow.document.close();
        resultWindow.focus();
        return;
    }

    // Fallback: fereastra a fost blocată — descarcă rezultatele ca fișier HTML.
    try {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rezultate-calculator-pedepse.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        alert('Fereastra nouă a fost blocată de browser. Am descărcat rezultatele ca fișier HTML — deschide-l din Descărcări.');
    } catch (e) {
        alert('Eroare la deschiderea paginii de rezultate: ' + e.message);
    }
}
