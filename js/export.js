// ========== EXPORT / COPIERE / PDF ==========

/**
 * Construiește textul narativ pentru copiere, citind direct din DOM.
 * @returns {string}
 */
function buildNarrativeText() {
    const resultsContent = document.getElementById('resultsContent');
    if (!resultsContent || resultsContent.innerHTML.trim() === '') {
        alert('Nu există rezultate. Apasă întâi „CALCULEAZĂ”.');
        return '';
    }

    // Date generale
    const sex = currentSex === 'M' ? 'MASCULIN' : 'FEMININ';
    const birthDate = document.getElementById('birthDate').value.trim();
    const life = document.getElementById('lifeSentence').checked;
    const art = document.getElementById('liberationArticle').value;

    // Durata pedepsei
    const y = parseInt(document.getElementById('durYears').value) || 0;
    const m = parseInt(document.getElementById('durMonths').value) || 0;
    const d = parseInt(document.getElementById('durDays').value) || 0;

    let sentence = '';
    if (life) {
        sentence = 'detențiunea pe viață';
    } else {
        const parts = [];
        if (y > 0) parts.push(`${y} ani`);
        if (m > 0) parts.push(`${m} luni`);
        if (d > 0) parts.push(`${d} zile`);
        sentence = parts.join(', ') || '0 zile';
    }

    const startDate = document.getElementById('startDate').value.trim();
    const realExp = document.getElementById('resultsContent').querySelector('.result-item.important .result-value')?.innerText || '—';

    // Deduceri
    const dedRows = Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
        start: r.querySelector('.ded-start')?.value.trim() || '',
        end: r.querySelector('.ded-end')?.value.trim() || ''
    }));
    const dedTotal = dedRows.reduce((sum, r) => {
        const dStart = parseDate(r.start), dEnd = parseDate(r.end);
        if (dStart && dEnd) return sum + (daysBetween(dStart, dEnd) + 1);
        return sum;
    }, 0);
    const dedPeriodsStr = dedRows.map(p => `${p.start}-${p.end}`).join(', ');
    const dedPeriodsDisplay = dedPeriodsStr ? ` (${dedPeriodsStr})` : '';

    // Adăugate
    const nonRows = Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
        type: r.querySelector('.ne-type')?.value || '',
        start: r.querySelector('.ne-start')?.value.trim() || '',
        end: r.querySelector('.ne-end')?.value.trim() || ''
    }));
    const nonTotal = nonRows.reduce((sum, r) => {
        const s = parseDate(r.start), e = parseDate(r.end);
        if (s && e) {
            const diff = daysBetween(s, e);
            if (r.type === 'interruption') return sum + diff - 1;
            return sum + diff;
        }
        return sum;
    }, 0);
    const nonPeriodsStr = nonRows.map(p => `${p.start}-${p.end} (${p.type})`).join(', ');
    const nonPeriodsDisplay = nonPeriodsStr ? ` (${nonPeriodsStr})` : '';

    // Recurs compensatoriu
    const recursDays = Array.from(document.querySelectorAll('.manual-days')).reduce((sum, inp) => sum + (parseInt(inp.value) || 0), 0);
    const recursText = recursDays > 0 ? `A beneficiat de un număr de ${recursDays} zile deduse ca urmare a recursului compensatoriu (Legea nr. 169/2017)` : 'Nu a beneficiat de prevederile Legii nr. 169/2017';

    // Articol
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
    const tDateValue = document.querySelector('.result-item .fraction + ...'); // nu mai folosim, luăm direct din rezultate
    // Căutăm în resultsContent textul după „DATA PROPOZABILĂ”
    const resultItems = document.querySelectorAll('#resultsContent .result-item');
    let tDate = '';
    let tDays = '';
    let tFraction = '';
    let fDate = '';
    let fifth = '';

    resultItems.forEach(item => {
        const label = item.querySelector('.result-label')?.innerText || '';
        if (label.includes('DATA PROPOZABILĂ')) {
            const value = item.querySelector('.result-value')?.innerText || '';
            tDate = value.split('Data')[1]?.trim() || '';
        } else if (label.includes('FRACȚIE MINIMĂ OBLIGATORIE')) {
            const value = item.querySelector('.result-value')?.innerText || '';
            const match = value.match(/(\d+)z/);
            if (match) tFraction = match[1];
        } else if (label.includes('1/5 mandat')) {
            const value = item.querySelector('.result-value')?.innerText || '';
            const match = value.match(/(\d+)z/);
            if (match) fifth = match[1];
            const dateMatch = value.match(/Data împlinirii<\/div><div class="result-value">([\d.]+)/);
            if (dateMatch) fDate = dateMatch[1];
        }
    });

    // Zile muncite
    const workDaysInput = document.getElementById('workDaysInput')?.value || '0';
    const workDaysResult = document.getElementById('workDaysResult')?.value || '';
    const workDays = parseInt(workDaysInput) || 0;
    const workText = workDays > 0 ? `Din această dată, s-au scăzut un număr de ${workDays} zile ca urmare a muncii prestate, și data propozabilă a coborât la ${workDaysResult}` : 'Nu au fost scăzute zile ca urmare a muncii prestate';

    // Construiește textul final
    let text = `În această speță, o persoană privată de libertate de sex ${sex}, născută la ${birthDate} este condamnată la pedeapsa rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDate} și expiră la data de ${realExp}, fiind deduse un număr de ${dedTotal} zile${dedPeriodsDisplay} și adăugate un număr de ${nonTotal} zile${nonPeriodsDisplay}. ${recursText}. Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDate}, după executarea a ${tFraction} zile. ${workText}. Regimul de executare se va stabili/a fost stabilit la 1/5 din pedeapsă, adică data de ${fDate}, după executarea a ${fifth} zile.`;

    return text;
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
        alert('Copierea a eșuat. Te rugăm să copiezi manual.');
    }
    document.body.removeChild(textarea);
}

/**
 * Exportă PDF cu valorile din inputuri.
 */
function exportPDF() {
    const content = document.getElementById('resultsContent');
    if (!content || content.innerHTML.trim() === '') {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return;
    }

    const data = getInputData();
    const inputHTML = buildInputDataHTML(data);

    // Clonăm și setăm valorile inputurilor
    const contentClone = content.cloneNode(true);
    contentClone.querySelectorAll('input').forEach(input => {
        input.setAttribute('value', input.value);
    });
    const resultsHTML = contentClone.innerHTML;

    const stepsHTML = buildStepsHTML();

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Fereastra pop-up a fost blocată. Permite pop-up-urile pentru a exporta PDF.');
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
                    .result-item { border: 1px solid #ddd; border-radius: 4px; padding: 4px 6px; break-inside: avoid; page-break-inside: avoid; }
                    .result-label { font-size: 7px; text-transform: uppercase; color: #666; margin-bottom: 2px; }
                    .result-value { font-size: 9px; font-weight: bold; color: #111; word-break: break-word; }
                    .result-warning { font-size: 8px; }
                    .expired { color: #d32f2f; }
                    .soon { color: #e67e22; }
                    .fraction { font-size: 10px; }
                    .steps-container ol { padding-left: 15px; font-size: 8px; }
                    .steps-container li { margin-bottom: 3px; }
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
}
