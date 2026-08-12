// ========== EXPORT / COPIERE / PDF ==========

/**
 * Colectează datele introduse de utilizator.
 * @returns {Object} - obiect cu toate datele din formular
 */
function getInputData() {
    const sex = currentSex === 'M' ? 'Masculin' : 'Feminin';
    const birthDate = document.getElementById('birthDate').value.trim();
    const observations = document.getElementById('observations').value.trim();
    const life = document.getElementById('lifeSentence').checked;
    const art = document.getElementById('liberationArticle').value;
    const y = parseInt(document.getElementById('durYears').value) || 0;
    const m = parseInt(document.getElementById('durMonths').value) || 0;
    const d = parseInt(document.getElementById('durDays').value) || 0;
    const start = document.getElementById('startDate').value.trim();
    const condRelease = document.getElementById('conditionalReleaseDate').value.trim();

    const dedRows = Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
        start: r.querySelector('.ded-start')?.value.trim() || '',
        end: r.querySelector('.ded-end')?.value.trim() || '',
        days: r.querySelector('.ded-days')?.value.trim() || ''
    }));

    const manDed = Array.from(document.querySelectorAll('.manual-days')).map(i => i.value);

    const nonRows = Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
        type: r.querySelector('.ne-type')?.value || '',
        start: r.querySelector('.ne-start')?.value.trim() || '',
        end: r.querySelector('.ne-end')?.value.trim() || '',
        days: r.querySelector('.ne-days')?.value.trim() || ''
    }));

    const masuriRefDate = document.getElementById('masuriRefDate').value.trim();
    const masuriDays = document.getElementById('masuriDays').value;
    const masuriResult = document.getElementById('masuriResult').value.trim();

    return {
        sex,
        birthDate,
        observations,
        life,
        art,
        y,
        m,
        d,
        start,
        condRelease,
        dedRows,
        manDed,
        nonRows,
        masuriRefDate,
        masuriDays,
        masuriResult
    };
}

/**
 * Construiește secțiunea HTML cu datele introduse.
 * @param {Object} data - datele din formular
 * @returns {string} - HTML
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

    // Perioade deduse
    if (data.dedRows.length > 0) {
        html += '<div class="result-item" style="grid-column: span 2;"><div class="result-label">Perioade deduse</div><div class="result-value">';
        data.dedRows.forEach((r, i) => {
            html += `${i + 1}. ${r.start || '—'} - ${r.end || '—'} (${r.days || '—'} zile)<br>`;
        });
        html += '</div></div>';
    }

    // Recurs compensatoriu
    if (data.manDed.length > 0) {
        html += '<div class="result-item"><div class="result-label">Recurs compensatoriu</div><div class="result-value">';
        data.manDed.forEach((v, i) => {
            if (parseInt(v) > 0) html += `${i + 1}. ${v} zile<br>`;
        });
        html += '</div></div>';
    }

    // Perioade adăugate
    if (data.nonRows.length > 0) {
        html += '<div class="result-item" style="grid-column: span 2;"><div class="result-label">Perioade adăugate</div><div class="result-value">';
        data.nonRows.forEach((r, i) => {
            html += `${i + 1}. ${r.type} (${r.start || '—'} - ${r.end || '—'}) ${r.days || '—'} zile<br>`;
        });
        html += '</div></div>';
    }

    // Măsuri preventive
    if (data.masuriRefDate || data.masuriDays !== '0') {
        html += '<div class="result-item"><div class="result-label">Măsuri preventive</div><div class="result-value">';
        html += `Ref: ${data.masuriRefDate || '—'}<br>Zile: ${data.masuriDays}<br>Rezultat: ${data.masuriResult || '—'}`;
        html += '</div></div>';
    }

    html += '</div></div>';
    return html;
}

/**
 * Exportă datele introduse și rezultatele în format CSV.
 */
function exportCSV() {
    const data = getInputData();
    let csv = 'SECȚIUNE,Indicator,Valoare\n';

    // Date introduse
    csv += `"DATE INTRODUSE","Sex","${data.sex}"\n`;
    csv += `"DATE INTRODUSE","Data nașterii","${data.birthDate}"\n`;
    csv += `"DATE INTRODUSE","Observații","${data.observations}"\n`;
    csv += `"DATE INTRODUSE","Articol LC","${data.art}"\n`;
    csv += `"DATE INTRODUSE","Detențiune pe viață","${data.life ? 'Da' : 'Nu'}"\n`;
    csv += `"DATE INTRODUSE","Durată","${data.y} ani, ${data.m} luni, ${data.d} zile"\n`;
    csv += `"DATE INTRODUSE","Data începerii","${data.start}"\n`;
    csv += `"DATE INTRODUSE","Data liberării condiționate","${data.condRelease}"\n`;

    data.dedRows.forEach((r, i) => {
        csv += `"DATE INTRODUSE","Perioadă dedusă ${i + 1}","${r.start} - ${r.end}"\n`;
    });

    data.manDed.forEach((v, i) => {
        if (parseInt(v) > 0) csv += `"DATE INTRODUSE","Recurs compensatoriu ${i + 1}","${v} zile"\n`;
    });

    data.nonRows.forEach((r, i) => {
        csv += `"DATE INTRODUSE","Perioadă adăugată ${i + 1}","${r.type} (${r.start} - ${r.end})"\n`;
    });

    if (data.masuriRefDate || data.masuriDays !== '0') {
        csv += `"DATE INTRODUSE","Măsuri preventive","Ref: ${data.masuriRefDate}, Zile: ${data.masuriDays}, Rezultat: ${data.masuriResult}"\n`;
    }

    // Rezultate
    csv += '\n"REZULTATE",,\n';
    const content = document.getElementById('resultsContent');
    if (content) {
        content.querySelectorAll('.result-item').forEach(item => {
            const label = item.querySelector('.result-label')?.innerText || '';
            const value = item.querySelector('.result-value')?.innerText || '';
            csv += `"REZULTATE","${label}","${value}"\n`;
        });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'calculator_evidenta_pedepse.csv';
    a.click();
}

/**
 * Copiază rezultatele în clipboard.
 */
function copyResults() {
    const content = document.getElementById('resultsContent');
    if (!content || content.innerHTML.trim() === '') {
        alert('Nu există rezultate de copiat. Apasă întâi „CALCULEAZĂ”.');
        return;
    }
    const text = content.innerText.trim();
    if (!text) {
        alert('Nu există text de copiat.');
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Rezultatele au fost copiate în clipboard.');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

/**
 * Metodă de rezervă pentru copiere în clipboard.
 * @param {string} text - textul de copiat
 */
function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        alert('Rezultatele au fost copiate în clipboard.');
    } catch (e) {
        alert('Copierea a eșuat. Te rugăm să copiezi manual.');
    }
    document.body.removeChild(textarea);
}

/**
 * Exportă datele introduse și rezultatele ca PDF (fereastră de tipărire).
 */
function exportPDF() {
    const content = document.getElementById('resultsContent');
    if (!content || content.innerHTML.trim() === '') {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return;
    }
    const data = getInputData();
    const inputHTML = buildInputDataHTML(data);

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
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; font-size: 20px; }
                    .result-section { margin-bottom: 20px; }
                    .result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
                    .result-item { border: 1px solid #ddd; border-radius: 8px; padding: 10px; break-inside: avoid; }
                    .result-label { font-size: 11px; text-transform: uppercase; color: #666; margin-bottom: 4px; }
                    .result-value { font-size: 14px; font-weight: bold; color: #111; }
                    .result-warning { font-size: 12px; }
                    .expired { color: #d32f2f; }
                    .soon { color: #e67e22; }
                    .fraction { font-size: 16px; }
                    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>CALCULATOR EVIDENȚĂ PEDEPSE - REZULTATE</h1>
                ${inputHTML}
                ${content.innerHTML}
                <div class="footer">CALCULATOR EVIDENȚĂ PEDEPSE | v1.1 | © Alin Talfeș</div>
                <script>
                    window.onload = function() { window.print(); }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
}
