(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_PRISON_DATE__) return;
  window.__EVIDENTA_PEDEPSE_PRISON_DATE__ = true;

  function setupControl() {
    const input = document.getElementById('prisonReceivedDate');
    const start = document.getElementById('startDate');
    if (!input || !start) return null;

    let outer = document.getElementById('prisonReceivedControl');
    if (!outer) {
      const dateWrapper = input.closest('.date-wrapper') || input.parentElement;
      outer = dateWrapper?.parentElement;
      if (!outer) return null;

      const existingNodes = [...outer.childNodes];
      const field = document.createElement('div');
      field.id = 'prisonReceivedDateField';
      existingNodes.forEach(node => field.appendChild(node));

      const oldLabel = field.querySelector('label[for="prisonReceivedDate"]');
      if (oldLabel) oldLabel.textContent = 'DATA INTRĂRII ÎN PENITENCIAR/CENTRU';

      const checkboxLabel = document.createElement('label');
      checkboxLabel.className = 'ev-prison-same-check';
      checkboxLabel.htmlFor = 'prisonReceivedSameAsStart';
      checkboxLabel.innerHTML = `
        <input type="checkbox" id="prisonReceivedSameAsStart" checked aria-controls="prisonReceivedDateField" aria-expanded="false">
        <span>DATA INTRĂRII ÎN PENITENCIAR ESTE ACEEAȘI CU DATA ÎNCEPERII PEDEPSEI</span>`;

      outer.id = 'prisonReceivedControl';
      outer.append(checkboxLabel, field);
    }

    return {
      outer,
      field: document.getElementById('prisonReceivedDateField'),
      checkbox: document.getElementById('prisonReceivedSameAsStart'),
      input,
      start
    };
  }

  function sync({ infer = false } = {}) {
    const control = setupControl();
    if (!control?.checkbox || !control.field) return;

    const startValue = control.start.value.trim();
    const receivedValue = control.input.value.trim();
    if (infer) control.checkbox.checked = !receivedValue || receivedValue === startValue;

    if (control.checkbox.checked) control.input.value = startValue;
    control.field.hidden = control.checkbox.checked;
    control.checkbox.setAttribute('aria-expanded', String(!control.checkbox.checked));
  }

  function isFullMode() {
    return !document.body.classList.contains('ev-quick-mode') &&
      !document.body.classList.contains('ev-preventive-mode');
  }

  function validateBeforeCalculation(event) {
    if (!isFullMode()) return true;
    const control = setupControl();
    if (!control?.checkbox) return true;

    sync();
    if (control.checkbox.checked || control.input.value.trim()) return true;

    const error = document.getElementById('errorContainer');
    if (error) {
      error.textContent = '• Introduceți data intrării în penitenciar/centru.';
      error.classList.add('visible');
    }
    control.field.hidden = false;
    control.input.focus({ preventScroll: true });

    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    return false;
  }

  function syncAfterAction({ infer = false } = {}) {
    window.requestAnimationFrame(() => sync({ infer }));
  }

  function init() {
    const control = setupControl();
    if (!control) return;

    sync({ infer: true });
    control.checkbox?.addEventListener('change', () => sync());
    control.start.addEventListener('input', () => sync());

    document.addEventListener('click', event => {
      if (event.target.closest('#calcBtn')) validateBeforeCalculation(event);
    }, true);

    document.addEventListener('click', event => {
      if (event.target.closest('.saved-case-name')) {
        syncAfterAction({ infer: true });
        return;
      }
      if (event.target.closest('#resetBtn')) {
        syncAfterAction({ infer: true });
        return;
      }
      if (event.target.closest('.btn-today[data-target="startDate"], [data-mode]')) {
        syncAfterAction();
      }
    });
  }

  window.syncPrisonReceivedControl = sync;
  window.validatePrisonReceivedControl = validateBeforeCalculation;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
