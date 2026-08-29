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
    try {
        const calc = window.lastCalculation;
        if (!calc) {
            alert('Nu există rezultate de calcul. Apasă întâi „CALCULEAZĂ”.');
            return '';
        }

        // Sex
        const sexText = calc.sex === 'M' ? 'MASCULIN' : 'FEMININ';

        // Data nașterii
        const birthDateStr = fmtDate(calc.birthDate);

        // Durata pedepsei
        let sentence = '';
        if (calc.life) {
            sentence = 'detențiunea pe viață';
        } else {
            const src = calc.duration || { y: 0, m: 0, d: 0 };
            const parts = [];
            if (src.y > 0) parts.push(`${src.y} ani`);
            if (src.m > 0) parts.push(`${src.m} luni`);
            if (src.d > 0) parts.push(`${src.d} zile`);
            sentence = parts.join(', ') || '0 zile';
        }

        // Data începerii și expirarea reală
        const startDateStr = fmtDate(calc.startDate);
        const realExpStr = fmtDate(calc.realExp);

        // Perioade deduse (fără recursul compensatoriu)
        const dedIntervals = calc.dedIntervals || [];
        const dedPeriodsDays = sumIntervals(dedIntervals);
        const dedPeriods = [];
        dedIntervals.forEach(([s, e]) => {
            const days = daysBetween(s, e) + 1;
            dedPeriods.push(`${fmtDate(s)}-${fmtDate(e)}`);
        });

        // Text pentru perioadele deduse (singular/plural)
        let dedPeriodsDisplay = '';
        if (dedPeriods.length === 1) {
            dedPeriodsDisplay = ` (perioada ${dedPeriods[0]})`;
        } else if (dedPeriods.length > 1) {
            dedPeriodsDisplay = ` (perioadele ${dedPeriods.join(', ')})`;
        }

        // Recurs compensatoriu separat
        const recursDays = calc.recursDays || 0;

        // Perioade adăugate
        const nonRowsData = calc.nonRowsData || [];
        const nonTotal = nonRowsData.reduce((sum, p) => sum + p.days, 0);
        const nonPeriods = nonRowsData.map(p => `${p.start}-${p.end} (${mapNonExecType(p.type)})`);
        const nonPeriodsDisplay = nonPeriods.length > 0 ? ` (${nonPeriods.join(', ')})` : '';

        // Recurs text
        let recursText;
        if (recursDays > 0) {
            const totalDedDays = dedPeriodsDays + recursDays;
            recursText = `A beneficiat de un număr de ${recursDays} zile deduse ca urmare a recursului compensatoriu (Legea nr. 169/2017), totalizand in ${totalDedDays} de zile deduse.`;
        } else {
            recursText = 'Nu a beneficiat de prevederile Legii nr. 169/2017.';
        }

        // Articol
        const art = calc.art || '';
        const articleMap = {
            NCP100: 'art. 100 din Codul penal',
            NCP99: 'art. 99 din Codul penal',
            NCP124: 'art. 124 din Codul penal',
            NCP125: 'art. 125 din Codul penal',
            VCP59: 'art. 59 din Codul penal',
            VCP591: 'art. 59¹ din Codul penal',
            VCP602: 'art. 60 alin. 2 din Codul penal',
            VCP603: 'art. 60 alin. 3 din Codul penal'
        };
        const articleText = articleMap[art] || 'articolul aplicabil';

        // Fracția propozabilă
        const tDateStr = fmtDate(calc.tDate);
        const tDays = calc.tDays;

        // Termenul de reanalizare 1/5
        const fDateStr = fmtDate(calc.fDate);
        const fifth = calc.fifth;

        // Construiește textul final EXACT conform modelului, fără zile muncite
        return `În această speță, o persoană privată de libertate de sex ${sexText}, născută la ${birthDateStr} este condamnată la pedeapsa inchisorii rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDateStr} și expiră în termen la data de ${realExpStr}, fiind deduse un număr de ${dedPeriodsDays} zile${dedPeriodsDisplay} și adăugate un număr de ${nonTotal} zile${nonPeriodsDisplay}. ${recursText} Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDateStr}, după executarea a ${tDays} zile. Termenul de reanalizare (1/5) este data de ${fDateStr}, după executarea a ${fifth} zile.`;
    } catch (e) {
        alert('Eroare la construirea textului: ' + e.message);
        return '';
    }
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
    const content = document.getElementById('resultsContent');
    if (!content || content.innerHTML.trim() === '') {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return null;
    }

    const data = getInputData();
    const inputHTML = buildInputDataHTML(data);

    const contentClone = content.cloneNode(true);
    contentClone.querySelectorAll('input').forEach(input => {
        input.setAttribute('value', input.value);
    });
    // Observațiile sunt deja afișate în secțiunea "DATE INTRODUSE" (inputHTML,
    // mai jos); app.js le inserează și la începutul #resultsContent, deci le
    // eliminăm din clonă aici ca să nu apară duplicat în pagina de export.
    removeObservationsBlock(contentClone);
    const resultsHTML = contentClone.innerHTML;

    const stepsHTML = buildStepsHTML();

    return `<!DOCTYPE html>
<html lang="ro">
    <head>
        <meta charset="UTF-8">
        <title>Calculator Evidență Pedepse - Rezultate</title>
        <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; margin: 16px; font-size: 13px; line-height: 1.4; color: #222; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 16px; }
            .result-section { margin-bottom: 14px; }
            .result-section h4 { font-size: 13px; margin-bottom: 6px; letter-spacing: 0.03em; }
            .result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 6px; }
            .result-item { border: 1px solid #ddd; border-radius: 4px; padding: 6px 8px; break-inside: avoid; }
            .result-label { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
            .result-value { font-size: 13px; font-weight: bold; color: #111; }
            .fraction { font-size: 14px; }
            .toolbar { text-align: center; margin-bottom: 16px; }
            .toolbar button {
                font-size: 13px; padding: 8px 16px; margin: 0 4px; cursor: pointer;
                border: 1px solid #888; border-radius: 4px; background: #f2f2f2;
            }
            .toolbar button:hover { background: #e2e2e2; }
            .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #888; }
            @media print { .toolbar { display: none; } }
        </style>
    </head>
    <body>
        <div class="toolbar">
            <button onclick="window.print()">Printează / Salvează ca PDF</button>
            <button onclick="window.close()">Închide</button>
        </div>
        <h1>CALCULATOR EVIDENȚĂ PEDEPSE - REZULTATE</h1>
        ${inputHTML}
        ${resultsHTML}
        ${stepsHTML}
        <div class="footer">Calculator termene pedepse privative de libertate | BETA 0.01 | © Alin Talfeș</div>
    </body>
</html>`;
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
