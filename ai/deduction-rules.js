(function(root){
'use strict';

const TYPE_GENERIC = 'generic';
const TYPE_RETENTION_24H = 'retention24h';
const TYPE_PREVENTIVE = 'preventive';
const TYPE_HOME_ARREST = 'home_arrest';

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
  if (/\barest(?:ul|ului)?\s+la\s+domiciliu\b|\barestare(?:a|ii)?\s+la\s+domiciliu\b/.test(value)) return TYPE_HOME_ARREST;
  if (/\b(?:arest(?:ul|ului)?|arestare(?:a|ii)?)\s+preventiv(?:a|e|ul|ului)?\b/.test(value)) return TYPE_PREVENTIVE;
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
    `<option value="${TYPE_PREVENTIVE}">Arest preventiv — capete incluse</option>`,
    `<option value="${TYPE_HOME_ARREST}">Arest la domiciliu — capete incluse</option>`
  ].join('');
  select.value = inferTypeFromSource(source);
  return select;
}

function syncRow(row, preserveOriginal=true){
  const type = row.querySelector('.d-measure-type')?.value || TYPE_GENERIC;
  const startInput = row.querySelector('.d-start');
  const endInput = row.querySelector('.d-end');
  if (!startInput || !endInput) return;
  const retention = type === TYPE_RETENTION_24H;

  if (retention) {
    if (preserveOriginal && row.dataset.retentionOriginalEnd == null) row.dataset.retentionOriginalEnd = endInput.value;
    endInput.value = startInput.value;
    endInput.disabled = true;
    endInput.setAttribute('aria-label','Sfârșit reținere — identic cu data reținerii');
  } else {
    if (row.dataset.retentionOriginalEnd != null) {
      endInput.value = row.dataset.retentionOriginalEnd;
      delete row.dataset.retentionOriginalEnd;
    }
    endInput.disabled = false;
    endInput.setAttribute('aria-label','Sfârșit perioadă dedusă');
  }
}

function decorateRow(row){
  if (!(row instanceof HTMLTableRowElement) || row.dataset.deductionRuleReady === 'true') return;
  const sourceCell = row.querySelector('.ai-source');
  if (!sourceCell) return;
  const typeCell = document.createElement('td');
  typeCell.className = 'ai-deduction-type';
  const select = createTypeSelect(sourceCell.textContent || '');
  typeCell.appendChild(select);
  row.insertBefore(typeCell, sourceCell);
  row.dataset.deductionRuleReady = 'true';

  const startInput = row.querySelector('.d-start');
  select.addEventListener('change',()=>{ syncRow(row,true); revokeConfirmation(); });
  startInput?.addEventListener('input',()=>{
    if ((select.value || TYPE_GENERIC) === TYPE_RETENTION_24H) syncRow(row,false);
  });
  syncRow(row,true);
}

function decorateRows(){ document.querySelectorAll('#deductionRows tr').forEach(decorateRow); }

function init(){
  const body = document.getElementById('deductionRows');
  if (!body) return;
  decorateRows();
  new MutationObserver(decorateRows).observe(body, { childList:true });
}

root.AIDeductionRules = {
  TYPE_GENERIC,
  TYPE_RETENTION_24H,
  TYPE_PREVENTIVE,
  TYPE_HOME_ARREST,
  inferTypeFromSource,
  deductionDays
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
}
})(typeof window !== 'undefined' ? window : globalThis);
