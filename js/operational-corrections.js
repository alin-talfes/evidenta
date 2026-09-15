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
