(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_MODES_V5__) return;
  window.__EVIDENTA_PEDEPSE_MODES_V5__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pedepse-modes-v5.js', document.baseURI);

  function ensureStyles() {
    if (document.querySelector('link[data-evidenta-pedepse-modes-v3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/pedepse-modes-v3.css?v=3', scriptUrl).href;
    link.dataset.evidentaPedepseModesV3 = 'true';
    document.head.appendChild(link);
  }

  function isPedepse() {
    return document.body?.dataset.evPage === 'pedepse' || Boolean(
      document.getElementById('calcBtn') && document.getElementById('masuri-preventive-heading')
    );
  }

  function removeLegacyPreventiveToggle(card) {
    const optional = document.querySelector('.ev-optional-tools');
    if (optional && card) {
      optional.querySelectorAll('.ev-optional-toggle').forEach(button => {
        const controls = button.getAttribute('aria-controls');
        const text = button.textContent?.toLocaleLowerCase('ro') || '';
        if ((controls && controls === card.id) || text.includes('măsuri preventive') || text.includes('masuri preventive')) button.remove();
      });
    }
  }

  function removeEmptyAdvancedDisclosure() {
    document.querySelectorAll('.ev-mobile-advanced-details').forEach(details => {
      const body = details.querySelector('.ev-mobile-advanced-details__body');
      if (!body || body.children.length === 0) details.remove();
    });
  }

  function normalizeModeLabels(mode) {
    const labels = {
      quick: 'Calcul rapid',
      full: 'Calcul complet LC',
      preventive: 'Măsuri preventive'
    };
    Object.entries(labels).forEach(([key, label]) => {
      const button = mode.querySelector(`[data-mode="${key}"]`);
      if (button && button.textContent !== label) button.textContent = label;
    });
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
    if (heading.textContent !== 'CALCUL MĂSURI PREVENTIVE') heading.textContent = 'CALCUL MĂSURI PREVENTIVE';
    card.dataset.evPreventiveCard = 'true';
    card.classList.remove('ev-optional-card');
    if (card.hidden) card.hidden = false;
    if (card.parentElement !== body) body.appendChild(card);
    removeEmptyAdvancedDisclosure();
    return panel;
  }

  function ensureThirdModeButton(mode) {
    let button = mode.querySelector('[data-mode="preventive"]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.mode = 'preventive';
      mode.appendChild(button);
    }
    if (button.textContent !== 'Măsuri preventive') button.textContent = 'Măsuri preventive';
    return button;
  }

  function setActiveMode(mode, value) {
    const requested = value === 'preventive' ? 'preventive' : value === 'full' ? 'full' : 'quick';
    document.body.classList.toggle('ev-preventive-mode', requested === 'preventive');
    if (requested === 'preventive') document.body.classList.remove('ev-quick-mode');

    mode.querySelectorAll('[data-mode]').forEach(button => {
      const active = button.dataset.mode === requested;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const panel = movePreventiveCard(mode);
    if (panel && panel.hidden === (requested === 'preventive')) panel.hidden = requested !== 'preventive';
  }

  function currentMode(mode) {
    if (document.body.classList.contains('ev-preventive-mode')) return 'preventive';
    return mode.querySelector('[data-mode].is-active')?.dataset.mode || 'quick';
  }

  function repairMode(mode) {
    if (!mode) return false;
    mode.dataset.evThreeModes = 'true';
    mode.dataset.evThreeModesV5 = 'true';
    mode.setAttribute('role', 'group');
    mode.setAttribute('aria-label', 'Tip calcul');
    ensureThirdModeButton(mode);
    normalizeModeLabels(mode);
    movePreventiveCard(mode);
    mode.querySelectorAll('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
    return true;
  }

  function initMode(mode) {
    if (!mode || !document.getElementById('masuri-preventive-heading')) return false;
    const alreadyBound = mode.dataset.evThreeModesV5 === 'true';
    repairMode(mode);

    if (!alreadyBound) {
      mode.addEventListener('click', event => {
        const button = event.target.closest('[data-mode]');
        if (!button || !mode.contains(button)) return;
        const requested = button.dataset.mode;

        if (requested === 'preventive') {
          event.preventDefault();
          event.stopImmediatePropagation();
          setActiveMode(mode, 'preventive');
          return;
        }

        window.setTimeout(() => setActiveMode(mode, requested), 0);
      }, true);
    }

    setActiveMode(mode, currentMode(mode));
    return true;
  }

  function tryInit() {
    if (!isPedepse()) return true;
    return initMode(document.querySelector('.ev-calc-mode'));
  }

  function initDeterministically() {
    ensureStyles();
    if (tryInit()) return;
    [0, 40, 120, 300, 700].forEach(delay => window.setTimeout(tryInit, delay));
  }

  ensureStyles();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeterministically, { once: true });
  } else {
    initDeterministically();
  }
  window.addEventListener('evidenta:shellready', tryInit);
  window.addEventListener('load', tryInit, { once: true });
})();
