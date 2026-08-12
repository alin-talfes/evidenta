// ========== EXPORT / COPIERE / PDF ==========

/**
 * Exportă rezultatele în format CSV.
 */
function exportCSV() {
    let csv = 'Indicator,Valoare\n';
    csv += `"Sex","${currentSex === 'M' ? 'Masculin' : 'Feminin'}"\n`;
    csv += `"Data nașterii","${document.getElementById('birthDate').value}"\n`;
    csv += `"Observații","${document.getElementById('observations').value}"\n`;
    csv += `"Articol LC","${document.getElementById('liberationArticle').value}"\n`;
    csv += `"Detențiune pe viață","${document.getElementById('lifeSentence').checked ? 'Da' : 'Nu'}"\n`;
    csv += `"Durată","${document.getElementById('durYears').value} ani, ${document.getElementById('durMonths').value} luni, ${document.getElementById('durDays').value} zile"\n`;
    csv += `"Data începerii","${document.getElementById('startDate').value}"\n`;

    document.querySelectorAll('.deduction-row').forEach((r, i) => {
        const st = r.querySelector('.ded-start').value.trim();
        const en = r.querySelector('.ded-end').value.trim();
        if (st && en) csv += `"Perioadă dedusă ${i + 1}","${st} - ${en}"\n`;
    });

    document.querySelectorAll('.manual-days').forEach((inp, i) => {
        const v = parseInt(inp.value);
        if (v > 0) csv += `"Recurs compensatoriu ${i + 1}","${v} zile"\n`;
    });

    document.querySelectorAll('.non-exec-row').forEach((r, i) => {
        const typ = r.querySelector('.ne-type')?.value || '';
        const st = r.querySelector('.ne-start').value.trim();
        const en = r.querySelector('.ne-end').value.trim();
        if (st && en) csv += `"Perioadă adăugată ${i + 1} (${typ})","${st} - ${en}"\n`;
    });

    csv += '\n';
    const content = document.getElementById('resultsContent');
    if (content) {
        content.querySelectorAll('.result-item').forEach(item => {
            const label = item.querySelector('.result-label')?.innerText || '';
            const value = item.querySelector('.result-value')?.innerText || '';
            csv += `"${label}","${value}"\n`;
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
 * Exportă rezultatele ca PDF (fereastră de tipărire).
 */
function exportPDF() {
    const content = document.getElementById('resultsContent');
    if (!content || content.innerHTML.trim() === '') {
        alert('Nu există rezultate pentru export. Apasă întâi „CALCULEAZĂ”.');
        return;
    }
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
                <div>${content.innerHTML}</div>
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
