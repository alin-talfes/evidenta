(() => {
  'use strict';

  if (window.__EVIDENTA_DISCLOSURE_HARDENING_V2__) return;
  window.__EVIDENTA_DISCLOSURE_HARDENING_V2__ = true;

  let idCounter = 0;
  let scanQueued = false;

  const DETAILS_SELECTOR = [
    '.ev-mobile-lc-details',
    '.ev-mobile-advanced-details',
    '.ev-ai-evidence-details',
    '.ev-contopiri-result-details',
    '.ev-transfer-help-details',
    '.ev-ai-secondary',
    '.ev-ai-components',
    '.ev-legal-details'
  ].join(',');

  function ensureId(element, prefix = 'ev-disclosure') {
    if (!element) return '';
    if (!element.id) {
      idCounter += 1;
      element.id = `${prefix}-${idCounter}`;
    }
    return element.id;
  }

  function syncNativeDetails(details) {
    if (!(details instanceof HTMLElement)) return;
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    const body = [...details.children].find(child => child !== summary) || null;
    if (body) summary.setAttribute('aria-controls', ensureId(body));
    summary.setAttribute('aria-expanded', String(details.open));

    if (details.dataset.evDisclosureV2Bound === 'true') return;
    details.dataset.evDisclosureV2Bound = 'true';
    details.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', String(details.open));
    });
  }

  function bindClassToggle(button, container, collapsedClass, target) {
    if (!button || !container) return;
    if (target) button.setAttribute('aria-controls', ensureId(target));
    const sync = () => button.setAttribute('aria-expanded', String(!container.classList.contains(collapsedClass)));
    sync();

    if (button.dataset.evDisclosureV2Bound === 'true') return;
    button.dataset.evDisclosureV2Bound = 'true';
    button.addEventListener('click', () => queueScan());
  }

  function syncCustomDisclosures(root = document) {
    root.querySelectorAll?.('[data-notice-toggle]').forEach(button => {
      const notice = button.closest('.ev-collapsible-notice');
      const target = notice?.querySelector(':scope > div:not(.notice-icon)') || null;
      bindClassToggle(button, notice, 'is-collapsed', target);
    });

    root.querySelectorAll?.('[data-saved-toggle]').forEach(button => {
      const saved = button.closest('#saved-list, .saved-list');
      const target = saved?.querySelector('#saved-items') || null;
      bindClassToggle(button, saved, 'ev-saved-collapsed', target);
    });
  }

  function repairPreventiveCardOwnership() {
    const heading = document.getElementById('masuri-preventive-heading');
    const card = heading?.closest('.card');
    const panelBody = document.querySelector('.ev-preventive-mode-panel__body');
    if (!card || !panelBody || card.parentElement === panelBody) return;
    panelBody.appendChild(card);
    if (card.hidden) card.hidden = false;

    document.querySelectorAll('.ev-mobile-advanced-details').forEach(advanced => {
      const advancedBody = advanced.querySelector('.ev-mobile-advanced-details__body');
      if (!advancedBody || advancedBody.children.length === 0) advanced.remove();
    });
  }

  function scan(root = document) {
    root.querySelectorAll?.(DETAILS_SELECTOR).forEach(syncNativeDetails);
    if (root.matches?.(DETAILS_SELECTOR)) syncNativeDetails(root);
    syncCustomDisclosures(root);
    repairPreventiveCardOwnership();
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    queueMicrotask(() => {
      scanQueued = false;
      scan(document);
    });
  }

  function init() {
    scan(document);
    document.addEventListener('click', queueScan, true);
    document.addEventListener('change', queueScan, true);
    window.addEventListener('evidenta:shellready', queueScan);
    window.addEventListener('load', queueScan, { once: true });
  }

  window.EvidentaDisclosureA11y = Object.freeze({ scan, syncNativeDetails });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
