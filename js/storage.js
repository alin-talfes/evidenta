// ========== GESTIONARE STOCARE LOCALĂ (localStorage) ==========

function getCases() {
    try {
        return JSON.parse(localStorage.getItem('anpCases') || '{}');
    } catch (e) {
        return {};
    }
}

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

function collectStoredCaseData() {
    return {
        sex: currentSex,
        birthDate: document.getElementById('birthDate').value,
        observations: document.getElementById('observations').value,
        life: document.getElementById('lifeSentence').checked,
        art: document.getElementById('liberationArticle').value,
        y: document.getElementById('durYears').value,
        m: document.getElementById('durMonths').value,
        d: document.getElementById('durDays').value,
        start: document.getElementById('startDate').value,
        prisonReceived: document.getElementById('prisonReceivedDate')?.value || '',
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
}

function saveCase() {
    const name = prompt('Nume speță:');
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();
    const cases = getCases();
    if (cases[trimmedName]) {
        if (!confirm(`Există deja o speță cu numele "${trimmedName}". Dorești să o suprascrii?`)) return;
    }
    cases[trimmedName] = collectStoredCaseData();
    localStorage.setItem('anpCases', JSON.stringify(cases));
    updateCaseBadge();
    alert('Speță salvată!');
}

function populateStoredCase(d) {
    currentSex = d.sex || 'M';
    document.getElementById('sexToggle').checked = currentSex === 'M';
    updateSexUI();

    document.getElementById('birthDate').value = d.birthDate || '';
    document.getElementById('observations').value = d.observations || '';
    document.getElementById('lifeSentence').checked = d.life || false;
    document.getElementById('liberationArticle').value = d.art || '';
    document.getElementById('durYears').value = d.y || 0;
    document.getElementById('durMonths').value = d.m || 0;
    document.getElementById('durDays').value = d.d || 0;
    document.getElementById('startDate').value = d.start || '';
    if (document.getElementById('prisonReceivedDate')) document.getElementById('prisonReceivedDate').value = d.prisonReceived || '';
    document.getElementById('conditionalReleaseDate').value = d.condRelease || '';
    if (document.getElementById('masuriRefDate')) document.getElementById('masuriRefDate').value = d.masuriRefDate || '';
    if (document.getElementById('masuriDays')) document.getElementById('masuriDays').value = d.masuriDays || 0;

    const sentenceDuration = document.getElementById('sentenceDuration');
    if (sentenceDuration) sentenceDuration.classList.toggle('hidden', Boolean(d.life));
    const articleSelect = document.getElementById('liberationArticle');
    if (articleSelect) articleSelect.disabled = false;

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
}

window.loadCaseByName = function(name) {
    const cases = getCases();
    if (!cases[name]) return;
    document.getElementById('resultsCard').classList.add('hidden');
    populateStoredCase(cases[name]);
    document.querySelector('.modal-overlay')?.remove();
    alert('Speță încărcată!');
};

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

function autoSave() {
    try {
        localStorage.setItem('anpLastCase', JSON.stringify(collectStoredCaseData()));
    } catch (e) {}
}

function restoreAutoSave() {
    const last = localStorage.getItem('anpLastCase');
    if (!last) return;
    try {
        populateStoredCase(JSON.parse(last));
    } catch (e) {}
}
