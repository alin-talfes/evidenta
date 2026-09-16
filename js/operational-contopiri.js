(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CONTOPIRI__) return;
  window.__EVIDENTA_OPERATIONAL_CONTOPIRI__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-contopiri.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const PREFILL_PEDEPSE = 'evidenta:prefill:pedepse';
  const PREFILL_CONTOPIRI = 'evidenta:prefill:contopiri';

  function setSessionJson(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function getSessionJson(key, remove = false) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (remove) sessionStorage.removeItem(key);
      return value;
    } catch (_) {
      if (remove) sessionStorage.removeItem(key);
      return null;
    }
  }

  function go(path = '') {
    location.href = new URL(path, rootUrl).href;
  }

  function contopiriGroups() {
    const groups = { concurs:[], recidiva:[], revocare:[], litb:[] };
    document.querySelectorAll('.penalty-row').forEach(row => {
      const years = Number(row.querySelector('.penalty-years')?.value || 0);
      const months = Number(row.querySelector('.penalty-months')?.value || 0);
      const days = Number(row.querySelector('.penalty-days')?.value || 0);
      const type = row.querySelector('.penalty-type')?.value || 'concurs';
      if (!groups[type] || ![years,months,days].every(Number.isSafeInteger) || years < 0 || months < 0 || days < 0 || !(years || months || days)) return;
      groups[type].push({ years, months, days, totalDays: window.ContopiriCore.toDays(years,months,days) });
    });
    return groups;
  }

  function currentContopiriFinal() {
    try { return window.ContopiriCore?.calculate(contopiriGroups())?.finalDuration || null; }
    catch (_) { return null; }
  }

  function addContopiriTransferButton() {
    const result = document.getElementById('mergeResult');
    const final = currentContopiriFinal();
    if (!result || !final || result.style.display === 'none') return;
    let button = result.querySelector('[data-contopiri-to-pedepse]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary ev-contopiri-transfer';
      button.dataset.contopiriToPedepse = 'true';
      button.textContent = 'FOLOSEȘTE ÎN PEDEPSE';
      result.appendChild(button);
    }
    button.onclick = () => {
      const currentFinal = currentContopiriFinal();
      if (!currentFinal) return;
      setSessionJson(PREFILL_PEDEPSE, { source:'contopiri', duration:currentFinal, startDate:'', deductions:[] });
      go('./');
    };
  }

  function removeContopiriTransferButton() {
    document.querySelector('#mergeResult [data-contopiri-to-pedepse]')?.remove();
  }

  function fillContopiriFromPrefill() {
    const data = getSessionJson(PREFILL_CONTOPIRI, true);
    if (!data?.components?.length || typeof window.addPenaltyRow !== 'function') return;
    const container = document.getElementById('penaltyRowsContainer');
    if (container) container.innerHTML = '';
    data.components.forEach(item => {
      window.addPenaltyRow();
      const row = container?.lastElementChild;
      if (!row) return;
      row.querySelector('.penalty-years').value = item.years || 0;
      row.querySelector('.penalty-months').value = item.months || 0;
      row.querySelector('.penalty-days').value = item.days || 0;
      const type = ['concurs','recidiva','revocare','litb'].includes(item.group) ? item.group : 'concurs';
      row.querySelector('.penalty-type').value = type;
    });
  }

  function compactLegalBox() {
    const legal = document.querySelector('.legal-box');
    if (!legal || legal.closest('.ev-legal-details')) return;
    const details = document.createElement('details');
    details.className = 'ev-legal-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Baza legală și explicații';
    legal.insertAdjacentElement('beforebegin', details);
    details.append(summary, legal);
  }

  function init() {
    const rows = document.getElementById('penaltyRowsContainer');
    const result = document.getElementById('mergeResult');
    if (!rows || !result) return;
    compactLegalBox();
    fillContopiriFromPrefill();

    const resultObserver = new MutationObserver(() => addContopiriTransferButton());
    resultObserver.observe(result, { childList:true });

    const rowsObserver = new MutationObserver(removeContopiriTransferButton);
    rowsObserver.observe(rows, { childList:true });
    rows.addEventListener('input', removeContopiriTransferButton);
    rows.addEventListener('change', removeContopiriTransferButton);

    addContopiriTransferButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
