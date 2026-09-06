(function(root){
'use strict';

const TYPE_GENERIC = 'generic';
const TYPE_RETENTION_24H = 'retention24h';
const TYPE_PREVENTIVE = 'preventive';
const TYPE_HOUSE_ARREST = 'houseArrest';
const VALID_TYPES = new Set([TYPE_GENERIC, TYPE_RETENTION_24H, TYPE_PREVENTIVE, TYPE_HOUSE_ARREST]);

function normalizeType(type){
    return VALID_TYPES.has(type) ? type : TYPE_GENERIC;
}

function getTypeLabel(type){
    switch (normalizeType(type)) {
        case TYPE_RETENTION_24H: return 'Reținere 24 h';
        case TYPE_PREVENTIVE: return 'Arest preventiv';
        case TYPE_HOUSE_ARREST: return 'Arest la domiciliu';
        default: return 'Altă perioadă dedusă';
    }
}

function getEffectiveInterval(type, start, end){
    if (!(start instanceof Date) || isNaN(start)) return null;
    if (normalizeType(type) === TYPE_RETENTION_24H) return [new Date(start), new Date(start)];
    if (!(end instanceof Date) || isNaN(end) || end < start) return null;
    return [new Date(start), new Date(end)];
}

function calculateDays(type, start, end){
    const effective = getEffectiveInterval(type, start, end);
    return effective ? Math.round((effective[1].getTime() - effective[0].getTime()) / 86400000) + 1 : null;
}

root.ManualDeductionRules = {
    TYPE_GENERIC,
    TYPE_RETENTION_24H,
    TYPE_PREVENTIVE,
    TYPE_HOUSE_ARREST,
    normalizeType,
    getTypeLabel,
    getEffectiveInterval,
    calculateDays
};

if (typeof document === 'undefined') return;

function collectTypedDedRows(){
    return Array.from(document.querySelectorAll('.deduction-row')).map(r => {
        const type = normalizeType(r.querySelector('.ded-type')?.value || TYPE_GENERIC);
        const start = r.querySelector('.ded-start')?.value.trim() || '';
        const rawEnd = r.querySelector('.ded-end')?.value.trim() || '';
        return {
            type,
            start,
            end: type === TYPE_RETENTION_24H ? '' : rawEnd,
            days: r.querySelector('.ded-days')?.value || ''
        };
    }).filter(r => r.start || r.end);
}

function syncRowForCalculation(r){
    const type = normalizeType(r.querySelector('.ded-type')?.value || TYPE_GENERIC);
    const startInput = r.querySelector('.ded-start');
    const endInput = r.querySelector('.ded-end');
    if (type === TYPE_RETENTION_24H && startInput && endInput) endInput.value = startInput.value;
}

function syncDeductionRow(r){
    if (!r) return;
    const type = normalizeType(r.querySelector('.ded-type')?.value || TYPE_GENERIC);
    const startInput = r.querySelector('.ded-start');
    const endInput = r.querySelector('.ded-end');
    const endWrap = r.querySelector('.ded-end-wrap');
    const startLabel = r.querySelector('.ded-start-label');
    const daysInput = r.querySelector('.ded-days');
    if (!startInput || !endInput || !daysInput) return;

    const retention = type === TYPE_RETENTION_24H;
    if (startLabel) startLabel.textContent = retention ? 'Data reținerii' : 'Început';
    if (endWrap) endWrap.classList.toggle('hidden', retention);
    endInput.disabled = retention;
    endInput.setAttribute('aria-hidden', retention ? 'true' : 'false');
    if (retention) endInput.value = startInput.value;

    const start = typeof parseDate === 'function' ? parseDate(startInput.value.trim()) : null;
    const end = retention ? start : (typeof parseDate === 'function' ? parseDate(endInput.value.trim()) : null);
    const days = calculateDays(type, start, end);
    if (!startInput.value.trim() || (!retention && !endInput.value.trim())) daysInput.value = '';
    else daysInput.value = days === null ? 'Eroare' : String(days);
}

root.addDedRow = function(initial = {}){
    const container = document.getElementById('deductionsContainer');
    if (!container) return;
    const r = document.createElement('div');
    r.className = 'period-row deduction-row';
    r.setAttribute('role', 'listitem');
    r.innerHTML = `
        <div><label>Tip</label><select class="ded-type" aria-label="Tip perioadă dedusă">
            <option value="${TYPE_PREVENTIVE}">Arest preventiv</option>
            <option value="${TYPE_HOUSE_ARREST}">Arest la domiciliu</option>
            <option value="${TYPE_RETENTION_24H}">Reținere 24 h — 1 zi</option>
            <option value="${TYPE_GENERIC}">Altă perioadă dedusă — interval inclusiv</option>
        </select></div>
        <div><label class="ded-start-label">Început</label><input type="text" class="ded-start date-masked" placeholder="zz.ll.aaaa"></div>
        <div class="ded-end-wrap"><label>Sfârșit</label><input type="text" class="ded-end date-masked" placeholder="zz.ll.aaaa"></div>
        <div style="min-width:50px;"><label>Zile</label><input type="text" class="ded-days" readonly style="background:rgba(0,0,0,0.2);font-weight:600;" tabindex="-1"></div>
        <button class="btn btn-danger btn-sm" type="button" aria-label="Șterge rândul">X</button>
    `;
    container.appendChild(r);

    const typeSelect = r.querySelector('.ded-type');
    const startInput = r.querySelector('.ded-start');
    const endInput = r.querySelector('.ded-end');
    typeSelect.value = normalizeType(initial.type || TYPE_PREVENTIVE);
    startInput.value = initial.start || '';
    endInput.value = initial.end || '';

    const refresh = () => {
        syncDeductionRow(r);
        setTimeout(() => syncDeductionRow(r), 0);
    };
    typeSelect.addEventListener('change', refresh);
    startInput.addEventListener('input', refresh);
    endInput.addEventListener('input', refresh);
    r.querySelector('.btn-danger')?.addEventListener('click', () => r.remove());
    syncDeductionRow(r);
};

root.updDed = syncDeductionRow;

const originalCollectStoredCaseData = typeof root.collectStoredCaseData === 'function' ? root.collectStoredCaseData : null;
if (originalCollectStoredCaseData) {
    root.collectStoredCaseData = function(){
        const data = originalCollectStoredCaseData();
        data.dedRows = collectTypedDedRows().map(({type, start, end}) => ({type, start, end}));
        return data;
    };
}

const originalPopulateStoredCase = typeof root.populateStoredCase === 'function' ? root.populateStoredCase : null;
if (originalPopulateStoredCase) {
    root.populateStoredCase = function(data){
        originalPopulateStoredCase(data);
        const savedRows = Array.isArray(data?.dedRows) ? data.dedRows : [];
        document.querySelectorAll('.deduction-row').forEach((row, index) => {
            const saved = savedRows[index] || {};
            const type = normalizeType(saved.type || TYPE_GENERIC);
            const select = row.querySelector('.ded-type');
            if (select) select.value = type;
            if (row.querySelector('.ded-start')) row.querySelector('.ded-start').value = saved.start || '';
            if (row.querySelector('.ded-end')) row.querySelector('.ded-end').value = saved.end || '';
            syncDeductionRow(row);
        });
    };
}

const originalGetInputData = typeof root.getInputData === 'function' ? root.getInputData : null;
if (originalGetInputData) {
    root.getInputData = function(){
        const data = originalGetInputData();
        data.dedRows = collectTypedDedRows().map(({type, start, end}) => ({type, start, end}));
        return data;
    };
}

const originalCalculateAll = typeof root.calculateAll === 'function' ? root.calculateAll : null;
if (originalCalculateAll) {
    root.calculateAll = function(...args){
        document.querySelectorAll('.deduction-row').forEach(syncRowForCalculation);
        const result = originalCalculateAll.apply(this, args);
        if (root.lastCalculation) {
            const typedRows = collectTypedDedRows();
            root.lastCalculation.dedRowsData = typedRows.map(row => ({...row, label:getTypeLabel(row.type)}));
            if (root.lastCalculation.inputData) {
                root.lastCalculation.inputData.dedRows = typedRows.map(({type, start, end}) => ({type, start, end}));
            }
        }
        return result;
    };
}

function addRulesNote(){
    const container = document.getElementById('deductionsContainer');
    if (!container || document.getElementById('deductionRulesNote')) return;
    const note = document.createElement('p');
    note.id = 'deductionRulesNote';
    note.className = 'help-text';
    note.innerHTML = '<strong>Regulă:</strong> reținerea de 24 de ore se deduce ca o singură zi. Arestul preventiv și arestul la domiciliu se calculează pe interval, cu ziua de început și ziua de sfârșit incluse.';
    container.insertAdjacentElement('afterend', note);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addRulesNote, { once:true });
else addRulesNote();

})(typeof window !== 'undefined' ? window : globalThis);
