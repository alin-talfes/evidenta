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

  function init() {
    const form = document.getElementById('transferForm');
    const search = document.getElementById('cautaBtn');
    if (!form || !search) return;
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
