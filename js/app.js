// ========== GESTIONARE ERORI GLOBALE ==========

function showGlobalError(message) {
    let toast = document.getElementById('globalErrorToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalErrorToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.backgroundColor = 'var(--danger, #ff6b6b)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 18px';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        toast.style.zIndex = '9999';
        toast.style.fontSize = '0.85rem';
        toast.style.maxWidth = '350px';
        toast.style.wordBreak = 'break-word';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.remove(), 5000);
}

window.onerror = function (msg, source, lineno, colno) {
    console.error('Eroare globală:', msg, 'în', source, 'linia', lineno, 'coloana', colno);
    showGlobalError('A apărut o eroare neașteptată. Încearcă din nou.');
    return true;
};

window.addEventListener('unhandledrejection', function (event) {
    console.error('Eroare promisiune nerezolvată:', event.reason);
    showGlobalError('A apărut o eroare asincronă. Încearcă din nou.');
    event.preventDefault();
});

// ========== APLICAȚIE PRINCIPALĂ ==========

const LIFE_ARTICLES = new Set(['NCP99', 'VCP551']);
const EDUCATIONAL_ARTICLES = new Set(['NCP124', 'NCP125']);

function validateInputs(birthDate, startDate, life, art, y, m, d) {
    const err = [];
    if (!birthDate) err.push('Data nașterii este invalidă sau incompletă.');
    if (!startDate) err.push('Data începerii este invalidă sau incompletă.');
    if (!life && !art) err.push('Selectați articolul de liberare condiționată.');
    if (life && !LIFE_ARTICLES.has(art)) err.push('Pentru detențiunea pe viață selectați NCP art. 99 sau VCP art. 55¹.');
    if (!life && LIFE_ARTICLES.has(art)) err.push('Articolul selectat se utilizează numai pentru detențiunea pe viață.');

    for (const [label, value] of [['Ani', y], ['Luni', m], ['Zile', d]]) {
        if (!Number.isSafeInteger(value) || value < 0) err.push(`${label}: introduceți un număr întreg pozitiv sau zero.`);
    }
    if (!life && y === 0 && m === 0 && d === 0) err.push('Introduceți durata pedepsei.');
    if (birthDate && startDate && birthDate > startDate) err.push('Data nașterii este ulterioară începerii executării.');

    const prisonReceivedRaw = document.getElementById('prisonReceivedDate')?.value.trim() || '';
    if (prisonReceivedRaw && !parseDate(prisonReceivedRaw)) {
        err.push('Data primirii în penitenciar/centru este invalidă sau incompletă.');
    }

    document.querySelectorAll('.deduction-row').forEach((r, i) => {
        const st = r.querySelector('.ded-start').value.trim();
        const en = r.querySelector('.ded-end').value.trim();
        if (!st || !en) {
            err.push(`Deducerea ${i + 1}: ambele date sunt obligatorii.`);
        } else {
            const sD = parseDate(st);
            const eD = parseDate(en);
            if (!sD || !eD) err.push(`Deducerea ${i + 1}: format dată invalid.`);
            else if (eD < sD) err.push(`Deducerea ${i + 1}: data sfârșitului este înaintea începutului.`);
        }
    });

    document.querySelectorAll('.non-exec-row').forEach((r, i) => {
        const st = r.querySelector('.ne-start').value.trim();
        const en = r.querySelector('.ne-end').value.trim();
        if (!st || !en) {
            err.push(`Perioada neexecutată ${i + 1}: ambele date sunt obligatorii.`);
        } else {
            const sD = parseDate(st);
            const eD = parseDate(en);
            if (!sD || !eD) err.push(`Perioada neexecutată ${i + 1}: format dată invalid.`);
            else if (eD <= sD) err.push(`Perioada neexecutată ${i + 1}: data finală trebuie să fie strict după data inițială.`);
        }
    });

    document.querySelectorAll('.manual-days').forEach((input, i) => {
        const value = Number(input.value || 0);
        if (!Number.isSafeInteger(value) || value < 0) err.push(`Recurs compensatoriu ${i + 1}: introduceți un număr întreg pozitiv sau zero.`);
    });

    return err;
}

function updateProposedDateWithWorkDays() {
    const input = document.getElementById('workDaysInput');
    const result = document.getElementById('workDaysResult');
    const note = document.getElementById('workDaysNote');
    if (!input || !result || !window.lastProposedDate || !window.lastMinimumDate) return;

    const requested = Number(input.value || 0);
    const safeRequested = Number.isSafeInteger(requested) && requested >= 0 ? requested : 0;
    const reductionFloor = window.lastWorkReductionFloorDate || window.lastMinimumDate;
    const maxReduction = Math.max(0, daysBetween(reductionFloor, window.lastProposedDate));
    const applied = Math.min(safeRequested, maxReduction);
    const newDate = new Date(window.lastProposedDate);
    newDate.setDate(newDate.getDate() - applied);
    result.value = fmtDate(newDate);

    const ageFloorActive = reductionFloor > window.lastMinimumDate;
    if (note) {
        const floorReason = ageFloorActive
            ? ` Limita este ${fmtDate(reductionFloor)}, deoarece fracția favorabilă de vârstă nu poate produce efecte înainte de împlinirea pragului de vârstă.`
            : ` Limita este fracția minimă obligatorie (${fmtDate(window.lastMinimumDate)}).`;
        note.textContent = safeRequested > maxReduction
            ? `Au fost aplicate maximum ${maxReduction} zile.${floorReason}`
            : `Se pot scădea cel mult ${maxReduction} zile.${floorReason}`;
    }
    input.setCustomValidity(Number.isSafeInteger(requested) && requested >= 0 ? '' : 'Introduceți un număr întreg pozitiv sau zero.');

    if (window.lastCalculation) {
        window.lastCalculation.workDaysRequested = safeRequested;
        window.lastCalculation.workDaysApplied = applied;
        window.lastCalculation.workDaysResult = result.value;
    }
}

function buildLcDetails({ life, art, schedule, sentenceOver10, sex }) {
    const labels = {
        NCP100: 'NCP art. 100',
        NCP99: 'NCP art. 99',
        NCP124: 'NCP art. 124',
        NCP125: 'NCP art. 125',
        VCP59: 'VCP art. 59',
        VCP591: 'VCP art. 59¹',
        VCP602: 'VCP art. 60 alin. (2)',
        VCP603: 'VCP art. 60 alin. (3)',
        VCP551: 'VCP art. 55¹',
        PRE14059: 'Anterior L. 140/1996 – art. 59 v',
        PRE14060: 'Anterior L. 140/1996 – art. 60 v',
        PRE140604: 'Anterior L. 140/1996 – art. 60 alin. (4) v'
    };

    if (life) return {
        article: labels[art] || art,
        sentenceBand: 'Detențiune pe viață',
        age: 'Se aplică configurația algoritmului de liberare condiționată aferentă articolului selectat; pragul temporal utilizat de motor este 20 ani / 7.305 zile.',
        minimum: `Prag efectiv: ${schedule.mDays} zile. Zilele muncite nu reduc acest prag.`,
        proposed: `Data de împlinire a pragului: ${fmtDate(schedule.tDate)}.`
    };

    const threshold = schedule.ageThresholdYears;
    let age;
    if (art === 'NCP100') {
        age = schedule.ageRegime === 'elderly'
            ? 'Se aplică fracțiile pentru persoana care a împlinit 60 de ani. Regimul favorabil produce efecte cel mai devreme din ziua împlinirii vârstei.'
            : 'Se aplică fracțiile pentru persoana sub 60 de ani. Dacă împlinește 60 de ani înainte de termen, motorul recalculează de la data aniversării.';
    } else if (art === 'VCP59' || art === 'VCP591') {
        age = schedule.ageRegime === 'elderly'
            ? `Sunt aplicate condițiile aferente pragului de ${threshold} ani (${sex === 'F' ? 'femei' : 'bărbați'}) de la data împlinirii acestuia.`
            : `Sunt aplicate condițiile anterioare pragului de ${threshold} ani (${sex === 'F' ? 'femei' : 'bărbați'}).`;
    } else {
        age = `Categoria de vârstă este verificată pentru configurația algoritmului de liberare condiționată ${labels[art] || art}.`;
    }

    return {
        article: labels[art] || art,
        sentenceBand: sentenceOver10 ? '>10 ani' : '≤10 ani',
        age,
        minimum: `${fracStr(schedule.mR)} → ${schedule.mDays} zile. Fracția minimă este limita efectivă și nu poate fi redusă prin zile muncite.`,
        proposed: `${fracStr(schedule.tR)} → ${schedule.tDays} zile. Zilele considerate executate contribuie la realizarea fracției totale, fără depășirea limitei efective aplicabile.`
    };
}

function calculateAll() {
    const errC = document.getElementById('errorContainer');
    errC.classList.remove('visible');

    const birthDate = parseDate(document.getElementById('birthDate').value.trim());
    const startDate = parseDate(document.getElementById('startDate').value.trim());
    const prisonReceivedDate = parseDate(document.getElementById('prisonReceivedDate')?.value.trim() || '');
    const life = document.getElementById('lifeSentence').checked;
    const art = document.getElementById('liberationArticle').value;
    const y = Number(document.getElementById('durYears').value || 0);
    const m = Number(document.getElementById('durMonths').value || 0);
    const d = Number(document.getElementById('durDays').value || 0);

    const err = validateInputs(birthDate, startDate, life, art, y, m, d);
    if (err.length > 0) {
        errC.innerHTML = err.map(e => '• ' + e).join('<br>');
        errC.classList.add('visible');
        return;
    }

    const steps = [];
    let totalDays, theorExp = null;

    if (life) {
        totalDays = LC_TWENTY_YEAR_CAP_DAYS;
        steps.push(`Detențiune pe viață: fără expirare teoretică. Pentru configurația algoritmului de liberare condiționată selectată se utilizează pragul de ${LC_TWENTY_YEAR_CAP_DAYS} zile.`);
    } else {
        theorExp = addCalendarSafe(startDate, y, m, d);
        theorExp.setDate(theorExp.getDate() - 1);
        totalDays = daysBetween(startDate, theorExp) + 1;
        steps.push(`Data începerii executării: ${fmtDate(startDate)}. Durata: ${y} ani, ${m} luni, ${d} zile.`);
        steps.push('Adunăm calendaristic anii, lunile și zilele, apoi scădem o zi conform regulii de calcul a duratei executării.');
        steps.push(`Expirarea teoretică este ${fmtDate(theorExp)}.`);
        steps.push(`Totalul mandatului, cu ambele capete incluse, este ${totalDays} zile.`);
    }

    const dedIntervals = [];
    document.querySelectorAll('.deduction-row').forEach(r => {
        const sD = parseDate(r.querySelector('.ded-start').value.trim());
        const eD = parseDate(r.querySelector('.ded-end').value.trim());
        if (sD && eD) dedIntervals.push([sD, eD]);
    });

    const dedOverlapInfo = findIntervalOverlaps(dedIntervals);
    let ded = sumIntervals(dedIntervals);
    document.querySelectorAll('.manual-days').forEach(i => {
        const v = Number(i.value || 0);
        if (Number.isSafeInteger(v) && v > 0) ded += v;
    });

    if (ded > totalDays) {
        errC.innerHTML = '• Deducerile depășesc mandatul total.';
        errC.classList.add('visible');
        return;
    }
    steps.push(`Perioadele deduse însumează ${ded} zile, după unificarea suprapunerilor.`);

    const nonRawRows = [];
    const nonRowsData = [];
    document.querySelectorAll('.non-exec-row').forEach(r => {
        const type = r.querySelector('.ne-type').value;
        const sD = parseDate(r.querySelector('.ne-start').value.trim());
        const eD = parseDate(r.querySelector('.ne-end').value.trim());
        if (sD && eD) {
            nonRawRows.push({ type, start: sD, end: eD });
            const effective = getNonExecEffectiveInterval(type, sD, eD);
            const daysToAdd = effective ? daysBetween(effective[0], effective[1]) + 1 : 0;
            nonRowsData.push({ type, start: fmtDate(sD), end: fmtDate(eD), days: daysToAdd });
        }
    });
    const nonOverlapInfo = findIntervalOverlaps(nonRawRows.map(r => [r.start, r.end]));
    const non = sumNonExecutedPeriods(nonRawRows);
    steps.push(`Perioadele care nu se consideră executate însumează ${non} zile după eliminarea dublării suprapunerilor.`);

    let realExp = null;
    if (!life) {
        realExp = new Date(theorExp);
        realExp.setDate(realExp.getDate() - ded + non);
        steps.push(`Expirarea reală = ${fmtDate(theorExp)} − ${ded} zile deduse + ${non} zile neexecutate = ${fmtDate(realExp)}.`);
    }

    const sentenceOver10 = life ? false : (y * 12 + m + d / 30) > 120;
    const schedule = calculateLiberationSchedule({
        life, art, sentenceOver10, totalDays, birthDate, startDate, currentSex, theorExp,
        dedDays: ded, nonExecDays: non
    });
    if (schedule.error) {
        errC.innerHTML = '• ' + schedule.error;
        errC.classList.add('visible');
        return;
    }

    const { mR, tR, mDays, tDays, mDate, tDate, articleInfo } = schedule;
    const lcDetails = buildLcDetails({ life, art, schedule, sentenceOver10, sex: currentSex });
    steps.push(`Configurația aplicabilă: ${articleInfo}.`);
    if (life) {
        steps.push(`Pragul minim și data propozabilă coincid la ${LC_TWENTY_YEAR_CAP_DAYS} zile; zilele muncite nu reduc acest prag.`);
    } else {
        steps.push(`Fracția obligatorie: ${fracStr(mR)} = ${mDays} zile. Fracția totală: ${fracStr(tR)} = ${tDays} zile.`);
        if (schedule.ageTransitionApplied) {
            steps.push(`La împlinirea pragului de vârstă de ${schedule.ageThresholdYears || 60} ani se aplică regimul favorabil numai din ziua aniversării.`);
        }
    }

    window.lastProposedDate = new Date(tDate);
    window.lastMinimumDate = new Date(mDate);
    window.lastWorkReductionFloorDate = schedule.workReductionFloorDate ? new Date(schedule.workReductionFloorDate) : new Date(mDate);

    const isEducationalMeasure = EDUCATIONAL_ARTICLES.has(art);
    let fifth = null;
    let fDate = null;
    let reanalysisLabel = null;

    if (life) {
        const baseReanalysis = addCalendarSafe(startDate, 6, 6, 0);
        baseReanalysis.setDate(baseReanalysis.getDate() - 1);
        fDate = new Date(baseReanalysis);
        fDate.setDate(fDate.getDate() - ded + non);
        reanalysisLabel = 'Reanalizare 6 ani și 6 luni';
    } else if (!isEducationalMeasure) {
        fifth = Math.floor(totalDays / 5);
        fDate = thresholdDate(startDate, fifth, ded, non);
        reanalysisLabel = 'Reanalizare 1/5';
    }

    const elapsedEnd = realExp && today() > realExp ? realExp : today();
    const calendarDaysSinceStart = elapsedEnd >= startDate ? Math.max(0, daysBetween(startDate, elapsedEnd) + 1) : 0;
    const remaining = realExp ? Math.max(0, daysBetween(today(), realExp) + 1) : '—';

    let quarantineEnd = null;
    if (prisonReceivedDate) {
        quarantineEnd = new Date(prisonReceivedDate);
        quarantineEnd.setDate(quarantineEnd.getDate() + 20);
        steps.push(`Carantina de 21 zile este calculată separat de la data primirii în penitenciar/centru: ${fmtDate(prisonReceivedDate)} → ${fmtDate(quarantineEnd)}.`);
    }

    const alertDates = [
        { label: 'Fracție minimă obligatorie', date: mDate },
        { label: 'Data propusă (totală)', date: tDate },
        ...(reanalysisLabel ? [{ label: reanalysisLabel, date: fDate }] : []),
        { label: 'Expirare reală', date: realExp },
        ...(quarantineEnd ? [{ label: 'Carantină expiră', date: quarantineEnd }] : [])
    ];
    const t = today();
    const alerts = [];
    alertDates.forEach(item => {
        if (!item.date || isNaN(item.date)) return;
        const diff = daysBetween(t, item.date);
        if (diff >= 0 && diff <= 30) alerts.push({ label: item.label, diff });
    });

    let alertsHtml = '';
    if (alerts.length > 0) {
        alertsHtml = '<div class="alerts-container"><h4>ALERTE – Termene apropiate</h4><ul>';
        alerts.forEach(a => {
            const found = alertDates.find(x => x.label === a.label);
            alertsHtml += `<li>${a.label} expiră în <strong>${a.diff} zile</strong> (${fmtDate(found.date)})</li>`;
        });
        alertsHtml += '</ul></div>';
    }
    document.getElementById('alertsContainer').innerHTML = alertsHtml;
    document.getElementById('alertsContainer').classList.toggle('hidden', alerts.length === 0);

    const timelineItems = [
        { label: 'Început executare', date: startDate },
        ...(prisonReceivedDate ? [{ label: 'Primire penitenciar/centru', date: prisonReceivedDate }] : []),
        ...(quarantineEnd ? [{ label: 'Carantină expiră', date: quarantineEnd }] : []),
        ...(reanalysisLabel ? [{ label: reanalysisLabel, date: fDate }] : []),
        { label: 'Fracție minimă obligatorie', date: mDate },
        { label: 'Data propusă (totală)', date: tDate },
        { label: 'Expirare teoretică', date: theorExp },
        { label: 'Expirare reală', date: realExp }
    ];
    const condReleaseStr2 = document.getElementById('conditionalReleaseDate').value.trim();
    if (condReleaseStr2) {
        const condDate = parseDate(condReleaseStr2);
        if (condDate) timelineItems.push({ label: 'Data liberării condiționate', date: condDate });
    }
    const validTimelineItems = timelineItems.filter(item => item.date instanceof Date && !isNaN(item.date));
    validTimelineItems.sort((a, b) => a.date - b.date);

    let timelineHtml = '';
    validTimelineItems.forEach(item => {
        const diff = daysBetween(t, item.date);
        const passed = diff < 0;
        timelineHtml += `<li class="${passed ? 'passed' : ''}"><span class="tl-date">${fmtDate(item.date)}</span> <span class="tl-label">${item.label}</span></li>`;
    });
    document.getElementById('timelineList').innerHTML = timelineHtml;
    document.getElementById('timelineContainer').classList.remove('hidden');

    let restHtml = '';
    const condReleaseStr = document.getElementById('conditionalReleaseDate').value.trim();
    if (condReleaseStr && parseDate(condReleaseStr)) {
        const condReleaseDate = parseDate(condReleaseStr);
        if (realExp) {
            const restDays = Math.max(0, daysBetween(condReleaseDate, realExp));
            restHtml = `<div class="result-section"><h4>REST RĂMAS DE EXECUTAT (după liberarea condiționată)</h4>
                <div class="result-grid">
                    <div class="result-item"><div class="result-label">Data liberării</div><div class="result-value">${formatDateWithWarning(condReleaseDate)}</div></div>
                    <div class="result-item important"><div class="result-label">Rest rămas</div><div class="result-value">${restDays} zile</div></div>
                </div></div>`;
        }
    }

    const nume = document.getElementById('observations').value.trim();
    let html = '';
    if (nume) html += `<div class="result-item observations-result"><div class="result-label">Observații</div><div class="result-value">${escapeHtml(nume)}</div></div>`;

    html += life
        ? `<div class="result-section"><h4>DETALII PEDEAPSĂ</h4><div class="result-grid">
            <div class="result-item important"><div class="result-label">Detențiune pe viață</div><div class="result-value">Fără dată de expirare. prag LC: ${LC_TWENTY_YEAR_CAP_DAYS} zile.</div></div>
            <div class="result-item"><div class="result-label">Zile deduse</div><div class="result-value">${ded} zile</div></div>
            <div class="result-item"><div class="result-label">Zile neexecutate</div><div class="result-value">${non} zile</div></div>
            <div class="result-item"><div class="result-label">Zile calendaristice de la începere</div><div class="result-value">${calendarDaysSinceStart} zile</div></div>
        </div></div>`
        : `<div class="result-section"><h4>DETALII MANDAT</h4><div class="result-grid">
            <div class="result-item"><div class="result-label">Expirare teoretică</div><div class="result-value">${formatDateWithWarning(theorExp)}</div></div>
            <div class="result-item important"><div class="result-label">Expirare REALĂ</div><div class="result-value">${formatDateWithWarning(realExp)}</div></div>
            <div class="result-item"><div class="result-label">Zile deduse</div><div class="result-value">${ded} zile</div></div>
            <div class="result-item"><div class="result-label">Zile neexecutate</div><div class="result-value">${non} zile</div></div>
            <div class="result-item"><div class="result-label">Zile calendaristice de la începere</div><div class="result-value">${calendarDaysSinceStart} zile</div></div>
            <div class="result-item"><div class="result-label">Rest rămas</div><div class="result-value">${remaining} zile</div></div>
        </div></div>`;

    html += `<div class="result-section"><h4>FRACȚII LIBERARE CONDIȚIONATĂ</h4><div class="result-grid">
        <div class="result-item">
            <div class="result-label">FRACȚIE MINIMĂ OBLIGATORIE</div>
            <div class="result-value">${life ? `prag LC ${mDays} zile` : `<span class="fraction">${fracStr(mR)}</span> → ${mDays} zile`}</div>
            <div class="result-label" style="margin-top:4px;">Data</div><div class="result-value">${formatDateWithWarning(mDate)}</div>
        </div>
        <div class="result-item">
            <div class="result-label">DATA ÎMPLINIRII FRACȚIEI TOTALE / PROPOZABILĂ</div>
            <div class="result-value">${life ? `prag LC ${tDays} zile` : `<span class="fraction">${fracStr(tR)}</span> → ${tDays} zile`}</div>
            <div class="result-label" style="margin-top:4px;">Data</div><div class="result-value">${formatDateWithWarning(tDate)}</div>
        </div>
    </div></div>`;

    if (dedOverlapInfo.length || nonOverlapInfo.length) {
        html += `<div class="result-section overlap-notice"><h4>INFORMARE SUPRAPUNERI</h4>
            ${dedOverlapInfo.length ? `<p>Există ${dedOverlapInfo.length} suprapunere(i) între perioadele deduse. Zilele comune au fost numărate o singură dată.</p>` : ''}
            ${nonOverlapInfo.length ? `<p>Există ${nonOverlapInfo.length} suprapunere(i) între perioadele neexecutate. Zilele comune au fost numărate o singură dată.</p>` : ''}
        </div>`;
    }

    if (!life) html += `<div class="result-section">
        <h4>SCĂDERE ZILE MUNCITE DIN DATA PROPOZABILĂ</h4>
        <div class="form-grid">
            <div>
                <label for="workDaysInput">Zile muncite de scăzut</label>
                <input type="number" id="workDaysInput" min="0" step="1" value="0" oninput="updateProposedDateWithWorkDays()">
            </div>
            <div>
                <label>Noua dată propozabilă</label>
                <input type="text" id="workDaysResult" readonly class="result-input" tabindex="-1">
            </div>
        </div>
        <p id="workDaysNote" class="help-text"><em>Zilele considerate executate contribuie la realizarea fracției totale, cu respectarea limitei efective și, după caz, a pragului de vârstă.</em></p>
    </div>`;

    if (reanalysisLabel) {
        html += `<div class="result-section"><h4>REANALIZARE REGIM</h4><div class="result-grid">
            <div class="result-item"><div class="result-label">${reanalysisLabel}</div>
                <div class="result-value">${life ? 'Prag temporal: 6 ani și 6 luni, ajustat cu perioadele deduse/neexecutate.' : `(fără deduceri: ${fifth}z / după ajustări: ${daysBetween(startDate, fDate) + 1}z)`}</div>
                <div class="result-label" style="margin-top:4px;">Data împlinirii</div><div class="result-value">${formatDateWithWarning(fDate)}</div>
            </div>
        </div></div>`;
    } else if (isEducationalMeasure) {
        html += `<div class="result-section"><h4>REANALIZARE REGIM</h4><p class="help-text">Fracția de 1/5 prevăzută pentru pedeapsa închisorii nu este aplicată automat măsurilor educative NCP art. 124/125.</p></div>`;
    }

    html += `<div class="result-section"><h4>ALTE DATE ȘI EXPLICAȚII LC</h4><div class="result-grid">
        <div class="result-item important"><div class="result-label">Articol LC</div><div class="result-value">${lcDetails.article}</div><div class="result-note">${lcDetails.sentenceBand}</div></div>
        <div class="result-item"><div class="result-label">Condiția de vârstă aplicată</div><div class="result-value result-value-small">${lcDetails.age}</div></div>
        <div class="result-item"><div class="result-label">Fracția / pragul minim</div><div class="result-value result-value-small">${lcDetails.minimum}</div></div>
        <div class="result-item"><div class="result-label">Fracția / data propozabilă</div><div class="result-value result-value-small">${lcDetails.proposed}</div></div>
        <div class="result-item"><div class="result-label">${life ? 'prag LC' : 'Mandat total'}</div><div class="result-value">${life ? `${LC_TWENTY_YEAR_CAP_DAYS} zile` : `${totalDays} zile`}</div></div>
        ${reanalysisLabel ? `<div class="result-item"><div class="result-label">${reanalysisLabel}</div><div class="result-value">${formatDateWithWarning(fDate)}</div></div>` : ''}
        ${quarantineEnd ? `<div class="result-item"><div class="result-label">Carantină expiră</div><div class="result-value">${formatDateWithWarning(quarantineEnd)}</div><div class="result-note">calculată de la primirea în penitenciar/centru</div></div>` : ''}
    </div></div>`;

    html += restHtml;

    document.getElementById('resultsContent').innerHTML = html;
    document.getElementById('stepsList').innerHTML = steps.map(s => `<li>${s}</li>`).join('');
    document.getElementById('stepsContainer').classList.add('hidden');
    document.getElementById('toggleStepsBtn').innerHTML = 'AFIȘEAZĂ PAȘII CALCULULUI';
    document.getElementById('toggleStepsBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('resultsCard').classList.remove('hidden');

    if (!life) updateProposedDateWithWorkDays();

    window.lastCalculation = {
        life,
        sex: currentSex,
        birthDate,
        startDate,
        prisonReceivedDate,
        quarantineEnd,
        theorExp,
        realExp,
        ded,
        non,
        dedIntervals,
        nonRowsData,
        recursDays: ded - sumIntervals(dedIntervals),
        mDays,
        tDays,
        tDate,
        mR,
        tR,
        articleInfo,
        lcDetails,
        reanalysisLabel,
        fifth,
        fDate,
        mDate,
        isEducationalMeasure,
        workReductionFloorDate: new Date(window.lastWorkReductionFloorDate),
        duration: { y, m, d },
        art,
        inputData: {
            sex: currentSex === 'M' ? 'Masculin' : 'Feminin',
            birthDate: document.getElementById('birthDate').value.trim(),
            observations: document.getElementById('observations').value.trim(),
            life,
            art,
            y: String(y), m: String(m), d: String(d),
            start: document.getElementById('startDate').value.trim(),
            prisonReceived: document.getElementById('prisonReceivedDate')?.value.trim() || '',
            condRelease: document.getElementById('conditionalReleaseDate').value.trim(),
            dedRows: Array.from(document.querySelectorAll('.deduction-row')).map(r => ({ start: r.querySelector('.ded-start')?.value.trim() || '', end: r.querySelector('.ded-end')?.value.trim() || '' })).filter(r => r.start || r.end),
            manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
            nonRows: Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({ type: r.querySelector('.ne-type')?.value || '', start: r.querySelector('.ne-start')?.value.trim() || '', end: r.querySelector('.ne-end')?.value.trim() || '' })).filter(r => r.start || r.end)
        },
        workDaysInput: document.getElementById('workDaysInput')?.value || '0',
        workDaysRequested: 0,
        workDaysApplied: 0,
        workDaysResult: document.getElementById('workDaysResult')?.value || ''
    };

    autoSave();
}

function calcMasuriPreventive() {
    const refDate = parseDate(document.getElementById('masuriRefDate').value.trim());
    const days = parseInt(document.getElementById('masuriDays').value);
    const resultInput = document.getElementById('masuriResult');

    if (!refDate || isNaN(days) || days < 0) {
        resultInput.value = '';
        return;
    }
    if (days === 0) {
        resultInput.value = fmtDate(refDate);
        return;
    }
    const resultDate = addCalendarSafe(refDate, 0, 0, days - 1);
    resultInput.value = fmtDate(resultDate);
}

function syncLifeArticleUI(source) {
    const lifeSentence = document.getElementById('lifeSentence');
    const article = document.getElementById('liberationArticle');
    const sentenceDuration = document.getElementById('sentenceDuration');
    if (!lifeSentence || !article || !sentenceDuration) return;

    if (source === 'life') {
        if (lifeSentence.checked) {
            if (!LIFE_ARTICLES.has(article.value)) article.value = 'NCP99';
            sentenceDuration.classList.add('hidden');
        } else {
            if (LIFE_ARTICLES.has(article.value)) article.value = '';
            sentenceDuration.classList.remove('hidden');
        }
    } else if (source === 'article') {
        if (LIFE_ARTICLES.has(article.value)) {
            lifeSentence.checked = true;
            sentenceDuration.classList.add('hidden');
        } else if (lifeSentence.checked) {
            lifeSentence.checked = false;
            sentenceDuration.classList.remove('hidden');
        }
    }
    article.disabled = false;
    updAgeTag();
}

document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    updateCaseBadge();
    restoreAutoSave();

    sexToggle.addEventListener('change', updateSexUI);

    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('date-masked')) applyDateMask(e);
    });

    document.getElementById('birthDate').addEventListener('input', updAgeTag);
    document.getElementById('liberationArticle').addEventListener('change', function() {
        syncLifeArticleUI('article');
    });
    document.getElementById('lifeSentence').addEventListener('change', function() {
        syncLifeArticleUI('life');
    });

    document.getElementById('masuriRefDate').addEventListener('input', calcMasuriPreventive);
    calcMasuriPreventive();

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) (typeof closeModal === 'function' ? closeModal(overlay) : overlay.remove());
        }
    });

    let autoSaveTimer;
    const scheduleAutoSave = () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(autoSave, 250);
    };
    document.addEventListener('input', scheduleAutoSave);
    document.addEventListener('change', scheduleAutoSave);

    window.addEventListener('beforeunload', function(e) {
        const hasData = () => {
            const birth = document.getElementById('birthDate').value.trim();
            const start = document.getElementById('startDate').value.trim();
            const life = document.getElementById('lifeSentence').checked;
            const y = parseInt(document.getElementById('durYears').value) || 0;
            const m = parseInt(document.getElementById('durMonths').value) || 0;
            const d = parseInt(document.getElementById('durDays').value) || 0;
            return parseDate(birth) || parseDate(start) || (!life && (y > 0 || m > 0 || d > 0));
        };
        if (hasData()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    updateSexUI();
    syncLifeArticleUI('life');
});
