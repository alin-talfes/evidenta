// ========== EXPORT / COPIERE / PDF ==========

// ... restul funcțiilor existente (getInputData, buildInputDataHTML, fallbackCopy, buildStepsHTML, exportPDF) rămân la fel

/**
 * Construiește textul narativ pentru copiere.
 * @returns {string}
 */
function buildNarrativeText() {
    if (!window.lastCalculation) {
        alert('Nu există calcul. Apasă întâi „CALCULEAZĂ”.');
        return '';
    }

    const calc = window.lastCalculation;
    const sex = calc.sex === 'M' ? 'MASCULIN' : 'FEMININ';
    const birthDate = fmtDate(calc.birthDate);
    const startDate = fmtDate(calc.startDate);
    const realExp = fmtDate(calc.realExp);

    // Determină pedeapsa
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

    // Perioade deduse
    const dedRows = Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
        start: r.querySelector('.ded-start')?.value.trim() || '',
        end: r.querySelector('.ded-end')?.value.trim() || ''
    }));
    const dedPeriodsStr = dedRows.map(p => `${p.start}-${p.end}`).join(', ');
    const dedPeriodsDisplay = dedPeriodsStr ? ` (${dedPeriodsStr})` : '';

    // Perioade adăugate
    const nonRows = Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
        type: r.querySelector('.ne-type')?.value || '',
        start: r.querySelector('.ne-start')?.value.trim() || '',
        end: r.querySelector('.ne-end')?.value.trim() || ''
    }));
    const nonPeriodsStr = nonRows.map(p => `${p.start}-${p.end} (${p.type})`).join(', ');
    const nonPeriodsDisplay = nonPeriodsStr ? ` (${nonPeriodsStr})` : '';

    // Recurs compensatoriu
    const recursDays = Array.from(document.querySelectorAll('.manual-days')).reduce((sum, inp) => sum + (parseInt(inp.value) || 0), 0);
    const recursText = recursDays > 0 ? `A beneficiat de un număr de ${recursDays} zile deduse ca urmare a recursului compensatoriu (Legea nr. 169/2017)` : 'Nu a beneficiat de prevederile Legii nr. 169/2017';

    // Articol
    const article = document.getElementById('liberationArticle').value;
    let articleText = '';
    switch(article) {
        case 'NCP100': articleText = 'art. 100 din Codul penal'; break;
        case 'NCP99': articleText = 'art. 99 din Codul penal'; break;
        case 'NCP124': articleText = 'art. 124 din Codul penal'; break;
        case 'NCP125': articleText = 'art. 125 din Codul penal'; break;
        case 'VCP59': articleText = 'art. 59 din Codul penal'; break;
        case 'VCP591': articleText = 'art. 59¹ din Codul penal'; break;
        case 'VCP602': articleText = 'art. 60 alin. 2 din Codul penal'; break;
        case 'VCP603': articleText = 'art. 60 alin. 3 din Codul penal'; break;
        default: articleText = 'articolul aplicabil';
    }

    // Fracția propozabilă
    const tDays = calc.tDays;
    const tDate = fmtDate(calc.tDate);
    const fracStr = fracToText(calc.tR); // 2/3 etc.
    const fracText = fracStr ? `${fracStr}` : '';

    // Zile muncite
    const workDays = parseInt(calc.workDaysInput) || 0;
    let workText = '';
    if (workDays > 0) {
        workText = `Din această dată, s-au scăzut un număr de ${workDays} zile ca urmare a muncii prestate, și data propozabilă a coborât la ${calc.workDaysResult}`;
    } else {
        workText = 'Nu au fost scăzute zile ca urmare a muncii prestate';
    }

    // Regim 1/5
    const fifth = calc.fifth;
    const fDate = fmtDate(calc.fDate);

    // Construiește textul final
    let text = `În această speță, o persoană privată de libertate de sex ${sex}, născută la ${birthDate} este condamnată la pedeapsa rezultantă de ${sentence}. Pedeapsa închisorii începe la data de ${startDate} și expiră la data de ${realExp}, fiind deduse un număr de ${calc.ded} zile${dedPeriodsDisplay} și adăugate un număr de ${calc.non} zile${nonPeriodsDisplay}. ${recursText}. Conform ${articleText}, fracția propozabilă se împlinește la data de ${tDate}, după executarea a ${tDays} zile. ${workText}. Regimul de executare se va stabili/a fost stabilit la 1/5 din pedeapsă, adică data de ${fDate}, după executarea a ${fifth} zile.`;

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

// Helper: transformă fracția numerică în text (½, ⅔, ¾, ⅓, ¼, 1/100)
function fracToText(r) {
    if (r === 1/2) return '½';
    if (r === 2/3) return '⅔';
    if (r === 3/4) return '¾';
    if (r === 1/3) return '⅓';
    if (r === 1/4) return '¼';
    if (r === 1/100) return '1/100';
    return r.toString();
}
