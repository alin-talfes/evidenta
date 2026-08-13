// ========== APLICAȚIE PRINCIPALĂ ==========

/**
 * Validare completă a datelor de intrare.
 * @param {Date} birthDate - data nașterii
 * @param {Date} startDate - data începerii executării
 * @param {boolean} life - detențiune pe viață
 * @param {string} art - articol liberare condiționată
 * @param {number} y - ani pedeapsă
 * @param {number} m - luni pedeapsă
 * @param {number} d - zile pedeapsă
 * @returns {string[]} - lista erorilor
 */
function validateInputs(birthDate, startDate, life, art, y, m, d) {
    const err = [];
    if (!birthDate) err.push('Data nașterii este invalidă sau incompletă.');
    if (!startDate) err.push('Data începerii este invalidă sau incompletă.');
    if (!life && !art) err.push('Selectați articolul de liberare condiționată.');
    if (!life && y === 0 && m === 0 && d === 0) err.push('Introduceți durata pedepsei.');
    if (birthDate && startDate && birthDate > startDate) err.push('Data nașterii este ulterioară începerii executării.');

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
            err.push(`Perioada adăugată ${i + 1}: ambele date sunt obligatorii.`);
        } else {
            const sD = parseDate(st);
            const eD = parseDate(en);
            if (!sD || !eD) err.push(`Perioada adăugată ${i + 1}: format dată invalid.`);
            else if (eD <= sD) err.push(`Perioada adăugată ${i + 1}: data finală trebuie să fie strict după data inițială.`);
        }
    });

    return err;
}

/**
 * Actualizează data propozabilă scăzând zilele muncite introduse.
 * Folosește window.lastProposedDate setat la calcul.
 */
function updateProposedDateWithWorkDays() {
    const input = document.getElementById('workDaysInput');
    const result = document.getElementById('workDaysResult');
    if (!input || !result || !window.lastProposedDate) return;

    const days = parseInt(input.value) || 0;
    const newDate = new Date(window.lastProposedDate);
    newDate.setDate(newDate.getDate() - days);

    result.value = fmtDate(newDate);
}

/**
 * Calculează toate datele și afișează rezultatele.
 */
function calculateAll() {
    const errC = document.getElementById('errorContainer');
    errC.classList.remove('visible');

    const birthDate = parseDate(document.getElementById('birthDate').value.trim());
    const startDate = parseDate(document.getElementById('startDate').value.trim());
    const life = document.getElementById('lifeSentence').checked;
    const art = document.getElementById('liberationArticle').value;
    const y = parseInt(document.getElementById('durYears').value) || 0;
    const m = parseInt(document.getElementById('durMonths').value) || 0;
    const d = parseInt(document.getElementById('durDays').value) || 0;

    const err = validateInputs(birthDate, startDate, life, art, y, m, d);
    if (err.length > 0) {
        errC.innerHTML = err.map(e => '• ' + e).join('<br>');
        errC.classList.add('visible');
        return;
    }

    const steps = [];
    let totalDays, theorExp;

    if (life) {
        const d20 = new Date(startDate);
        d20.setFullYear(d20.getFullYear() + 20);
        d20.setDate(d20.getDate() - 1);
        totalDays = daysBetween(startDate, d20) + 1;
        theorExp = d20;
        steps.push(`Pedepsa este detențiune pe viață. Se folosește plafonul de 20 ani (${totalDays} zile).`);
    } else {
        theorExp = addCalendarSafe(startDate, y, m, d);
        theorExp.setDate(theorExp.getDate() - 1);
        totalDays = daysBetween(startDate, theorExp) + 1;
        steps.push(`Data începerii executării: ${fmtDate(startDate)}. Durata pedepsei: ${y} ani, ${m} luni, ${d} zile.`);
        steps.push(`Adunăm calendaristic: anii, apoi lunile, apoi zilele. Scădem o zi (regula OMJ 2188/C/2022).`);
        steps.push(`Expirarea teoretică este ${fmtDate(theorExp)}.`);
        steps.push(`Numărăm zilele dintre ${fmtDate(startDate)} și ${fmtDate(theorExp)}, inclusiv ambele capete: ${totalDays} zile.`);
    }

    // Perioade deduse
    const dedIntervals = [];
    document.querySelectorAll('.deduction-row').forEach(r => {
        const sD = parseDate(r.querySelector('.ded-start').value.trim());
        const eD = parseDate(r.querySelector('.ded-end').value.trim());
        if (sD && eD) dedIntervals.push([sD, eD]);
    });

    let ded = sumIntervals(dedIntervals);
    document.querySelectorAll('.manual-days').forEach(i => {
        const v = parseInt(i.value);
        if (!isNaN(v) && v > 0) ded += v;
    });

    if (ded > totalDays) {
        errC.innerHTML = '• Deducerile depășesc mandatul total.';
        errC.classList.add('visible');
        return;
    }
    steps.push(`Perioadele deduse însumează ${ded} zile (după unificarea suprapunerilor).`);

    // Perioade adăugate
    let non = 0;
    document.querySelectorAll('.ne-days').forEach(inp => {
        const v = parseInt(inp.value);
        if (!isNaN(v) && v > 0) non += v;
    });
    steps.push(`Perioadele adăugate (neexecutate) însumează ${non} zile.`);

    // Expirare reală
    let realExp = new Date(theorExp);
    realExp.setDate(realExp.getDate() - ded + non);
    steps.push(`Expirarea reală = ${fmtDate(theorExp)} − ${ded} zile deduse + ${non} zile adăugate = ${fmtDate(realExp)}.`);

    // Categoria de vârstă la expirare
    const ageAtExpiry = getAgeCategoryAtDate(birthDate, theorExp, currentSex, art);
    steps.push(`La data expirării teoretice, deținutul are categoria de vârstă: ${ageAtExpiry}.`);

    // Fracții liberare condiționată
    const sentenceOver10 = life ? false : (y * 12 + m + d / 30) > 120;
    const fracResult = getLiberationFractions(life, art, ageAtExpiry, sentenceOver10, totalDays, birthDate, theorExp);

    if (fracResult.error) {
        errC.innerHTML = '• ' + fracResult.error;
        errC.classList.add('visible');
        return;
    }

    const { mR, tR, pM, pT, articleInfo } = fracResult;
    steps.push(`Articolul aplicabil: ${articleInfo}.`);
    steps.push(`Fracția minimă obligatorie: ${fracStr(mR)}. Fracția totală/propozabilă: ${fracStr(tR)}.`);

    let mDays = Math.floor(totalDays * mR);
    let tDays = Math.floor(totalDays * tR);
    if (mDays > pM) mDays = pM;
    if (tDays > pT) tDays = pT;

    steps.push(`Fracția minimă: Math.floor(${totalDays} × ${fracStr(mR)}) = ${mDays} zile (din mandatul total). Math.floor rotunjește în jos (în defavoarea condamnatului).`);
    steps.push(`Fracția totală: Math.floor(${totalDays} × ${fracStr(tR)}) = ${tDays} zile (din mandatul total).`);

    // Date fracții
    let mDate = new Date(startDate);
    mDate.setDate(mDate.getDate() + mDays - 1);
    mDate.setDate(mDate.getDate() - ded + non);

    let tDate = new Date(startDate);
    tDate.setDate(tDate.getDate() + tDays - 1);
    tDate.setDate(tDate.getDate() - ded + non);

    // Salvează global data propozabilă pentru scăderea zilelor muncite
    window.lastProposedDate = new Date(tDate);

    // 1/5 mandat
    const fifth = Math.floor(totalDays / 5);
    let fDate = new Date(startDate);
    fDate.setDate(fDate.getDate() + fifth - 1);
    fDate.setDate(fDate.getDate() - ded + non);

    // Zile executate și rest
    const executedDays = Math.max(0, daysBetween(startDate, today()) + 1);
    const remaining = realExp ? Math.max(0, daysBetween(today(), realExp) + 1) : '—';

    // Carantină
    const quarantineEnd = new Date(startDate);
    quarantineEnd.setDate(quarantineEnd.getDate() + 20);

    // Alerte
    const alertDates = [
        { label: 'Fracție minimă obligatorie', date: mDate },
        { label: 'Data propusă (totală)', date: tDate },
        { label: 'Termen 1/5', date: fDate },
        { label: 'Expirare reală', date: realExp },
        { label: 'Carantină expiră', date: quarantineEnd }
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
        alertsHtml = '<div class="alerts-container"><h4>⚠️ ALERTE – Termene apropiate</h4><ul>';
        alerts.forEach(a => {
            const found = alertDates.find(x => x.label === a.label);
            alertsHtml += `<li>⚠️ ${a.label} expiră în <strong>${a.diff} zile</strong> (${fmtDate(found.date)})</li>`;
        });
        alertsHtml += '</ul></div>';
    }
    document.getElementById('alertsContainer').innerHTML = alertsHtml;
    document.getElementById('alertsContainer').classList.toggle('hidden', alerts.length === 0);

    // Timeline
    const timelineItems = [
        { label: 'Început executare', date: startDate },
        { label: 'Carantină expiră', date: quarantineEnd },
        { label: '1/5 mandat', date: fDate },
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
    timelineItems.sort((a, b) => a.date - b.date);

    let timelineHtml = '';
    timelineItems.forEach(item => {
        const diff = daysBetween(t, item.date);
        const passed = diff < 0;
        timelineHtml += `<li class="${passed ? 'passed' : ''}"><span class="tl-date">${fmtDate(item.date)}</span> <span class="tl-label">${item.label}</span></li>`;
    });
    document.getElementById('timelineList').innerHTML = timelineHtml;
    document.getElementById('timelineContainer').classList.remove('hidden');

    // Rest după liberare condiționată
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

    // Construire HTML rezultate
    const nume = document.getElementById('observations').value.trim();
    let html = '';
    if (nume) html += `<div class="result-item" style="margin-bottom:8px;"><div class="result-label">Observații</div><div class="result-value">${nume}</div></div>`;

    html += `<div class="result-section"><h4>DETALII MANDAT</h4><div class="result-grid">
        <div class="result-item"><div class="result-label">Expirare teoretică</div><div class="result-value">${formatDateWithWarning(theorExp)}</div></div>
        <div class="result-item important"><div class="result-label">Expirare REALĂ</div><div class="result-value">${formatDateWithWarning(realExp)}</div></div>
        <div class="result-item"><div class="result-label">Zile deduse</div><div class="result-value">${ded} zile</div></div>
        <div class="result-item"><div class="result-label">Zile adăugate (neexecutate)</div><div class="result-value" style="color:#ff6b6b;">${non} zile</div></div>
        <div class="result-item"><div class="result-label">Zile executate efectiv</div><div class="result-value">${executedDays} zile</div></div>
        <div class="result-item"><div class="result-label">Rest rămas</div><div class="result-value">${remaining} zile</div></div>
    </div></div>`;

    html += `<div class="result-section"><h4>FRACȚII LIBERARE CONDIȚIONATĂ</h4><div class="result-grid">
        <div class="result-item">
            <div class="result-label">FRACȚIE MINIMĂ OBLIGATORIE</div>
            <div class="result-value"><span class="fraction">${fracStr(mR)}</span> → (fără deduceri: ${mDays}z / cu deduceri: ${daysBetween(startDate, mDate) + 1}z)</div>
            <div class="result-label" style="margin-top:4px;">Data</div><div class="result-value">${formatDateWithWarning(mDate)}</div>
        </div>
        <div class="result-item">
            <div class="result-label">DATA PROPOZABILĂ</div>
            <div class="result-value"><span class="fraction">${fracStr(tR)}</span> → (fără deduceri: ${tDays}z / cu deduceri: ${daysBetween(startDate, tDate) + 1}z)</div>
            <div class="result-label" style="margin-top:4px;">Data</div><div class="result-value">${formatDateWithWarning(tDate)}</div>
        </div>
    </div></div>`;

    // Secțiunea nouă: scădere zile muncite din data propozabilă
    html += `<div class="result-section">
        <h4>SCĂDERE ZILE MUNCITE DIN DATA PROPOZABILĂ</h4>
        <div class="form-grid">
            <div>
                <label for="workDaysInput">Zile muncite de scăzut</label>
                <input type="number" id="workDaysInput" min="0" value="0">
            </div>
            <div>
                <label>Noua dată propozabilă</label>
                <input type="text" id="workDaysResult" readonly style="background:rgba(201,162,39,0.08);font-weight:600;" tabindex="-1">
            </div>
        </div>
        <p style="margin-top:8px;font-size:0.75rem;color:var(--text-light);">
            <em>Scăderea se face direct din data propozabilă (data se reduce cu zilele introduse).</em>
        </p>
    </div>`;

    html += `<div class="result-section"><h4>REANALIZARE 1/5</h4><div class="result-grid">
        <div class="result-item"><div class="result-label">1/5 mandat</div>
            <div class="result-value">(fără deduceri: ${fifth}z / cu deduceri: ${daysBetween(startDate, fDate) + 1}z)</div>
            <div class="result-label" style="margin-top:4px;">Data împlinirii</div><div class="result-value">${formatDateWithWarning(fDate)}</div>
        </div>
    </div></div>`;

    html += `<div class="result-section"><h4>ALTE DATE</h4><div class="result-grid">
        <div class="result-item"><div class="result-label">Articol LC</div><div class="result-value">${articleInfo}</div></div>
        <div class="result-item"><div class="result-label">Mandat total</div><div class="result-value">${totalDays} zile</div></div>
        <div class="result-item"><div class="result-label">Carantină expiră</div><div class="result-value">${formatDateWithWarning(quarantineEnd)}</div></div>
    </div></div>`;

    html += restHtml;

    document.getElementById('resultsContent').innerHTML = html;
    document.getElementById('stepsList').innerHTML = steps.map(s => `<li>${s}</li>`).join('');
    document.getElementById('stepsContainer').classList.add('hidden');
    document.getElementById('toggleStepsBtn').innerHTML = '🧮 AFIȘEAZĂ PAȘII CALCULULUI';
    document.getElementById('toggleStepsBtn').setAttribute('aria-expanded', 'false');
    document.getElementById('resultsCard').classList.remove('hidden');

    // Atașează evenimentul pentru scăderea zilelor muncite
    const workInput = document.getElementById('workDaysInput');
    if (workInput) {
        workInput.addEventListener('input', updateProposedDateWithWorkDays);
        updateProposedDateWithWorkDays(); // inițializare
    }

    autoSave();
}

/**
 * Calculează măsurile preventive în timp real.
 */
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

// ========== INIȚIALIZARE ==========

document.addEventListener('DOMContentLoaded', function() {
    // Tema
    applyTheme();

    // Badge spețe
    updateCaseBadge();

    // Restaurare auto-save
    restoreAutoSave();

    // Evenimente butoane
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('infoBtn').addEventListener('click', openInfoModal);
    document.getElementById('legalBtn').addEventListener('click', openLegalModal);
    document.getElementById('saveBtn').addEventListener('click', saveCase);
    document.getElementById('loadBtn').addEventListener('click', openLoadModal);
    document.getElementById('resetBtn').addEventListener('click', confirmReset);

    document.getElementById('addDedBtn').addEventListener('click', addDedRow);
    document.getElementById('addManDedBtn').addEventListener('click', addManDedRow);
    document.getElementById('addNonExecBtn').addEventListener('click', addNonExecRow);

    document.getElementById('calcBtn').addEventListener('click', calculateAll);
    document.getElementById('copyResultsBtn').addEventListener('click', copyResults);
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
    document.getElementById('toggleStepsBtn').addEventListener('click', toggleSteps);

    // Sex toggle
    sexToggle.addEventListener('change', updateSexUI);

    // Mascare dată
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('date-masked')) applyDateMask(e);
    });

    // Butoane AZI
    document.querySelectorAll('.btn-today').forEach(btn => {
        btn.addEventListener('click', function() {
            setToday(this.dataset.target);
        });
    });

    // Etichete vârstă
    document.getElementById('birthDate').addEventListener('input', updAgeTag);
    document.getElementById('liberationArticle').addEventListener('change', updAgeTag);

    // Viață toggle
    document.getElementById('lifeSentence').addEventListener('change', function() {
        document.getElementById('sentenceDuration').classList.toggle('hidden', this.checked);
    });

    // Măsuri preventive live
    document.getElementById('masuriRefDate').addEventListener('input', calcMasuriPreventive);
    document.getElementById('masuriDays').addEventListener('input', calcMasuriPreventive);
    calcMasuriPreventive();

    // Escape închide modalul
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) overlay.remove();
        }
    });

    // Avertisment la părăsirea paginii
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

    // Actualizare inițială interfață sex
    updateSexUI();
});