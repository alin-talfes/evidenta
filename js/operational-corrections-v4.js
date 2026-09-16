(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CORRECTIONS__) return;
  window.__EVIDENTA_OPERATIONAL_CORRECTIONS__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-corrections-v4.js', document.baseURI);

  // Oprește controllerele vechi care instalau MutationObserver pe zone DOM largi.
  // Variantele noi sunt încărcate înainte ca version.js să poată porni implementările legacy.
  window.__EVIDENTA_PEDEPSE_OPTIONAL_FIX__ = true;
  window.__EVIDENTA_PEDEPSE_MODES_V4__ = true;
  window.__EVIDENTA_DISCLOSURE_HARDENING__ = true;

  function ensureStableController(selector, relativeSrc, datasetKey) {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = new URL(relativeSrc, scriptUrl).href;
    script.async = false;
    if (datasetKey) script.dataset[datasetKey] = 'true';
    document.head.appendChild(script);
  }

  ensureStableController(
    'script[data-evidenta-no-nonoptional-disclosures]',
    './no-nonoptional-disclosures-v1.js?v=2',
    'evidentaNoNonoptionalDisclosures'
  );
  ensureStableController(
    'script[data-evidenta-pedepse-modes-v5]',
    './pedepse-modes-v5.js?v=1',
    'evidentaPedepseModesV5'
  );
  ensureStableController(
    'script[data-evidenta-pedepse-optional-fix-v2]',
    './pedepse-optional-fix-v2.js?v=1',
    'evidentaPedepseOptionalFixV2'
  );
  ensureStableController(
    'script[data-evidenta-disclosure-hardening-v2]',
    './disclosure-hardening-v2.js?v=1',
    'evidentaDisclosureHardeningV2'
  );

  function ensurePrisonReceivedStyles() {
    if (document.getElementById('ev-prison-received-style')) return;
    const style = document.createElement('style');
    style.id = 'ev-prison-received-style';
    style.textContent = `
      #prisonReceivedControl { min-width: 0; }
      #prisonReceivedControl .ev-prison-same-check {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        min-height: 44px;
        margin: 0;
        cursor: pointer;
        font-weight: 800;
        line-height: 1.35;
      }
      #prisonReceivedControl .ev-prison-same-check input {
        flex: 0 0 auto;
        width: 20px !important;
        min-width: 20px !important;
        height: 20px !important;
        min-height: 20px !important;
        margin: 2px 0 0 !important;
        padding: 0 !important;
      }
      #prisonReceivedDateField { margin-top: 8px; }
      #prisonReceivedDateField[hidden] { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  function setupPrisonReceivedControl() {
    const input = document.getElementById('prisonReceivedDate');
    if (!input) return null;

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

    ensurePrisonReceivedStyles();
    return {
      outer,
      field: document.getElementById('prisonReceivedDateField'),
      checkbox: document.getElementById('prisonReceivedSameAsStart'),
      input,
      start: document.getElementById('startDate')
    };
  }

  function syncPrisonReceivedControl({ infer = false } = {}) {
    const control = setupPrisonReceivedControl();
    if (!control?.checkbox || !control.field || !control.input || !control.start) return;

    const startValue = control.start.value.trim();
    const receivedValue = control.input.value.trim();
    if (infer) control.checkbox.checked = !receivedValue || receivedValue === startValue;

    if (control.checkbox.checked) control.input.value = startValue;
    control.field.hidden = control.checkbox.checked;
    control.checkbox.setAttribute('aria-expanded', String(!control.checkbox.checked));
  }

  function syncQuickVisibility() {
    const control = setupPrisonReceivedControl();
    if (!control?.outer) return;
    control.outer.hidden = document.body.classList.contains('ev-quick-mode') || document.body.classList.contains('ev-preventive-mode');
    if (!control.outer.hidden) syncPrisonReceivedControl();
  }

  function showPrisonReceivedRequiredError() {
    const control = setupPrisonReceivedControl();
    if (!control?.checkbox || control.checkbox.checked || control.input.value.trim()) return false;
    const error = document.getElementById('errorContainer');
    if (error) {
      error.textContent = '• Introduceți data intrării în penitenciar/centru.';
      error.classList.add('visible');
    }
    control.field.hidden = false;
    control.input.focus();
    return true;
  }

  function patchPedepseFunctions() {
    if (typeof window.calculateAll === 'function' && !window.calculateAll.__evPrisonDatePatched) {
      const baseCalculate = window.calculateAll;
      const wrappedCalculate = function(...args) {
        syncPrisonReceivedControl();
        if (showPrisonReceivedRequiredError()) return;
        return baseCalculate.apply(this, args);
      };
      wrappedCalculate.__evPrisonDatePatched = true;
      window.calculateAll = wrappedCalculate;
    }

    if (typeof window.populateStoredCase === 'function' && !window.populateStoredCase.__evPrisonDatePatched) {
      const basePopulate = window.populateStoredCase;
      const wrappedPopulate = function(...args) {
        const result = basePopulate.apply(this, args);
        syncPrisonReceivedControl({ infer: true });
        syncQuickVisibility();
        return result;
      };
      wrappedPopulate.__evPrisonDatePatched = true;
      window.populateStoredCase = wrappedPopulate;
    }

    if (typeof window.setToday === 'function' && !window.setToday.__evPrisonDatePatched) {
      const baseSetToday = window.setToday;
      const wrappedSetToday = function(id, ...args) {
        const result = baseSetToday.call(this, id, ...args);
        if (id === 'startDate') syncPrisonReceivedControl();
        return result;
      };
      wrappedSetToday.__evPrisonDatePatched = true;
      window.setToday = wrappedSetToday;
    }
  }

  function removeOfficerSuiteNav() {
    if (!String(document.body?.dataset.evPage || '').startsWith('ofiter')) return;
    document.querySelector('.ev-mobile-nav')?.remove();
    document.querySelector('.ev-mobile-more-sheet')?.remove();
    document.body.classList.remove('ev-mobile-more-open');
  }

  function patchOverlapNotices(root = document) {
    root.querySelectorAll?.('.overlap-notice p').forEach(paragraph => {
      const text = paragraph.textContent || '';
      if (!text.includes('perioadele deduse')) return;
      const next = text.replace(
        'Zilele comune au fost numărate o singură dată.',
        'Intervalele au fost calculate integral, inclusiv porțiunile suprapuse. Verifică dacă suprapunerea este intenționată.'
      );
      if (next !== text) paragraph.textContent = next;
    });
  }

  function patchText(root) {
    if (!root) return;
    const changes = [
      ['după unificarea suprapunerilor', 'prin însumarea intervalelor introduse; suprapunerile sunt calculate integral și semnalate separat'],
      ['Zilele comune vor fi numărate o singură dată.', 'Intervalele sunt calculate integral; verifică dacă suprapunerea este intenționată.']
    ];
    const patchNode = node => {
      const value = node.nodeValue || '';
      let next = value;
      for (const [from, to] of changes) next = next.replaceAll(from, to);
      if (next !== value) node.nodeValue = next;
    };
    if (root.nodeType === Node.TEXT_NODE) {
      patchNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root !== document.body) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) patchNode(node);
    patchOverlapNotices(root);
  }

  function refreshAfterAction() {
    syncPrisonReceivedControl();
    syncQuickVisibility();
    patchText(document.body);
  }

  function init() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });

    setupPrisonReceivedControl();
    syncPrisonReceivedControl({ infer: true });
    patchPedepseFunctions();
    removeOfficerSuiteNav();
    refreshAfterAction();

    const checkbox = document.getElementById('prisonReceivedSameAsStart');
    checkbox?.addEventListener('change', () => syncPrisonReceivedControl());

    document.addEventListener('input', event => {
      if (event.target.id !== 'startDate') return;
      requestAnimationFrame(() => syncPrisonReceivedControl());
    });

    document.addEventListener('click', event => {
      const relevant = event.target.closest('#calcBtn,[data-mode],#addDedBtn,#addManDedBtn,#addNonExecBtn,.btn-today[data-target="startDate"]');
      if (!relevant) return;
      requestAnimationFrame(refreshAfterAction);
    });
    document.addEventListener('change', event => {
      if (!event.target.closest('#liberationArticle,#lifeSentence,.ded-type,#prisonReceivedSameAsStart')) return;
      requestAnimationFrame(refreshAfterAction);
    });

    window.setTimeout(() => {
      patchPedepseFunctions();
      syncPrisonReceivedControl({ infer: true });
      refreshAfterAction();
    }, 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
