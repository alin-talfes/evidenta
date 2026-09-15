(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CORRECTIONS__) return;
  window.__EVIDENTA_OPERATIONAL_CORRECTIONS__ = true;

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
      paragraph.textContent = text.replace(
        'Zilele comune au fost numărate o singură dată.',
        'Intervalele au fost calculate integral, inclusiv porțiunile suprapuse. Verifică dacă suprapunerea este intenționată.'
      );
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

  function init() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
    syncQuickVisibility();
    removeOfficerSuiteNav();
    patchText(document.body);
    patchOverlapNotices(document);

    const bodyObserver = new MutationObserver(records => {
      let classChanged = false;
      for (const record of records) {
        if (record.type === 'attributes' && record.target === document.body) classChanged = true;
        for (const node of record.addedNodes || []) patchText(node);
      }
      if (classChanged) syncQuickVisibility();
      removeOfficerSuiteNav();
      patchOverlapNotices(document);
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
