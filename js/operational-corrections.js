(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_CORRECTIONS__) return;
  window.__EVIDENTA_OPERATIONAL_CORRECTIONS__ = true;

  function syncQuickVisibility() {
    const received = document.getElementById('prisonReceivedDate');
    const outer = received?.parentElement?.parentElement;
    if (outer) outer.hidden = document.body.classList.contains('ev-quick-mode');
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
  }

  function init() {
    document.querySelectorAll('.date-masked').forEach(input => {
      if (!input.getAttribute('inputmode')) input.setAttribute('inputmode', 'numeric');
      if (!input.getAttribute('autocomplete')) input.setAttribute('autocomplete', 'off');
    });
    syncQuickVisibility();
    patchText(document.body);

    const bodyObserver = new MutationObserver(records => {
      let classChanged = false;
      for (const record of records) {
        if (record.type === 'attributes' && record.target === document.body) classChanged = true;
        for (const node of record.addedNodes || []) patchText(node);
      }
      if (classChanged) syncQuickVisibility();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
