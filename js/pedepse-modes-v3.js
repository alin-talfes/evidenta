(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_MODES_V3__) return;
  window.__EVIDENTA_PEDEPSE_MODES_V3__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pedepse-modes-v3.js', document.baseURI);

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-pedepse-modes-v3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/pedepse-modes-v3.css?v=1', scriptUrl).href;
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

  function buildPreventivePanel() {
    const heading = document.getElementById('masuri-preventive-heading');
    const card = heading?.closest('.card');
    if (!card) return null;

    removeLegacyPreventiveToggle(card);

    let panel = document.querySelector('.ev-preventive-mode-panel');
    if (!panel) {
      panel = document.createElement('details');
      panel.className = 'ev-preventive-mode-panel';
      panel.hidden = true;
      panel.innerHTML = '<summary>Prelungiri măsuri preventive</summary><div class="ev-preventive-mode-panel__body"></div>';
      document.querySelector('.ev-calc-mode')?.insertAdjacentElement('afterend', panel);
    }

    const body = panel.querySelector('.ev-preventive-mode-panel__body');
    if (body && card.parentElement !== body) body.appendChild(card);
    card.hidden = false;
    card.classList.remove('ev-optional-card');
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
      button.classList.toggle('is-active', button.dataset.mode === value);
      button.setAttribute('aria-pressed', String(button.dataset.mode === value));
    });

    const panel = document.querySelector('.ev-preventive-mode-panel');
    if (panel) {
      panel.hidden = value !== 'preventive';
      if (value === 'preventive' && panel.dataset.evOpenedOnce !== 'true') {
        panel.open = true;
        panel.dataset.evOpenedOnce = 'true';
      }
    }

    if (value !== 'preventive') {
      document.querySelector('.ev-preventive-mode-panel')?.setAttribute('hidden', '');
    }
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

    buildPreventivePanel();
    ensureThirdModeButton(mode);

    mode.querySelectorAll('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });

    mode.addEventListener('click', event => {
      const button = event.target.closest('[data-mode]');
      if (!button) return;
      const requested = button.dataset.mode;
      // Listenerul vechi gestionează rapid/complet. Aplicăm starea finală după el,
      // astfel încât al treilea mod să rămână complet separat.
      queueMicrotask(() => setActiveMode(mode, requested));
    });

    setActiveMode(mode, currentMode(mode));

    const observer = new MutationObserver(() => {
      const card = document.getElementById('masuri-preventive-heading')?.closest('.card');
      const panelBody = document.querySelector('.ev-preventive-mode-panel__body');
      if (card && panelBody && card.parentElement !== panelBody) {
        removeLegacyPreventiveToggle(card);
        panelBody.appendChild(card);
        card.hidden = false;
      }
    });
    observer.observe(document.getElementById('main-content') || document.body, { childList:true, subtree:true });
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
