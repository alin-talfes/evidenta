(function(root){
'use strict';

const EDUCATIONAL = new Set(['NCP124','NCP125']);

function nonNegativeInt(value, label){
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 0) throw new Error(`${label}: introduceți un număr întreg pozitiv sau zero.`);
    return n;
}

function calculateArticle53({ referenceDate, years, months, days, deductedDays = 0 }){
    if (!(referenceDate instanceof Date) || isNaN(referenceDate)) throw new Error('Data de referință art. 53 este invalidă sau incompletă.');
    const y = nonNegativeInt(years, 'Ani pedeapsă maximă');
    const m = nonNegativeInt(months, 'Luni pedeapsă maximă');
    const d = nonNegativeInt(days, 'Zile pedeapsă maximă');
    const ded = nonNegativeInt(deductedDays, 'Zile deduse art. 53');
    if (y === 0 && m === 0 && d === 0) throw new Error('Introduceți durata pedepsei celei mai mari pentru calculul art. 53.');

    const expiry = root.addCalendarSafe(referenceDate, y, m, d);
    expiry.setDate(expiry.getDate() - 1);
    const totalDays = root.daysBetween(referenceDate, expiry) + 1;
    if (ded > totalDays) throw new Error('Zilele deduse art. 53 depășesc durata pedepsei celei mai mari.');
    const fifth = Math.floor(totalDays / 5);
    const date = root.thresholdDate(referenceDate, fifth, ded, 0);
    return { totalDays, fifth, date, expiry, deductedDays: ded, duration: { y, m, d } };
}

root.RegimeReanalysisRules = { calculateArticle53 };
if (typeof document === 'undefined') return;

const $ = id => document.getElementById(id);

function mountUI(){
    if ($('regimeMultipleCard')) return;
    const sentence = $('sentence-heading')?.closest('.card');
    if (!sentence) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'regimeMultipleCard';
    card.setAttribute('aria-labelledby','regime-multiple-heading');
    card.innerHTML = `
        <h3 id="regime-multiple-heading">REGIM — MAI MULTE PEDEPSE (OPȚIONAL)</h3>
        <div class="form-grid">
            <div>
                <label for="regimeMultiple">Aplică art. 53 Instrucțiuni</label>
                <label class="toggle-switch" style="margin-top:8px;">
                    <input type="checkbox" id="regimeMultiple">
                    <span class="toggle-slider" aria-hidden="true"></span>
                    <span class="life-label">Mai multe pedepse</span>
                </label>
            </div>
        </div>
        <div id="regimeMultipleFields" class="hidden">
            <div class="form-grid mt-8">
                <div><label for="regimeMaxYears">Ani</label><input type="number" id="regimeMaxYears" value="0" min="0"></div>
                <div><label for="regimeMaxMonths">Luni</label><input type="number" id="regimeMaxMonths" value="0" min="0"></div>
                <div><label for="regimeMaxDays">Zile</label><input type="number" id="regimeMaxDays" value="0" min="0"></div>
            </div>
            <div class="form-grid mt-12">
                <div><label for="regimeReferenceDate">Data de referință art. 53</label><input type="text" id="regimeReferenceDate" class="date-masked" placeholder="zz.ll.aaaa"></div>
                <div><label for="regimeDeductedDays">Zile deduse în hotărârea definitivă</label><input type="number" id="regimeDeductedDays" value="0" min="0"></div>
            </div>
        </div>`;
    sentence.insertAdjacentElement('afterend', card);
    $('regimeMultiple')?.addEventListener('change', syncVisibility);
    $('lifeSentence')?.addEventListener('change', syncAvailability);
    $('liberationArticle')?.addEventListener('change', syncAvailability);
    syncAvailability();
}

function eligible(){
    return !$('lifeSentence')?.checked && !EDUCATIONAL.has($('liberationArticle')?.value || '');
}

function syncVisibility(){
    const enabled = Boolean($('regimeMultiple')?.checked) && eligible();
    $('regimeMultipleFields')?.classList.toggle('hidden', !enabled);
}

function syncAvailability(){
    const card = $('regimeMultipleCard');
    if (!card) return;
    const ok = eligible();
    card.classList.toggle('hidden', !ok);
    if (!ok && $('regimeMultiple')) $('regimeMultiple').checked = false;
    syncVisibility();
}

function readConfig(){
    if (!$('regimeMultiple')?.checked || !eligible()) return null;
    const refRaw = $('regimeReferenceDate')?.value.trim() || '';
    const referenceDate = typeof root.parseDate === 'function' ? root.parseDate(refRaw) : null;
    return {
        referenceDate,
        referenceRaw: refRaw,
        years: $('regimeMaxYears')?.value || '0',
        months: $('regimeMaxMonths')?.value || '0',
        days: $('regimeMaxDays')?.value || '0',
        deductedDays: $('regimeDeductedDays')?.value || '0'
    };
}

function showError(message){
    const box = $('errorContainer');
    if (!box) return;
    box.innerHTML = '• ' + message;
    box.classList.add('visible');
    box.scrollIntoView?.({behavior:'smooth',block:'nearest'});
}

function updateAlerts(data){
    const host = $('alertsContainer');
    if (!host) return;
    host.querySelectorAll('li').forEach(li => {
        if ((li.textContent || '').trim().startsWith('Reanalizare')) li.remove();
    });
    const diff = typeof root.daysBetween === 'function' ? root.daysBetween(root.today(), data.date) : null;
    if (!Number.isInteger(diff) || diff < 0 || diff > 30) return;
    let wrapper = host.querySelector('.alerts-container');
    let list = wrapper?.querySelector('ul');
    if (!wrapper) {
        host.innerHTML = '<div class="alerts-container"><h4>ALERTE – Termene apropiate</h4><ul></ul></div>';
        wrapper = host.querySelector('.alerts-container');
        list = wrapper?.querySelector('ul');
    }
    if (list) {
        const li = document.createElement('li');
        li.innerHTML = `Reanalizare 1/5 · art. 53 expiră în <strong>${diff} zile</strong> (${root.fmtDate(data.date)})`;
        list.appendChild(li);
        host.classList.remove('hidden');
    }
}

function rewriteRenderedResult(data){
    const results = $('resultsContent');
    if (!results) return;
    const sections = Array.from(results.querySelectorAll('.result-section'));
    const regime = sections.find(s => s.querySelector('h4')?.textContent.trim() === 'REANALIZARE REGIM');
    if (regime) {
        regime.innerHTML = `<h4>REANALIZARE REGIM</h4><div class="result-grid"><div class="result-item"><div class="result-label">Reanalizare 1/5 · art. 53</div><div class="result-value">Bază: ${data.totalDays}z · 1/5: ${data.fifth}z</div><div class="result-label" style="margin-top:4px;">Data împlinirii</div><div class="result-value">${root.formatDateWithWarning(data.date)}</div></div></div>`;
    }
    const other = sections.find(s => s.querySelector('h4')?.textContent.trim() === 'ALTE DATE ȘI EXPLICAȚII LC');
    if (other) {
        const item = Array.from(other.querySelectorAll('.result-item')).find(el => (el.querySelector('.result-label')?.textContent || '').startsWith('Reanalizare'));
        if (item) {
            item.querySelector('.result-label').textContent = 'Reanalizare 1/5 · art. 53';
            const value = item.querySelector('.result-value');
            if (value) value.innerHTML = root.formatDateWithWarning(data.date);
        }
    }
    Array.from(document.querySelectorAll('#timelineList li')).forEach(li => {
        const label = li.querySelector('.tl-label');
        if ((label?.textContent || '').startsWith('Reanalizare')) {
            label.textContent = 'Reanalizare 1/5 · art. 53';
            const date = li.querySelector('.tl-date');
            if (date) date.textContent = root.fmtDate(data.date);
        }
    });
    const steps = $('stepsList');
    if (steps) {
        const li = document.createElement('li');
        li.textContent = `Art. 53: 1/5 se calculează din pedeapsa cea mai mare (${data.totalDays} zile), de la data de referință indicată, cu ${data.deductedDays} zile deduse.`;
        steps.appendChild(li);
    }
    updateAlerts(data);
}

function collectFields(){
    return {
        regimeMultiple: Boolean($('regimeMultiple')?.checked),
        regimeMaxYears: $('regimeMaxYears')?.value || '0',
        regimeMaxMonths: $('regimeMaxMonths')?.value || '0',
        regimeMaxDays: $('regimeMaxDays')?.value || '0',
        regimeReferenceDate: $('regimeReferenceDate')?.value || '',
        regimeDeductedDays: $('regimeDeductedDays')?.value || '0'
    };
}

function populateFields(data){
    if (!$('regimeMultiple')) return;
    $('regimeMultiple').checked = Boolean(data?.regimeMultiple);
    $('regimeMaxYears').value = data?.regimeMaxYears ?? 0;
    $('regimeMaxMonths').value = data?.regimeMaxMonths ?? 0;
    $('regimeMaxDays').value = data?.regimeMaxDays ?? 0;
    $('regimeReferenceDate').value = data?.regimeReferenceDate || '';
    $('regimeDeductedDays').value = data?.regimeDeductedDays ?? 0;
    syncAvailability();
}

function installWrappers(){
    const originalCalculate = root.calculateAll;
    if (typeof originalCalculate === 'function') {
        root.calculateAll = function(...args){
            const config = readConfig();
            let special = null;
            if (config) {
                try { special = calculateArticle53(config); }
                catch (error) { showError(error.message || String(error)); return; }
            }
            const result = originalCalculate.apply(this,args);
            if (special && root.lastCalculation) {
                root.lastCalculation.reanalysisLabel = 'Reanalizare 1/5 · art. 53';
                root.lastCalculation.fifth = special.fifth;
                root.lastCalculation.fDate = new Date(special.date);
                root.lastCalculation.regimeMultiple = {
                    enabled:true,
                    referenceDate:new Date(config.referenceDate),
                    totalDays:special.totalDays,
                    deductedDays:special.deductedDays,
                    duration:special.duration
                };
                Object.assign(root.lastCalculation.inputData || (root.lastCalculation.inputData = {}), collectFields());
                rewriteRenderedResult(special);
            }
            return result;
        };
    }

    const originalCollect = root.collectStoredCaseData;
    if (typeof originalCollect === 'function') root.collectStoredCaseData = function(){ return Object.assign(originalCollect(), collectFields()); };

    const originalPopulate = root.populateStoredCase;
    if (typeof originalPopulate === 'function') root.populateStoredCase = function(data){ const r=originalPopulate(data); populateFields(data); return r; };

    const originalGetInput = root.getInputData;
    if (typeof originalGetInput === 'function') root.getInputData = function(){ return Object.assign(originalGetInput(), collectFields()); };

    const originalReset = root.resetAll;
    if (typeof originalReset === 'function') root.resetAll = function(){ const r=originalReset(); populateFields({}); return r; };
}

mountUI();
installWrappers();
})(typeof window !== 'undefined' ? window : globalThis);
