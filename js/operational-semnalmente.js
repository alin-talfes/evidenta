(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_SEMNALMENTE__) return;
  window.__EVIDENTA_OPERATIONAL_SEMNALMENTE__ = true;

  function init() {
    if (!document.getElementById('file-frontal')) return;
    document.getElementById('file-frontal')?.setAttribute('capture', 'environment');
    document.getElementById('file-profil')?.setAttribute('capture', 'environment');

    const notice = document.querySelector('.notice-panel');
    if (notice && !notice.querySelector('[data-notice-toggle]')) {
      notice.classList.add('ev-collapsible-notice', 'is-collapsed');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.noticeToggle = 'true';
      button.className = 'ev-inline-toggle';
      button.textContent = 'DETALII';
      button.addEventListener('click', () => {
        const collapsed = notice.classList.toggle('is-collapsed');
        button.textContent = collapsed ? 'DETALII' : 'ASCUNDE';
      });
      notice.appendChild(button);
    }

    const saved = document.getElementById('saved-list');
    if (saved && !saved.querySelector('[data-saved-toggle]')) {
      saved.classList.add('ev-saved-collapsed');
      const head = saved.querySelector('.saved-heading-row') || saved.firstElementChild;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-ghost';
      button.dataset.savedToggle = 'true';
      button.textContent = 'ARATĂ ARHIVA';
      button.addEventListener('click', () => {
        const collapsed = saved.classList.toggle('ev-saved-collapsed');
        button.textContent = collapsed ? 'ARATĂ ARHIVA' : 'ASCUNDE ARHIVA';
      });
      head?.appendChild(button);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
