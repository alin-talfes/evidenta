(function(root){
'use strict';

const TYPE_GENERIC = 'generic';
const TYPE_RETENTION_24H = 'retention24h';
const TYPE_PREVENTIVE = 'preventive';

function fold(value){
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferTypeFromSource(source){
  const value = fold(source);
  const retention = /\bretin(?:ere|erea|erii|ut|uta)\b/.test(value) && /(?:\b24\s*(?:de\s*)?ore\b|\b24\s*h\b)/.test(value);
  if (retention) return TYPE_RETENTION_24H;
  if (/\b(?:arest|arestare)\s+preventiv(?:a|e)?\b/.test(value)) return TYPE_PREVENTIVE;
  return TYPE_GENERIC;
}

function dayNumber(value){
  const match = String(value || '').match(/^([0-3]\d)\.([01]\d)\.((?:19|20)\d{2})$/);
  if (!match) return null;
  const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return Math.floor(date.getTime() / 86400000);
}

function deductionDays(type, start, end){
  const a = dayNumber(start), b = dayNumber(end);
  if (a === null || b === null || b < a) return null;
  const span = b - a;
  if (type === TYPE_RETENTION_24H) return span <= 1 ? 1 : null;
  return span + 1;
}

function revokeConfirmation(){
  const checkbox = document.getElementById('confirmedData');
  const button = document.getElementById('calculateBtn');
  if (checkbox) checkbox.checked = false;
  if (button) button.disabled = true;
  document.getElementById('resultCard')?.classList.add('ai-hidden');
}

function createTypeSelect(source){
  const select = document.createElement('select');
  select.className = 'd-measure-type';
  select.setAttribute('aria-label', 'Tipul perioadei deduse');
  select.innerHTML = [
    `<option value="${TYPE_GENERIC}">Altă perioadă — capete incluse</option>`,
    `<option value="${TYPE_RETENTION_24H}">Reținere 24 h — 1 zi</option>`,
    `<option value="${TYPE_PREVENTIVE}">Arest preventiv — capete incluse</option>`
  ].join('');
  select.value = inferTypeFromSource(source);
  select.addEventListener('change', revokeConfirmation);
  return select;
}

function decorateRow(row){
  if (!(row instanceof HTMLTableRowElement) || row.dataset.deductionRuleReady === 'true') return;
  const sourceCell = row.querySelector('.ai-source');
  if (!sourceCell) return;
  const typeCell = document.createElement('td');
  typeCell.className = 'ai-deduction-type';
  typeCell.appendChild(createTypeSelect(sourceCell.textContent || ''));
  row.insertBefore(typeCell, sourceCell);
  row.dataset.deductionRuleReady = 'true';
}

function decorateRows(){
  document.querySelectorAll('#deductionRows tr').forEach(decorateRow);
}

function showCalculationError(message){
  const box = document.getElementById('calcError');
  if (!box) return;
  box.textContent = message;
  box.classList.remove('ai-hidden');
}

function addResultNote(count){
  if (!count) return;
  const container = document.getElementById('resultContent');
  if (!container || document.getElementById('ai-retention-rule-note')) return;
  const note = document.createElement('div');
  note.id = 'ai-retention-rule-note';
  note.className = 'ai-warning';
  note.textContent = `Regulă aplicată: ${count} interval(e) marcate „Reținere 24 h” au fost deduse cu câte 1 zi fiecare. Arestul preventiv și celelalte perioade rămân calculate cu ambele capete incluse.`;
  container.prepend(note);
}

function prepareSpecialDeductions(event){
  const restores = [];
  let retentionCount = 0;
  try {
    document.querySelectorAll('#deductionRows tr').forEach((row, index) => {
      const type = row.querySelector('.d-measure-type')?.value || TYPE_GENERIC;
      if (type !== TYPE_RETENTION_24H) return;
      const startInput = row.querySelector('.d-start');
      const endInput = row.querySelector('.d-end');
      const start = startInput?.value.trim() || '';
      const end = endInput?.value.trim() || '';
      if (!start || !end) return;
      const days = deductionDays(type, start, end);
      if (days === null) {
        throw new Error(`Deducerea ${index + 1}: o reținere de 24 de ore nu poate acoperi mai mult de două date calendaristice consecutive. Verifică intervalul sau schimbă tipul măsurii.`);
      }
      retentionCount += 1;
      restores.push([endInput, endInput.value]);
      endInput.value = startInput.value;
    });
  } catch (error) {
    restores.forEach(([input, value]) => { input.value = value; });
    event.preventDefault();
    event.stopImmediatePropagation();
    showCalculationError(error.message || String(error));
    return;
  }

  queueMicrotask(() => {
    restores.forEach(([input, value]) => { input.value = value; });
    addResultNote(retentionCount);
  });
}

function init(){
  const body = document.getElementById('deductionRows');
  if (!body) return;
  decorateRows();
  new MutationObserver(decorateRows).observe(body, { childList:true });
  document.getElementById('calculateBtn')?.addEventListener('click', prepareSpecialDeductions, true);
}

root.AIDeductionRules = {
  TYPE_GENERIC,
  TYPE_RETENTION_24H,
  TYPE_PREVENTIVE,
  inferTypeFromSource,
  deductionDays
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
}
})(typeof window !== 'undefined' ? window : globalThis);
