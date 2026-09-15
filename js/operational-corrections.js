(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CORRECTIONS__) return;
  window.__EVIDENTA_OPERATIONAL_CORRECTIONS__ = true;

  function syncQuickVisibility() {
    const received = document.getElementById('prisonReceivedDate');
    const outer = received?.parentElement?.parentElement;
    if (outer) outer.hidden = document.body.classList.contains('ev-quick-mode');
  }

  function patchText(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const changes = [
      ['după unificarea suprapunerilor', 'prin însumarea intervalelor introduse; suprapunerile sunt calculate integral și semnalate separat'],
      ['Zilele comune vor fi numărate o singură dată.', 'Intervalele sunt calculate integral; verifică dacă suprapunerea este intenționată.']
    ];
    let node;
    while ((node = walker.nextNode())) {
      let value = node.nodeValue || '';
      let next = value;
      for (const [from, to] of changes) next = next.replaceAll(from, to);
      if (next !== value) node.nodeValue = next;
    }
  }

  function init() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
    syncQuickVisibility();
    patchText();

    const bodyObserver = new MutationObserver(() => {
      syncQuickVisibility();
      patchText();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
