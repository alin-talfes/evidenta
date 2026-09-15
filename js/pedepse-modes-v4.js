(() => {
  'use strict';

  if (window.__EVIDENTA_PEDEPSE_MODES_V4__) return;
  window.__EVIDENTA_PEDEPSE_MODES_V4__ = true;

  const scriptUrl = new URL(document.currentScript?.src || 'js/pedepse-modes-v4.js', document.baseURI);

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
      const buttons = optional.querySelector('.ev-optional-tools__buttons');
      if (buttons && !buttons.children.length) optional.remove();
    }

    document.querySelectorAll('.ev-mobile-advanced-details summary, .ev-mobile-advanced-details button').forEach(control => {
      const text = control.textContent?.toLocaleLowerCase('ro') || '';
      if (text.includes('măsuri preventive') || text.includes('masuri preventive')) control.remove();
    });
  }

  function removeEmptyAdvancedDisclosure() {
    const body = document.querySelector('.ev-mobile-advanced-details__body');
    const details = body?.closest('.ev-mobile-advanced-details');
    if (body && details && body.children.length === 0) details.remove();
  }

  function normalizeModeLabels(mode) {
    const quick = mode.querySelector('[data-mode="quick"]');
    const full = mode.querySelector('[data-mode="full"]');
    const preventive = mode.querySelector('[data-mode="preventive"]');
    if (quick && quick.textContent !== 'Calcul rapid') quick.textContent = 'Calcul rapid';
    if (full && full.textContent !== 'Calcul complet LC') full.textContent = 'Calcul complet LC';
    if (preventive && preventive.textContent !== 'Măsuri preventive') preventive.textContent = 'Măsuri preventive';
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
    card.hidden = false;
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
    button.textContent = 'Măsuri preventive';
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
    if (panel) panel.hidden = requested !== 'preventive';
  }

  function currentMode(mode) {
    if (document.body.classList.contains('ev-preventive-mode')) return 'preventive';
    return mode.querySelector('[data-mode].is-active')?.dataset.mode || 'quick';
  }

  function guardPreventiveOwnership(mode) {
    if (!mode || mode.dataset.evPreventiveGuard === 'true') return;
    mode.dataset.evPreventiveGuard = 'true';

    const root = document.getElementById('main-content') || document.body;
    let observer;
    const repair = () => {
      movePreventiveCard(mode);
      const optional = document.querySelector('.ev-optional-tools');
      if (!optional) return false;
      const stray = [...optional.querySelectorAll('.ev-optional-toggle')].some(button => {
        const text = button.textContent?.toLocaleLowerCase('ro') || '';
        return text.includes('măsuri preventive') || text.includes('masuri preventive');
      });
      if (!stray) {
        observer?.disconnect();
        return true;
      }
      return false;
    };

    if (repair()) return;
    observer = new MutationObserver(() => repair());
    observer.observe(root, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 7000);
  }

  function repairMode(mode) {
    if (!mode) return false;
    mode.dataset.evThreeModes = 'true';
    mode.dataset.evThreeModesV4 = 'true';
    mode.setAttribute('role', 'group');
    mode.setAttribute('aria-label', 'Tip calcul');
    ensureThirdModeButton(mode);
    normalizeModeLabels(mode);
    movePreventiveCard(mode);
    guardPreventiveOwnership(mode);
    mode.querySelectorAll('[data-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
    return true;
  }

  function initMode(mode) {
    if (!mode) return false;

    const heading = document.getElementById('masuri-preventive-heading');
    if (!heading) return false;

    const alreadyBound = mode.dataset.evThreeModesV4 === 'true';
    repairMode(mode);
    if (alreadyBound) {
      setActiveMode(mode, currentMode(mode));
      return true;
    }

    mode.addEventListener('click', event => {
      const button = event.target.closest('[data-mode]');
      if (!button || !mode.contains(button)) return;
      const requested = button.dataset.mode;

      // Controllerul vechi al modurilor cunoaște doar quick/full și ar interpreta
      // „preventive” ca quick. Interceptăm exclusiv al treilea mod înainte de bubble.
      if (requested === 'preventive') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveMode(mode, 'preventive');
        return;
      }

      // Pentru quick/full lăsăm controllerul existent să gestioneze câmpurile LC,
      // apoi sincronizăm doar starea vizuală/panoul separat.
      queueMicrotask(() => setActiveMode(mode, requested));
    }, true);

    setActiveMode(mode, currentMode(mode));
    return true;
  }

  function init() {
    ensureStyles();
    if (!isPedepse()) return;
    if (initMode(document.querySelector('.ev-calc-mode'))) return;

    // .ev-calc-mode este creat dinamic de controllerul operațional. Observăm doar
    // până la inițializare, apoi deconectăm imediat observer-ul. Nu există observer permanent.
    const observer = new MutationObserver(() => {
      if (initMode(document.querySelector('.ev-calc-mode'))) observer.disconnect();
    });
    observer.observe(document.body, { childList:true, subtree:true });
    window.setTimeout(() => observer.disconnect(), 5000);
  }

  ensureStyles();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
