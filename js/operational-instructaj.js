(() => {
  'use strict';

  if (window.__EVIDENTA_OPERATIONAL_INSTRUCTAJ__) return;
  window.__EVIDENTA_OPERATIONAL_INSTRUCTAJ__ = true;

  function init(attempt = 0) {
    const search = document.getElementById('search');
    if (!search) {
      if (attempt < 20) setTimeout(() => init(attempt + 1), 150);
      return;
    }
    if (document.querySelector('.ev-operational-search')) return;
    const originalParent = search.parentElement;
    const section = document.createElement('section');
    section.className = 'ev-operational-search';
    section.innerHTML = `
      <label for="search"><strong>CĂUTARE OPERATIVĂ</strong><span>Găsește rapid o procedură de evidență.</span></label>
      <div class="ev-operational-search__input"></div>
      <div class="ev-operational-search__chips">
        <button type="button" data-q="mandat">Mandat</button><button type="button" data-q="deducere">Deducere</button><button type="button" data-q="contopire">Contopire</button><button type="button" data-q="transfer">Transfer</button>
      </div>`;
    const inputHost = section.querySelector('.ev-operational-search__input');
    inputHost.appendChild(search);
    search.placeholder = 'Mandat, deducere, contopire, liberare…';
    originalParent?.classList.add('ev-search-placeholder-empty');
    const shell = document.querySelector('.ev-shell');
    (shell || document.body.firstElementChild)?.insertAdjacentElement('afterend', section);

    const openProcedures = () => {
      const trigger = document.querySelector('[data-view="proceduri"]');
      if (trigger instanceof HTMLElement) trigger.click();
      const procedures = document.getElementById('proceduri');
      if (procedures) procedures.hidden = false;
    };
    search.addEventListener('input', () => { if (search.value.trim()) openProcedures(); });
    section.querySelectorAll('[data-q]').forEach(button => button.addEventListener('click', () => {
      search.value = button.dataset.q;
      search.dispatchEvent(new Event('input', { bubbles:true }));
      openProcedures();
      setTimeout(() => document.getElementById('workflow-list')?.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once:true });
  else init();
})();
