(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CORRECTIONS__) return;
  window.__EVIDENTA_OPERATIONAL_CORRECTIONS__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/operational-corrections-v4.js', document.baseURI);

  // Blochează controllerele legacy; acest fișier orchestrează doar implementările stabile.
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
  ensureStableController(
    'script[data-evidenta-pedepse-prison-date]',
    './pedepse-prison-date.js?v=1',
    'evidentaPedepsePrisonDate'
  );

  function removeOfficerSuiteNav() {
    if (!String(document.body?.dataset.evPage || '').startsWith('ofiter')) return;
    document.querySelector('.ev-mobile-nav')?.remove();
    document.querySelector('.ev-mobile-more-sheet')?.remove();
    document.body.classList.remove('ev-mobile-more-open');
  }

  function normalizeDateInputs() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
  }

  function init() {
    normalizeDateInputs();
    removeOfficerSuiteNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
