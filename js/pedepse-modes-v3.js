(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_MODES_V3__) return;
  window.__EVIDENTA_PEDEPSE_MODES_V3__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pedepse-modes-v3.js', document.baseURI);

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-pedepse-modes-v3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/pedepse-modes-v3.css?v=2', scriptUrl).href;
    link.dataset.evidentaPedepseModesV3 = 'true';
    document.head.appendChild(link);
  }

  function isPedepse() {
    return document.body?.dataset.evPage === 'pedepse' || (
      document.getElementById('calcBtn') &&
      document.getElementById('masuri-preventive-heading')
    );
  }

  function removeLegacyPreventiveToggle(card) {
    const optional = document.querySelector('.ev-optional-tools');
    if (!optional || !card) return;
    optional.querySelectorAll('.ev-optional-toggle').forEach(button => {
      const controls = button.getAttribute('aria-controls');
      const text = button.textContent?.toLocaleLowerCase('ro') || '';
      if ((controls && controls === card.id) || text.includes('măsuri preventive') || text.includes('masuri preventive')) {
        button.remove();
      }
    });
    const buttons = optional.querySelector('.ev-optional-tools__buttons');
    if (buttons && !buttons.children.length) optional.remove();
  }

  function removeEmptyAdvancedDisclosure() {
    const body = document.querySelector('.ev-mobile-advanced-details__body');
    const details = body?.closest('.ev-mobile-advanced-details');
    if (body && details && body.children.length === 0) details.remove();
  }

  function normalizeModeLabels(mode) {
    const quick = mode.querySelector('[data-mode="quick"]');
    const full = mode.querySelector('[data-mode="full"]');
    if (quick) quick.textContent = 'Calcul rapid';
    if (full) full.textContent = 'Calcul complet LC';
  }

  function ensurePreventivePanel(mode) {
    let panel = document.querySelector('.ev-preventive-mode-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'ev-preventive-mode-panel';
      panel.hidden = true;
      panel.setAttribute('aria-labelledby', 'masuri-preventive-heading');
      panel.innerHTML = '<div class="ev-preventive-mode-panel__body"></div>';
      mode.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  function movePreventiveCard(mode) {
    const heading = document.getElementById('masuri-preventive-heading');
    const card = heading?.closest('.card');
    if (!card) return null;

    const panel = ensurePreventivePanel(mode);
    const body = panel.querySelector('.ev-preventive-mode-panel__body');
    if (!body) return panel;

    removeLegacyPreventiveToggle(card);
    heading.textContent = 'CALCUL MĂSURI PREVENTIVE';
    card.dataset.evPreventiveCard = 'true';
    card.classList.remove('ev-optional-card');
    card.hidden = false;

    if (card.parentElement !== body) body.appendChild(card);
    removeEmptyAdvancedDisclosure();
    return panel;
  }

  function ensureThirdModeButton(mode) {
    let button = mode.querySelector('[data-mode="preventive"]');
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.dataset.mode = 'preventive';
    button.textContent = 'Măsuri preventive';
    mode.appendChild(button);
    return button;
  }

  function setActiveMode(mode, value) {
    document.body.classList.toggle('ev-preventive-mode', value === 'preventive');
    if (value === 'preventive') document.body.classList.remove('ev-quick-mode');

    mode.querySelectorAll('[data-mode]').forEach(button => {
      const active = button.dataset.mode === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const panel = movePreventiveCard(mode);
    if (panel) panel.hidden = value !== 'preventive';
  }

  function currentMode(mode) {
    return mode.querySelector('[data-mode].is-active')?.dataset.mode || 'quick';
  }

  function init() {
    ensureStyles();
    if (!isPedepse()) return;

    const mode = document.querySelector('.ev-calc-mode');
    if (!mode || mode.dataset.evThreeModes === 'true') return;
    mode.dataset.evThreeModes = 'true';
    mode.setAttribute('role', 'group');
    mode.setAttribute('aria-label', 'Tip calcul');

    normalizeModeLabels(mode);
    movePreventiveCard(mode);
    ensureThirdModeButton(mode);

    mode.querySelectorAll('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });

    mode.addEventListener('click', event => {
      const button = event.target.closest('[data-mode]');
      if (!button) return;
      const requested = button.dataset.mode;
      // Controllerul existent gestionează rapid/complet. Aplicăm starea finală după el,
      // iar calculatorul măsurilor preventive rămâne complet separat de opțiunile avansate.
      queueMicrotask(() => setActiveMode(mode, requested));
    });

    setActiveMode(mode, currentMode(mode));

    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        movePreventiveCard(mode);
      });
    });
    observer.observe(document.body, { childList:true, subtree:true });
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
