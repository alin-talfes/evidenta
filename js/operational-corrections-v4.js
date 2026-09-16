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

  function syncQuickVisibility() {
    const received = document.getElementById('prisonReceivedDate');
    const outer = received?.parentElement?.parentElement;
    if (outer) outer.hidden = document.body.classList.contains('ev-quick-mode');
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
    syncQuickVisibility();
    patchText(document.body);
  }

  function init() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
    removeOfficerSuiteNav();
    refreshAfterAction();

    document.addEventListener('click', event => {
      if (!event.target.closest('#calcBtn,[data-mode],#addDedBtn,#addManDedBtn,#addNonExecBtn')) return;
      requestAnimationFrame(refreshAfterAction);
    });
    document.addEventListener('change', event => {
      if (!event.target.closest('#liberationArticle,#lifeSentence,.ded-type')) return;
      requestAnimationFrame(refreshAfterAction);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
