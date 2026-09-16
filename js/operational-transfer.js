(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_TRANSFER__) return;
  window.__EVIDENTA_OPERATIONAL_TRANSFER__ = true;

  function addTransferCopy() {
    const resultArea = document.getElementById('resultArea');
    if (!resultArea || !resultArea.querySelector('.result-card.success') || resultArea.querySelector('[data-transfer-copy]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline ev-transfer-copy';
    button.dataset.transferCopy = 'true';
    button.textContent = 'COPIAZĂ REZULTATUL';
    button.addEventListener('click', async () => {
      const text = resultArea.innerText.trim();
      try { await navigator.clipboard.writeText(text); } catch (_) {}
      button.textContent = 'COPIAT';
      setTimeout(() => { button.textContent = 'COPIAZĂ REZULTATUL'; }, 1200);
    });
    resultArea.appendChild(button);
  }

  function compactTransfer(card) {
    if (!card) return;
    card.classList.add('ev-transfer-compact');
    const help = card.querySelector('.section-help');
    if (!help || help.closest('.ev-transfer-help-details')) return;
    const details = document.createElement('details');
    details.className = 'ev-transfer-help-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Cum se folosește';
    help.insertAdjacentElement('beforebegin', details);
    details.append(summary, help);
    window.EvidentaDisclosurePolicy?.normalize?.(details);
    window.EvidentaDisclosureA11y?.scan?.(details);
  }

  function init() {
    const form = document.getElementById('transferForm');
    const search = document.getElementById('cautaBtn');
    if (!form || !search) return;
    const card = form.closest('.card');
    compactTransfer(card);
    document.body.classList.add('ev-transfer-auto');
    let timer;
    const run = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!document.getElementById('judet')?.value) return;
        search.click();
      }, 100);
    };
    form.addEventListener('change', run);
    document.getElementById('toggleGroup')?.addEventListener('click', event => {
      if (event.target.closest('.toggle-btn')) setTimeout(run, 0);
    });
    const resultArea = document.getElementById('resultArea');
    if (resultArea) new MutationObserver(addTransferCopy).observe(resultArea, { childList:true, subtree:true });
    addTransferCopy();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();