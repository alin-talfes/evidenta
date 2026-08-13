// ========== EXPORT / COPIERE / PDF ==========

/**
 * Obține datele de calcul din window.lastCalculation sau le extrage din DOM.
 */
function getCalculationData() {
    if (window.lastCalculation) {
        return window.lastCalculation;
    }
    // Fallback: extragem din DOM (mai puțin fiabil)
    return {
        life: document.getElementById('lifeSentence').checked,
        sex: currentSex,
        birthDate: parseDate(document.getElementById('birthDate').value.trim()),
        startDate: parseDate(document.getElementById('startDate').value.trim()),
        realExp: getRealExpiryFromDOM(),
        ded: null,
        non: null,
        dedIntervals: null,
        nonRowsData: null,
        recursDays: null,
        tDays: getProposableInfo().tDays,
        tDate: parseDate(getProposableInfo().tDate),
        articleInfo: null,
        fifth: getFifthInfo().fifth,
        fDate: parseDate(getFifthInfo().fDate),
        workDaysInput: document.getElementById('workDaysInput')?.value || '0',
        workDaysResult: document.getElementById('workDaysResult')?.value || ''
    };
}

/**
 * Obține data expirării reale din rezultate (fallback).
 */
function getRealExpiryFromDOM() {
    const items = document.querySelectorAll('#resultsContent .result-item');
    for (const item of items) {
        const label = item.querySelector('.result-label')?.innerText || '';
        if (label.includes('Expirare REALĂ')) {
            const val = item.querySelector('.result-value')?.innerText || '';
            return parseDate(val.replace(/\(.*?\)/g, '').trim());
        }
    }
    return null;
}

/**
 * Obține data propozabilă din rezultate (fallback).
 */
function getProposableInfo() {
    const items = document.querySelectorAll('#resultsContent .result-item');
    for (const item of items) {
        const label = item.querySelector('.result-label')?.innerText || '';
        if (label.includes('DATA PROPOZABILĂ')) {
            const values = item.querySelectorAll('.result-value');
            if (values.length >= 2) {
                const firstValue = values[0].innerText || '';
                const match = firstValue.match(/fără deduceri:\s*(\d+)z/);
                const tDays = match ? match[1] : '';
                const tDate = parseDate(values[1].innerText.replace(/\(.*?\)/g, '').trim());
                return { tDays, tDate };
            }
        }
    }
    return { tDays: '', tDate: null };
}

/**
 * Obține data 1/5 din rezultate (fallback).
 */
function getFifthInfo() {
    const items = document.querySelectorAll('#resultsContent .result-item');
    for (const item of items) {
        const label = item.querySelector('.result-label')?.innerText || '';
        if (label.includes('1/5 mandat')) {
            const values = item.querySelectorAll('.result-value');
            if (values.length >= 2) {
                const firstValue = values[0].innerText || '';
                const match = firstValue.match(/fără deduceri:\s*(\d+)z/);
                const fifth = match ? match[1] : '';
                const fDate = parseDate(values[1].innerText.replace(/\(.*?\)/g, '').trim());
                return { fifth, fDate };
            }
        }
    }
    return { fifth: '', fDate: null };
}

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
 * Construiește textul narativ pentru copiere.
 */
function buildNarrativeText() {
    try {
        const calc = getCalculationData();
        if (!calc) {
            alert('Nu există rezultate de calcul. Apasă întâi „CALCULEAZĂ”.');
            return '';
        }

        const sex = calc.sex === 'M' ? 'MASCULIN' : 'FEMININ';
        const birthDate = fmtDate(calc.birthDate);
        const startDate = fmtDate(calc.startDate);
        const realExp = fmtDate(calc.realExp);

        // Durata pedepsei
        let sentence = '';
        if (calc.life) {
            sentence = 'detențiunea pe viață';
        } else {
            const y = parseInt(document.getElementById('durYears').value) || 0;
            const m = parseInt(document.getElementById('durMonths').value) || 0;
            const d = parseInt(document.getElementById('durDays').value) || 0;
            const parts = [];
            if (y > 0) parts.push(`${y} ani`);
            if (m > 0) parts.push(`${m} luni`);
            if (d > 0) parts.push(`${d} zile`);
            sentence = parts.join(', ') || '0 zile';
        }

        // Deduceri (perioade)
        const dedIntervals = calc.dedIntervals || [];
        let dedPeriodsDays = 0;
        const dedPeriods = [];
        dedIntervals.forEach(([s, e]) => {
            const days = daysBetween(s, e) + 1;
            dedPeriodsDays += days;
            dedPeriods.push(`${fmtDate(s)}-${fmtDate(e)}`);
        });
        const dedPeriodsDisplay = dedPeriods.length > 0 ? ` (${dedPeriods.join(', ')})` : '';

        // Recurs compensatoriu
        const recursDays = calc.recursDays || 0;
        const recursText = recursDays > 0 ? `A beneficiat de un număr de ${recursDays} zile deduse ca urmare a recursului compensatoriu (Legea nr. 169/2017)` : 'Nu a beneficiat de prevederile Legii nr. 169/2017';

        // Perioade adăugate
        const nonRowsData = calc.nonRowsData || [];
        const nonTotal = nonRowsData.reduce((sum, p) => sum + p.days, 0);
        const nonPeriods = nonRowsData.map(p => `${p.start}-${p.end} (${mapNonExecType(p.type)})`);
        const nonPeriodsDisplay = nonPeriods.length > 0 ? ` (${nonPeriods.join(', ')})` : '';

        // Articol
        const art = document.getElementById('liberationArticle').value;
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

        // Data propozabilă
        const tDays = calc.tDays;
        const tDate = fmtDate(calc.tDate);

        // Zile muncite
        const workDaysInput = calc.workDaysInput || '0';
        const workDaysResult = calc.workDaysResult || '';
        const workDays = parseInt(workDaysInput) || 0;
        const workText = workDays > 0 ? `Din această dată, s-au scăzut un număr de ${workDays} zile ca urmare a muncii prestate, și data propozabilă a coborât la ${workDaysResult}` : 'Nu au fost scăzute zile ca urmare a muncii prestate';

        // 1/5
        const fifth = calc.fifth;
        const fDate = fmtDate(calc.fDate);

        return `În această speță, o persoană privată de libertate de sex ${sex}, născută la ${birthDate} este condamnată la pedeapsa rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDate} și expiră -în termen- la data de ${realExp}, fiind deduse un număr de ${dedPeriodsDays} zile${dedPeriodsDisplay} și adăugate un număr de ${nonTotal} zile${nonPeriodsDisplay}. ${recursText}. Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDate}, după executarea a ${tDays} zile. ${workText}. Termenul de reanalizare (1/5) este data de ${fDate}, după executarea a ${fifth} zile.`;
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
 * Colectează datele introduse pentru export PDF.
 */
function getInputData() {
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
        dedRows: Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
            start: r.querySelector('.ded-start')?.value.trim() || '',
            end: r.querySelector('.ded-end')?.value.trim() || ''
        })),
        manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
        nonRows: Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
            type: r.querySelector('.ne-type')?.value || '',
            start: r.querySelector('.ne-start')?.value.trim() || '',
            end: r.querySelector('.ne-end')?.value.trim() || ''
        }))
    };
}

/**
 * Construiește HTML pentru datele introduse.
 */
function buildInputDataHTML(data) {
    let html = '<div class="result-section"><h4>DATE INTRODUSE</h4><div class="result-grid">';
    html += `<div class="result-item"><div class="result-label">Sex</div><div class="result-value">${data.sex}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data nașterii</div><div class="result-value">${data.birthDate || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Observații</div><div class="result-value">${data.observations || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Articol LC</div><div class="result-value">${data.art || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Detențiune pe viață</div><div class="result-value">${data.life ? 'Da' : 'Nu'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Durată</div><div class="result-value">${data.y} ani, ${data.m} luni, ${data.d} zile</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data începerii</div><div class="result-value">${data.start || '—'}</div></div>`;
    html += `<div class="result-item"><div class="result-label">Data liberării condiționate</div><div class="result-value">${data.condRelease || '—'}</div></div>`;

    if (data.dedRows.length > 0) {
        html += '<div class="result-item" style="grid-column:span 2;"><div class="result-label">Perioade deduse</div><div class="result-value">';
        data.dedRows.forEach((r, i) => html += `${i + 1}. ${r.start} - ${r.end}<br>`);
        html += '</div></div>';
    }
    if (data.manDed.length > 0) {
        html += '<div class="result-item"><div class="result-label">Recurs compensatoriu</div><div class="result-value">';
        data.manDed.forEach((v, i) => { if (parseInt(v) > 0) html += `${i + 1}. ${v} zile<br>`; });
        html += '</div></div>';
    }
    if (data.nonRows.length > 0) {
        html += '<div class="result-item" style="grid-column:span 2;"><div class="result-label">Perioade adăugate</div><div class="result-value">';
        data.nonRows.forEach((r, i) => html += `${i + 1}. ${r.type} (${r.start} - ${r.end})<br>`);
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
 * Exportă PDF cu date și rezultate.
 */
function exportPDF() {
    try {
        const content = document.getElementById('resultsContent');
        if (!content || content.innerHTML.trim() === '') {
            alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
            return;
        }

        const data = getInputData();
        const inputHTML = buildInputDataHTML(data);

        const contentClone = content.cloneNode(true);
        contentClone.querySelectorAll('input').forEach(input => {
            input.setAttribute('value', input.value);
        });
        const resultsHTML = contentClone.innerHTML;

        const stepsHTML = buildStepsHTML();

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert('Fereastra pop-up a fost blocată. Permite pop-up-urile.');
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Calculator Evidență Pedepse - Rezultate</title>
                    <style>
                        @page { size: A4; margin: 5mm; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { font-family: Arial, sans-serif; margin: 0; font-size: 9px; line-height: 1.3; }
                        h1 { text-align: center; font-size: 14px; margin-bottom: 8px; }
                        .result-section { margin-bottom: 8px; }
                        .result-section h4 { font-size: 10px; margin-bottom: 4px; }
                        .result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 4px; }
                        .result-item { border: 1px solid #ddd; border-radius: 4px; padding: 4px 6px; break-inside: avoid; }
                        .result-label { font-size: 7px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
                        .result-value { font-size: 9px; font-weight: bold; color: #111; }
                        .fraction { font-size: 10px; }
                        .footer { margin-top: 10px; text-align: center; font-size: 7px; color: #888; }
                    </style>
                </head>
                <body>
                    <h1>CALCULATOR EVIDENȚĂ PEDEPSE - REZULTATE</h1>
                    ${inputHTML}
                    ${resultsHTML}
                    ${stepsHTML}
                    <div class="footer">CALCULATOR EVIDENȚĂ PEDEPSE | v1.7 | © Alin Talfeș</div>
                    <script>
                        window.onload = function() { window.print(); }
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    } catch (e) {
        alert('Eroare la export PDF: ' + e.message);
    }
}