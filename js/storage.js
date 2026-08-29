// ========== GESTIONARE STOCARE LOCALĂ (localStorage) ==========

/**
 * Citește spețele salvate din localStorage.
 * @returns {Object} - obiect cu spețele
 */
function getCases() {
    try {
        return JSON.parse(localStorage.getItem('anpCases') || '{}');
    } catch (e) {
        return {};
    }
}

/**
 * Actualizează badge-ul cu numărul de spețe salvate.
 */
function updateCaseBadge() {
    const cases = getCases();
    const count = Object.keys(cases).length;
    const badge = document.getElementById('caseCountBadge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 999 ? '999+' : String(count);
        badge.setAttribute('aria-label', `${count} spețe salvate`);
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
        badge.removeAttribute('aria-label');
    }
}

/**
 * Salvează speța curentă cu nume dat.
 */
function saveCase() {
    const name = prompt('Nume speță:');
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();
    const cases = getCases();
    if (cases[trimmedName]) {
        if (!confirm(`Există deja o speță cu numele "${trimmedName}". Dorești să o suprascrii?`)) return;
    }
    const data = {
        sex: currentSex,
        birthDate: document.getElementById('birthDate').value,
        observations: document.getElementById('observations').value,
        life: document.getElementById('lifeSentence').checked,
        art: document.getElementById('liberationArticle').value,
        y: document.getElementById('durYears').value,
        m: document.getElementById('durMonths').value,
        d: document.getElementById('durDays').value,
        start: document.getElementById('startDate').value,
        condRelease: document.getElementById('conditionalReleaseDate').value,
        masuriRefDate: document.getElementById('masuriRefDate')?.value || '',
        masuriDays: document.getElementById('masuriDays')?.value || '0',
        dedRows: Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
            start: r.querySelector('.ded-start')?.value || '',
            end: r.querySelector('.ded-end')?.value || ''
        })),
        manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
        nonRows: Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
            type: r.querySelector('.ne-type')?.value || 'escape',
            start: r.querySelector('.ne-start')?.value || '',
            end: r.querySelector('.ne-end')?.value || ''
        }))
    };
    cases[trimmedName] = data;
    localStorage.setItem('anpCases', JSON.stringify(cases));
    updateCaseBadge();
    alert('Speță salvată!');
}

/**
 * Încarcă o speță după nume și populează formularul.
 * @param {string} name - numele speței
 */
window.loadCaseByName = function(name) {
    const cases = getCases();
    if (!cases[name]) return;
    const d = cases[name];

    // Ascundem rezultatele vechi pentru a evita confuzia
    document.getElementById('resultsCard').classList.add('hidden');

    currentSex = d.sex || 'M';
    document.getElementById('sexToggle').checked = currentSex === 'M';
    updateSexUI();

    document.getElementById('birthDate').value = d.birthDate || '';
    document.getElementById('observations').value = d.observations || '';
    document.getElementById('lifeSentence').checked = d.life || false;
    document.getElementById('sentenceDuration').classList.toggle('hidden', d.life);
    document.getElementById('liberationArticle').value = d.art || '';
    document.getElementById('durYears').value = d.y || 0;
    document.getElementById('durMonths').value = d.m || 0;
    document.getElementById('durDays').value = d.d || 0;
    document.getElementById('startDate').value = d.start || '';
    document.getElementById('conditionalReleaseDate').value = d.condRelease || '';
    if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = d.masuriRefDate || '';
    if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = d.masuriDays || 0;
    const articleSelect = document.getElementById('liberationArticle');
    if (articleSelect) articleSelect.disabled = Boolean(d.life);

    document.getElementById('deductionsContainer').innerHTML = '';
    (d.dedRows || []).forEach(r => {
        addDedRow();
        const last = document.querySelector('.deduction-row:last-child');
        if (last) {
            last.querySelector('.ded-start').value = r.start || '';
            last.querySelector('.ded-end').value = r.end || '';
            updDed(last);
        }
    });

    document.getElementById('manualDeductionsContainer').innerHTML = '';
    (d.manDed || []).forEach(v => {
        addManDedRow();
        const last = document.querySelector('.manual-days:last-child');
        if (last) last.value = v;
    });

    document.getElementById('nonExecContainer').innerHTML = '';
    (d.nonRows || []).forEach(r => {
        addNonExecRow();
        const last = document.querySelector('.non-exec-row:last-child');
        if (last) {
            last.querySelector('.ne-type').value = r.type || 'escape';
            last.querySelector('.ne-start').value = r.start || '';
            last.querySelector('.ne-end').value = r.end || '';
            updNonExec(last);
        }
    });

    updAgeTag();
    document.querySelector('.modal-overlay')?.remove();
    alert('Speță încărcată!');
};

/**
 * Șterge o speță după nume.
 * @param {string} name - numele speței
 */
window.deleteCase = function(name) {
    if (!confirm(`Sigur doriți să ștergeți speța "${name}"?`)) return;
    const cases = getCases();
    delete cases[name];
    localStorage.setItem('anpCases', JSON.stringify(cases));
    document.querySelector('.modal-overlay')?.remove();
    updateCaseBadge();
    alert('Speță ștearsă!');
    setTimeout(openLoadModal, 100);
};

/**
 * Redenumește o speță.
 * @param {string} oldName - numele actual
 */
window.renameCase = function(oldName) {
    const newName = prompt('Nume nou pentru speță:', oldName);
    if (!newName || !newName.trim()) return;
    const trimmedNew = newName.trim();
    if (trimmedNew === oldName) return;
    const cases = getCases();
    if (cases[trimmedNew]) {
        alert('Există deja o speță cu acest nume. Alege alt nume.');
        return;
    }
    const data = cases[oldName];
    delete cases[oldName];
    cases[trimmedNew] = data;
    localStorage.setItem('anpCases', JSON.stringify(cases));
    document.querySelector('.modal-overlay')?.remove();
    updateCaseBadge();
    alert('Speță redenumită!');
    setTimeout(openLoadModal, 100);
};

/**
 * Salvează automat starea curentă a formularului.
 */
function autoSave() {
    try {
        const data = {
            sex: currentSex,
            birthDate: document.getElementById('birthDate').value,
            observations: document.getElementById('observations').value,
            life: document.getElementById('lifeSentence').checked,
            art: document.getElementById('liberationArticle').value,
            y: document.getElementById('durYears').value,
            m: document.getElementById('durMonths').value,
            d: document.getElementById('durDays').value,
            start: document.getElementById('startDate').value,
            condRelease: document.getElementById('conditionalReleaseDate').value,
            dedRows: Array.from(document.querySelectorAll('.deduction-row')).map(r => ({
                start: r.querySelector('.ded-start')?.value || '',
                end: r.querySelector('.ded-end')?.value || ''
            })),
            manDed: Array.from(document.querySelectorAll('.manual-days')).map(i => i.value),
            nonRows: Array.from(document.querySelectorAll('.non-exec-row')).map(r => ({
                type: r.querySelector('.ne-type')?.value || 'escape',
                start: r.querySelector('.ne-start')?.value || '',
                end: r.querySelector('.ne-end')?.value || ''
            }))
        };
        localStorage.setItem('anpLastCase', JSON.stringify(data));
    } catch (e) {}
}

/**
 * Restaurează ultima stare salvată automat (la pornire).
 */
function restoreAutoSave() {
    const last = localStorage.getItem('anpLastCase');
    if (!last) return;
    try {
        const d = JSON.parse(last);
        currentSex = d.sex || 'M';
        document.getElementById('sexToggle').checked = currentSex === 'M';
        updateSexUI();
        document.getElementById('birthDate').value = d.birthDate || '';
        document.getElementById('observations').value = d.observations || '';
        document.getElementById('lifeSentence').checked = d.life || false;
        document.getElementById('sentenceDuration').classList.toggle('hidden', d.life);
        document.getElementById('liberationArticle').value = d.art || '';
        document.getElementById('durYears').value = d.y || 0;
        document.getElementById('durMonths').value = d.m || 0;
        document.getElementById('durDays').value = d.d || 0;
        document.getElementById('startDate').value = d.start || '';
        document.getElementById('conditionalReleaseDate').value = d.condRelease || '';
        if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = d.masuriRefDate || '';
        if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = d.masuriDays || 0;
        const articleSelect = document.getElementById('liberationArticle');
        if (articleSelect) articleSelect.disabled = Boolean(d.life);

        document.getElementById('deductionsContainer').innerHTML = '';
        (d.dedRows || []).forEach(r => {
            addDedRow();
            const last = document.querySelector('.deduction-row:last-child');
            if (last) {
                last.querySelector('.ded-start').value = r.start || '';
                last.querySelector('.ded-end').value = r.end || '';
                updDed(last);
            }
        });

        document.getElementById('manualDeductionsContainer').innerHTML = '';
        (d.manDed || []).forEach(v => {
            addManDedRow();
            const last = document.querySelector('.manual-days:last-child');
            if (last) last.value = v;
        });

        document.getElementById('nonExecContainer').innerHTML = '';
        (d.nonRows || []).forEach(r => {
            addNonExecRow();
            const last = document.querySelector('.non-exec-row:last-child');
            if (last) {
                last.querySelector('.ne-type').value = r.type || 'escape';
                last.querySelector('.ne-start').value = r.start || '';
                last.querySelector('.ne-end').value = r.end || '';
                updNonExec(last);
            }
        });

        updAgeTag();
    } catch (e) {}
}