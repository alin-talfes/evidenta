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
      // Copiază numai rezultatul, fără butonul de acțiune.
      const resultCard = resultArea.querySelector('.result-card.success');
      const text = resultCard?.innerText?.trim();
      if (!text) return;

      const originalLabel = 'COPIAZĂ REZULTATUL';
      button.disabled = true;
      button.setAttribute('aria-live', 'polite');
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const temporary = document.createElement('textarea');
          temporary.value = text;
          temporary.setAttribute('readonly', '');
          temporary.style.position = 'fixed';
          temporary.style.opacity = '0';
          document.body.appendChild(temporary);
          temporary.select();
          const copied = document.execCommand('copy');
          temporary.remove();
          if (!copied) throw new Error('Clipboard unavailable');
        }
        button.textContent = 'COPIAT';
      } catch (error) {
        console.error('Nu s-a putut copia rezultatul Transfer:', error);
        button.textContent = 'COPIERE EȘUATĂ';
      } finally {
        button.disabled = false;
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 1600);
      }
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